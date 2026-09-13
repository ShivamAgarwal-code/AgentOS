import Anthropic from "@anthropic-ai/sdk";
import { CONNECTORS, getConnector, Connector } from "../connectors/catalog";

/**
 * AgentOS Agent Service
 * ---------------------
 * The "brain" that makes AgentOS fit the theme:
 *   "an AI agent that takes action across multiple external apps."
 *
 * Flow:
 *   1. plan()    — Claude (Anthropic) turns a natural-language goal into an
 *                  ordered, cross-app action plan, constrained to the user's
 *                  CONNECTED apps and each app's declared actions (the agent's
 *                  toolset). Uses structured outputs so the plan is always
 *                  valid JSON.
 *   2. execute() — each step is dispatched to its connector. Slack runs live
 *                  when credentials exist; every other app returns a realistic
 *                  simulated result so the end-to-end demo always works.
 *
 * A deterministic heuristic planner is used as a fallback whenever the
 * Anthropic key is missing or the model call fails — the demo never dead-ends.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export interface PlanStep {
  app_id: string;
  app_name: string;
  action_id: string;
  action_label: string;
  description: string;
  params: Record<string, string>;
  rationale: string;
}

export interface ExecutedStep extends PlanStep {
  status: "success" | "simulated" | "skipped" | "error";
  result: string;
  link?: string;
  finished_at: string;
}

export interface AgentRun {
  id: string;
  goal: string;
  summary: string;
  planner: "claude" | "heuristic";
  steps: ExecutedStep[];
  apps_used: string[];
  created_at: string;
}

const getClaudeClient = (): Anthropic | null => {
  // The SDK also resolves credentials from an `ant auth login` profile, but for
  // this demo we gate on the API key so the heuristic fallback kicks in cleanly.
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
};

/** Build the toolset description handed to the planner. */
function buildToolCatalog(connectedIds: string[]): { connectors: Connector[]; text: string } {
  const connectors = CONNECTORS.filter((c) => connectedIds.includes(c.id));
  const text = connectors
    .map((c) => {
      const acts = c.actions
        .map((a) => `    • ${a.id} (${a.label}): ${a.description} [params: ${a.params.join(", ")}]`)
        .join("\n");
      return `- ${c.name} [app_id: ${c.id}] — ${c.category}\n${acts}`;
    })
    .join("\n");
  return { connectors, text };
}

// JSON Schema for Claude structured outputs. Every object sets
// additionalProperties:false and lists all properties in `required`, as the
// structured-outputs feature requires.
const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description: "One or two sentences describing the cross-app workflow the agent will run.",
    },
    steps: {
      type: "array",
      description: "Ordered list of concrete actions across the connected apps.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          app_id: { type: "string", description: "The app_id of a CONNECTED app to act in." },
          action_id: { type: "string", description: "The action id to invoke on that app." },
          description: { type: "string", description: "Human summary of exactly what this step does." },
          rationale: { type: "string", description: "Why this step is needed to accomplish the goal." },
          params: {
            type: "array",
            description: "Key/value parameters for the action.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                key: { type: "string" },
                value: { type: "string" },
              },
              required: ["key", "value"],
            },
          },
        },
        required: ["app_id", "action_id", "description", "rationale", "params"],
      },
    },
  },
  required: ["summary", "steps"],
};

