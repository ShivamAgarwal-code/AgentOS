/**
 * Live connector executors
 * -------------------------
 * Real, credential-based API calls for the apps that support simple
 * token-based auth (no interactive OAuth flow). Each executor:
 *   - runs a genuine HTTP request when its credentials (and any required
 *     target ids) are configured via environment variables, and
 *   - returns `null` when it can't run for real, so the caller falls back to
 *     a realistic simulated result. This keeps the demo working everywhere
 *     while doing the real thing wherever it's configured.
 *
 * Configure via env vars (all optional):
 *   SLACK_BOT_TOKEN
 *   DISCORD_WEBHOOK_URL
 *   GITHUB_TOKEN          (+ default repo GITHUB_DEFAULT_REPO="owner/repo")
 *   NOTION_TOKEN          (+ NOTION_PARENT_PAGE_ID)
 *   LINEAR_API_KEY
 *   TRELLO_KEY, TRELLO_TOKEN (+ TRELLO_LIST_ID)
 */

export interface LiveStep {
  app_id: string;
  action_id: string;
  params: Record<string, string>;
}

export interface LiveResult {
  result: string;
  link?: string;
}

/** Apps that have a live executor implemented (used to flag the UI). */
export const LIVE_CAPABLE = new Set(["slack", "discord", "github", "notion", "linear", "trello"]);

/** Returns true if the given app currently has live credentials configured. */
export function isLiveConfigured(appId: string): boolean {
  switch (appId) {
    case "slack": return !!process.env.SLACK_BOT_TOKEN;
    case "discord": return !!process.env.DISCORD_WEBHOOK_URL;
    case "github": return !!process.env.GITHUB_TOKEN;
    case "notion": return !!process.env.NOTION_TOKEN;
    case "linear": return !!process.env.LINEAR_API_KEY;
    case "trello": return !!(process.env.TRELLO_KEY && process.env.TRELLO_TOKEN);
    default: return false;
  }
}

/**
 * Attempt a real execution. Returns a LiveResult on success, or null to signal
 * the caller should simulate (missing creds/target, unsupported action, or a
 * recoverable API error).
 */
export async function liveExecute(step: LiveStep): Promise<LiveResult | null> {
  try {
    switch (step.app_id) {
      case "slack": return await execSlack(step);
      case "discord": return await execDiscord(step);
      case "github": return await execGitHub(step);
      case "notion": return await execNotion(step);
      case "linear": return await execLinear(step);
      case "trello": return await execTrello(step);
      default: return null;
    }
  } catch (err) {
    console.warn(`[AgentOS] live execution failed for ${step.app_id}/${step.action_id}, simulating:`, err);
    return null;
  }
}

// ── Slack ────────────────────────────────────────────────────────────
async function execSlack(step: LiveStep): Promise<LiveResult | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || step.action_id !== "send_message") return null;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel: step.params.channel || "#general", text: step.params.text || "AgentOS update" }),
  });
  const data: any = await res.json();
  if (!data.ok) return null;
  return { result: `Message delivered to ${data.channel}` };
}

// ── Discord (incoming webhook) ───────────────────────────────────────
async function execDiscord(step: LiveStep): Promise<LiveResult | null> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url || step.action_id !== "send_message") return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: step.params.text || "AgentOS update" }),
  });
  if (!res.ok) return null;
  return { result: `Message posted to Discord ${step.params.channel || "channel"}` };
}

// ── GitHub (personal access token) ───────────────────────────────────
async function execGitHub(step: LiveStep): Promise<LiveResult | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const repo = step.params.repo || process.env.GITHUB_DEFAULT_REPO;
  if (!repo || !repo.includes("/")) return null;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "AgentOS",
  };

  if (step.action_id === "create_issue") {
    const labels = (step.params.labels || "").split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: step.params.title || "AgentOS issue", body: step.params.body || "", labels }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return { result: `Issue #${data.number} opened in ${repo}`, link: data.html_url };
  }

  if (step.action_id === "comment_issue") {
    const num = step.params.issue_number;
    if (!num) return null;
    const res = await fetch(`https://api.github.com/repos/${repo}/issues/${num}/comments`, {
      method: "POST",
      headers,
      body: JSON.stringify({ body: step.params.body || "" }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return { result: `Comment added to ${repo}#${num}`, link: data.html_url };
  }

  return null; // create_pr needs branches; simulate
}

// ── Notion (integration token) ───────────────────────────────────────
async function execNotion(step: LiveStep): Promise<LiveResult | null> {
  const token = process.env.NOTION_TOKEN;
  const parent = process.env.NOTION_PARENT_PAGE_ID;
  if (!token || !parent || step.action_id !== "create_page") return null;

  const title = step.params.title || "AgentOS page";
  const content = step.params.content || "";
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parent },
      properties: { title: { title: [{ text: { content: title } }] } },
      children: content
        ? [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content } }] } }]
        : [],
    }),
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return { result: `Notion page created: "${title}"`, link: data.url };
}

// ── Linear (personal API key, GraphQL) ───────────────────────────────
async function execLinear(step: LiveStep): Promise<LiveResult | null> {
  const key = process.env.LINEAR_API_KEY;
  if (!key || step.action_id !== "create_issue") return null;

  const gql = async (query: string, variables?: any) => {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  };

  // Resolve a team id (first team) since the goal rarely knows Linear's ids.
  const teams: any = await gql(`{ teams(first: 1) { nodes { id } } }`);
  const teamId = teams?.data?.teams?.nodes?.[0]?.id;
  if (!teamId) return null;

  const created: any = await gql(
    `mutation($input: IssueCreateInput!){ issueCreate(input:$input){ success issue { identifier url } } }`,
    { input: { teamId, title: step.params.title || "AgentOS issue", description: step.params.description || "" } }
  );
  const issue = created?.data?.issueCreate?.issue;
  if (!issue) return null;
  return { result: `Linear issue ${issue.identifier} created`, link: issue.url };
}

// ── Trello (key + token) ─────────────────────────────────────────────
async function execTrello(step: LiveStep): Promise<LiveResult | null> {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const list = step.params.list || process.env.TRELLO_LIST_ID;
  if (!key || !token || !list || step.action_id !== "create_card") return null;

  const qs = new URLSearchParams({
    key,
    token,
    idList: list,
    name: step.params.name || "AgentOS card",
    desc: step.params.description || "",
  });
  const res = await fetch(`https://api.trello.com/1/cards?${qs.toString()}`, { method: "POST" });
  if (!res.ok) return null;
  const data: any = await res.json();
  return { result: `Trello card "${data.name}" created`, link: data.shortUrl };
}