async function planWithClaude(goal: string, connectedIds: string[]): Promise<{ summary: string; steps: PlanStep[] } | null> {
  const client = getClaudeClient();
  if (!client) return null;

  const { text: toolText } = buildToolCatalog(connectedIds);
  const systemInstruction = `You are AgentOS, an autonomous AI operations agent that accomplishes goals by taking real actions ACROSS MULTIPLE external apps.

You are given a user goal and a catalog of the user's CONNECTED apps, each with a set of allowed actions (your tools). Produce a concise, ordered plan of concrete steps that, executed together, accomplish the goal.

Rules:
1. Only use apps and action ids that appear in the connected app catalog. Never invent apps or actions.
2. Prefer plans that span 2 or more DIFFERENT apps when the goal naturally calls for it — this is a cross-app orchestration agent.
3. Fill params with realistic, specific values inferred from the goal (real-sounding names, subjects, ticket titles, dates, etc.). Never leave a required param blank.
4. Keep steps atomic: one action per step. Order them the way they must actually happen.
5. 2–6 steps is ideal. Be decisive.`;

  const contents = `USER GOAL:\n${goal}\n\nCONNECTED APPS & AVAILABLE ACTIONS:\n${toolText}`;
  const jsonContract = `\n\nRespond with ONLY a single valid JSON object (no markdown, no code fences) conforming to this JSON schema:\n${JSON.stringify(planSchema)}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemInstruction + jsonContract,
      messages: [{ role: "user", content: contents }],
    });

    // The response is a single text block of JSON; strip any stray fences.
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) return null;
    let out = textBlock.text.trim();
    if (out.startsWith("```json")) out = out.slice(7);
    else if (out.startsWith("```")) out = out.slice(3);
    if (out.endsWith("```")) out = out.slice(0, -3);
    const parsed = JSON.parse(out.trim());

    const steps: PlanStep[] = (parsed.steps || [])
      .map((s: any) => {
        const connector = getConnector(s.app_id);
        const action = connector?.actions.find((a) => a.id === s.action_id) || connector?.actions[0];
        if (!connector || !action) return null;
        const params: Record<string, string> = {};
        (s.params || []).forEach((p: any) => {
          if (p?.key) params[p.key] = String(p.value ?? "");
        });
        return {
          app_id: connector.id,
          app_name: connector.name,
          action_id: action.id,
          action_label: action.label,
          description: s.description || action.description,
          params,
          rationale: s.rationale || "",
        } as PlanStep;
      })
      .filter(Boolean);

    if (!steps.length) return null;
    return { summary: parsed.summary || "Cross-app workflow", steps };
  } catch (err) {
    console.warn("[AgentOS] Claude planning failed, using heuristic fallback:", err);
    return null;
  }
}

/**
 * Deterministic fallback planner. Keyword-matches the goal against connected
 * apps so the demo produces a sensible multi-app plan even with no API key.
 */
function planHeuristically(goal: string, connectedIds: string[]): { summary: string; steps: PlanStep[] } {
  const g = goal.toLowerCase();
  const connected = CONNECTORS.filter((c) => connectedIds.includes(c.id));
  const has = (id: string) => connected.some((c) => c.id === id);
  const steps: PlanStep[] = [];

  const push = (appId: string, actionId: string, params: Record<string, string>, description: string, rationale: string) => {
    const c = getConnector(appId);
    if (!c || !connectedIds.includes(appId)) return;
    const a = c.actions.find((x) => x.id === actionId) || c.actions[0];
    steps.push({ app_id: c.id, app_name: c.name, action_id: a.id, action_label: a.label, params, description, rationale });
  };

  const mentions = (words: string[]) => words.some((w) => g.includes(w));

  if (mentions(["bug", "issue", "ticket", "incident", "error", "outage"])) {
    if (has("linear")) push("linear", "create_issue", { team: "Engineering", title: goal.slice(0, 60), description: goal, priority: "High" }, "File an engineering ticket capturing the issue.", "Track the work in the eng backlog.");
    else if (has("jira")) push("jira", "create_issue", { project: "ENG", summary: goal.slice(0, 60), description: goal, issue_type: "Bug" }, "Create a Jira bug ticket.", "Track the work in Jira.");
    else if (has("github")) push("github", "create_issue", { repo: "acme/app", title: goal.slice(0, 60), body: goal, labels: "bug" }, "Open a GitHub issue.", "Track the work in the repo.");
    if (has("slack")) push("slack", "send_message", { channel: "#engineering", text: `🚨 New issue logged: ${goal.slice(0, 80)}` }, "Alert the engineering channel.", "Give the team real-time visibility.");
  } else if (mentions(["meeting", "schedule", "call", "sync", "invite"])) {
    if (has("google_calendar")) push("google_calendar", "create_event", { title: goal.slice(0, 50), start: "tomorrow 10:00", end: "tomorrow 10:30", attendees: "team@acme.com" }, "Schedule the meeting and invite attendees.", "Book time on everyone's calendar.");
    if (has("slack")) push("slack", "send_message", { channel: "#general", text: `📅 Meeting scheduled: ${goal.slice(0, 70)}` }, "Announce the meeting in Slack.", "Notify participants.");
    if (has("gmail")) push("gmail", "send_email", { to: "team@acme.com", subject: `Invite: ${goal.slice(0, 40)}`, body: "You're invited. Details on the calendar invite." }, "Email the invite details.", "Reach people outside Slack.");
  } else if (mentions(["customer", "lead", "deal", "sales", "refund", "invoice"])) {
    if (has("hubspot")) push("hubspot", "log_note", { object_id: "contact:demo", note: goal }, "Log the customer interaction in the CRM.", "Keep sales records current.");
    if (has("stripe") && mentions(["refund", "invoice", "charge"])) push("stripe", "create_invoice", { customer: "cus_demo", amount: "199.00", description: goal.slice(0, 60) }, "Create the invoice / process billing.", "Handle the financial action.");
    if (has("slack")) push("slack", "send_message", { channel: "#sales", text: `💼 Update: ${goal.slice(0, 80)}` }, "Notify the sales team.", "Keep sales in the loop.");
  } else {
    // Generic cross-app fan-out
    if (has("notion")) push("notion", "create_page", { parent: "Workspace", title: goal.slice(0, 50), content: goal }, "Document the task in Notion.", "Create a written record.");
    if (has("slack")) push("slack", "send_message", { channel: "#general", text: `🤖 AgentOS handled: ${goal.slice(0, 80)}` }, "Post a status update to Slack.", "Notify the team.");
    if (has("gmail")) push("gmail", "create_draft", { to: "team@acme.com", subject: goal.slice(0, 40), body: goal }, "Draft a follow-up email.", "Prepare outbound comms.");
  }

  // Guarantee cross-app breadth: if the plan touches fewer than 2 apps, add
  // complementary steps from other connected apps so the demo always shows
  // multi-app orchestration (the whole point of the theme).
  const used = () => new Set(steps.map((s) => s.app_id));
  const complements: Array<[string, string, Record<string, string>, string, string]> = [
    ["notion", "create_page", { parent: "Workspace", title: goal.slice(0, 50), content: goal }, "Log a record of this in Notion.", "Keep a written audit trail."],
    ["slack", "send_message", { channel: "#general", text: `🤖 AgentOS handled: ${goal.slice(0, 80)}` }, "Notify the team in Slack.", "Give everyone real-time visibility."],
    ["gmail", "create_draft", { to: "team@acme.com", subject: goal.slice(0, 40), body: goal }, "Draft a follow-up email.", "Prepare outbound communication."],
    ["google_calendar", "create_event", { title: goal.slice(0, 50), start: "tomorrow 10:00", end: "tomorrow 10:30", attendees: "team@acme.com" }, "Add a follow-up to the calendar.", "Make sure it doesn't slip."],
    ["linear", "create_issue", { team: "Ops", title: goal.slice(0, 60), description: goal, priority: "Medium" }, "Track the follow-up as a ticket.", "Assign ownership."],
  ];
  for (const [appId, actionId, params, description, rationale] of complements) {
    if (used().size >= 2 && steps.length >= 2) break;
    if (connectedIds.includes(appId) && !used().has(appId)) {
      push(appId, actionId, params, description, rationale);
    }
  }

  // Absolute fallback: at least one step using whatever is connected.
  if (!steps.length && connected.length) {
    const c = connected[0];
    const a = c.actions[0];
    const params: Record<string, string> = {};
    a.params.forEach((p) => (params[p] = goal.slice(0, 40)));
    steps.push({ app_id: c.id, app_name: c.name, action_id: a.id, action_label: a.label, params, description: `${a.label} in ${c.name}`, rationale: "Best available action for this goal." });
  }

  return { summary: `AgentOS will accomplish "${goal.slice(0, 80)}" across ${new Set(steps.map((s) => s.app_id)).size} connected app(s).`, steps };
}

/** Live Slack post via Web API (no extra deps — uses fetch). */
async function executeSlackLive(step: PlanStep): Promise<ExecutedStep | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || step.action_id !== "send_message") return null;
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: step.params.channel || "#general", text: step.params.text || "AgentOS update" }),
    });
    const data: any = await res.json();
    if (data.ok) {
      return { ...step, status: "success", result: `Message delivered to ${data.channel}`, link: undefined, finished_at: new Date().toISOString() };
    }
    return null; // fall through to simulation on API error
  } catch {
    return null;
  }
}

/** Realistic simulated result strings + fake ids/links per app. */
function simulateResult(step: PlanStep): { result: string; link?: string } {
  const rid = Math.random().toString(36).slice(2, 8).toUpperCase();
  const num = Math.floor(100 + Math.random() * 900);
  switch (step.app_id) {
    case "slack":
    case "discord":
    case "teams":
      return { result: `Message posted to ${step.params.channel || "#general"}` };
    case "gmail":
    case "outlook":
      return step.action_id === "create_draft"
        ? { result: `Draft saved to ${step.params.to || "recipient"}` }
        : { result: `Email sent to ${step.params.to || "recipient"}`, link: `https://mail.google.com/mail/u/0/#sent/${rid}` };
    case "notion":
      return { result: `Notion page created: "${step.params.title || "Untitled"}"`, link: `https://notion.so/${rid}` };
    case "google_docs":
      return { result: `Doc created: "${step.params.title || "Untitled"}"`, link: `https://docs.google.com/document/d/${rid}` };
    case "confluence":
      return { result: `Confluence page published in ${step.params.space || "space"}` };
    case "airtable":
      return { result: `Record added to ${step.params.table || "table"}` };
    case "github":
      return { result: `Issue #${num} opened in ${step.params.repo || "repo"}`, link: `https://github.com/${step.params.repo || "acme/app"}/issues/${num}` };
    case "gitlab":
      return { result: `Issue !${num} created in ${step.params.project || "project"}` };
    case "linear":
      return { result: `Linear issue ENG-${num} created`, link: `https://linear.app/acme/issue/ENG-${num}` };
    case "jira":
      return { result: `Jira ticket ${(step.params.project || "ENG")}-${num} created` };
    case "trello":
      return { result: `Card added to ${step.params.list || "list"}` };
    case "asana":
      return { result: `Task "${step.params.name || "Task"}" created` };
    case "hubspot":
      return { result: `CRM updated (${step.action_label})`, link: `https://app.hubspot.com/contacts/${rid}` };
    case "salesforce":
      return { result: `Lead created in Salesforce` };
    case "google_calendar":
      return { result: `Event "${step.params.title || "Meeting"}" scheduled`, link: `https://calendar.google.com/calendar/event?eid=${rid}` };
    case "calendly":
      return { result: `Booking link sent to ${step.params.to || "invitee"}` };
    case "google_drive":
    case "dropbox":
      return { result: `File ${step.action_id === "share_file" || step.action_id === "share_link" ? "shared" : "created"}` };
    case "stripe":
      return step.action_id === "issue_refund"
        ? { result: `Refund of $${step.params.amount || "0"} issued` }
        : { result: `Invoice for $${step.params.amount || "0"} sent to ${step.params.customer || "customer"}` };
    case "zendesk":
      return { result: `Support ticket #${num} created` };
    default:
      return { result: `${step.action_label} completed` };
  }
}

async function executeStep(step: PlanStep): Promise<ExecutedStep> {
  // Try a real Slack post first when possible.
  if (step.app_id === "slack") {
    const live = await executeSlackLive(step);
    if (live) return live;
  }
  const sim = simulateResult(step);
  return { ...step, status: "simulated", result: sim.result, link: sim.link, finished_at: new Date().toISOString() };
}

let runCounter = 0;

export async function runAgent(goal: string, connectedIds: string[]): Promise<AgentRun> {
  const safeConnected = connectedIds.length ? connectedIds : CONNECTORS.map((c) => c.id);

  let planner: "claude" | "heuristic" = "claude";
  let plan = await planWithClaude(goal, safeConnected);
  if (!plan) {
    planner = "heuristic";
    plan = planHeuristically(goal, safeConnected);
  }

  const executed: ExecutedStep[] = [];
  for (const step of plan.steps) {
    executed.push(await executeStep(step));
  }

  runCounter += 1;
  return {
    id: `run-${Date.now()}-${runCounter}`,
    goal,
    summary: plan.summary,
    planner,
    steps: executed,
    apps_used: Array.from(new Set(executed.map((s) => s.app_id))),
    created_at: new Date().toISOString(),
  };
}
