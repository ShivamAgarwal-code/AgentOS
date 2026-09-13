import Anthropic from "@anthropic-ai/sdk";
import { DecisionReplay, TimelineMessage, Benchmark, Alternative, DocumentLink } from "../types";

// Initialize the Anthropic (Claude) client.
// Resolves credentials from ANTHROPIC_API_KEY (or an `ant auth login` profile).
const getClaudeClient = (): Anthropic => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not configured.");
  }
  return new Anthropic();
};

const REASONING_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

// Realistic avatar list to assign to parsed Slack participants
const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120", // Elena
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120", // Marcus
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120", // Priya
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120", // Kevin
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120", // Sarah
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120"  // David
];

/**
 * AIReasoningService - Transforms raw Slack conversation logs into a fully structured DecisionReplay
 */
export class AIReasoningService {
  /**
   * Generates a DecisionReplay structured object from raw Slack text conversation
   */
  static async generateReplayFromConversation(rawConversation: string, previousDecisions?: any[]): Promise<Partial<DecisionReplay>> {
    const client = getClaudeClient();

    // System Instruction to force structured analysis
    const systemInstruction = `You are Chronicle AI's high-fidelity Organizational Reasoning Engine.
Your task is to analyze raw Slack conversation transcripts and extract a complete, interactive decision replay path.
You must construct high-fidelity structured logs, arguments, benchmarks, and tradeoffs based on the conversation text.
Ensure that:
1. Arguments are replica-ready Slack messages with realistic text and speaker attributions matching the text.
2. Problem statement and proposal are fully synthesized.
3. Benchmarks compare the 'before' metrics and 'after' metrics based on the text (if not explicitly mentioned, construct realistic telemetry values based on standard distributed systems performance benchmarks for the given technology).
4. Alternatives, tradeoffs, and business impact are detailed and professional.
5. Identify people, projects, and slack channels discussed.
6. Provide an alignment confidence score from 0 to 100 based on the consensus or dissent.
7. Search the list of previous decisions provided in the user prompt. If a similar decision exists, set possible_duplicate to true, estimate the similarity percentage (0-100), and extract original experts/decision.
8. Recommend the best expert, a backup expert, a confidence score, and reasoning based on skills, channel and topic.
9. Assess severity (Low, Medium, High, Critical) for these six risk types: security_risk, performance_risk, scalability_risk, cost_risk, vendor_lock_in, compliance_risk.
10. Automatically generate a complete, professional, publication-ready Architecture Decision Record (ADR) covering: title, context, problem, decision, alternatives, tradeoffs, consequences, owners, and timestamp.`;

    const responseSchema = {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A short, crisp title for this decision, e.g., 'Migrate search service from Elasticsearch to Pinecone'"
        },
        channel: {
          type: "string",
          description: "The Slack channel where this discussion took place (e.g., #infra, #payments, #backend, #security)"
        },
        project: {
          type: "string",
          description: "The name of the project or system affected (e.g., Payments API, Checkout 2.0, Merchant Portal)"
        },
        proposal: {
          type: "string",
          description: "Summary of the initial proposal or initiative introduced"
        },
        problem_statement: {
          type: "string",
          description: "Detailed description of the underlying issue, problem, or root cause"
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Full names of the key team participants involved in the conversation"
        },
        arguments_for: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              text: { type: "string", description: "A realistic quote summarizing their supporting point, styled like a Slack message" },
              timestamp: { type: "string", description: "Slack-style timestamp, e.g., '10:14 AM'" },
              reactions: { type: "integer" },
              replies: { type: "integer" }
            },
            required: ["speaker", "text", "timestamp"]
          },
          description: "Array of supporting arguments, structured as Slack message replicas"
        },
        arguments_against: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              text: { type: "string", description: "A realistic quote summarizing their opposing or cautious point, styled like a Slack message" },
              timestamp: { type: "string", description: "Slack-style timestamp, e.g., '10:20 AM'" },
              reactions: { type: "integer" },
              replies: { type: "integer" }
            },
            required: ["speaker", "text", "timestamp"]
          },
          description: "Array of opposing arguments or concerns raised, structured as Slack message replicas"
        },
        benchmarks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric: { type: "string", description: "System metric name, e.g., 'Query Latency (p99)', 'Average RAM Usage', 'Throughput'" },
              before: { type: "string", description: "Performance value before the change, e.g., '4,200ms', '24GB/node'" },
              after: { type: "string", description: "Performance value after the change, e.g., '85ms', '2.4GB/node'" },
              source: { type: "string", description: "Source of benchmark, e.g., 'Benchmark suite v1.4', 'Sentry performance metrics'" }
            },
            required: ["metric", "before", "after", "source"]
          },
          description: "Analytical benchmarks or performance evidence comparing before/after setups"
        },
        alternatives_considered: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of alternative considered, e.g., 'Self-hosted Qdrant/Milvus'" },
              tradeoff: { type: "string", description: "Description of why it was rejected" }
            },
            required: ["name", "tradeoff"]
          },
          description: "Other alternatives that were considered but rejected"
        },
        decision: {
          type: "string",
          description: "The final committed or approved decision resolution"
        },
        reasoning: {
          type: "string",
          description: "How technical consensus and alignment was synthesized among participants"
        },
        impact: {
          type: "string",
          description: "The primary product and business impact of this decision"
        },
        tradeoffs: {
          type: "array",
          items: { type: "string" },
          description: "List of accepted system tradeoffs, caveats, or structural compromises"
        },
        confidence_score: {
          type: "number",
          description: "An alignment confidence score between 0 and 100 based on conversation consensus"
        },
        similarity_detection: {
          type: "object",
          properties: {
            possible_duplicate: { type: "boolean", description: "Set to true if a similar decision was found in previous decisions" },
            similarity_percentage: { type: "number", description: "Estimated similarity percentage (0 to 100)" },
            previous_decision_id: { type: "integer", description: "ID of the similar previous decision" },
            previous_decision_title: { type: "string", description: "Title of the similar previous decision" },
            previous_decision_text: { type: "string", description: "The approved resolution of the similar previous decision" },
            previous_date: { type: "string", description: "The date of the previous decision" },
            original_experts: { type: "array", items: { type: "string" }, description: "Experts of the original decision" }
          },
          required: ["possible_duplicate"]
        },
        expert_recommendation: {
          type: "object",
          properties: {
            best_expert: { type: "string" },
            backup_expert: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" }
          },
          required: ["best_expert", "backup_expert", "confidence", "reasoning"]
        },
        risk_detection: {
          type: "object",
          properties: {
            security_risk: { type: "string", description: "Low, Medium, High, or Critical" },
            performance_risk: { type: "string", description: "Low, Medium, High, or Critical" },
            scalability_risk: { type: "string", description: "Low, Medium, High, or Critical" },
            cost_risk: { type: "string", description: "Low, Medium, High, or Critical" },
            vendor_lock_in: { type: "string", description: "Low, Medium, High, or Critical" },
            compliance_risk: { type: "string", description: "Low, Medium, High, or Critical" }
          },
          required: ["security_risk", "performance_risk", "scalability_risk", "cost_risk", "vendor_lock_in", "compliance_risk"]
        },
         adr: {
          type: "object",
          properties: {
            title: { type: "string" },
            context: { type: "string" },
            problem: { type: "string" },
            decision: { type: "string" },
            alternatives: { type: "string" },
            tradeoffs: { type: "string" },
            consequences: { type: "string" },
            owners: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["title", "context", "problem", "decision", "alternatives", "tradeoffs", "consequences", "owners", "timestamp"]
        },
        why_this_decision: {
          type: "object",
          properties: {
            core_problem: { type: "string", description: "Clear, concise summary of the core problem." },
            why_chosen_won: { type: "string", description: "Specific technical reason why this chosen solution won over alternatives." },
            strongest_supporting_evidence: { type: "string", description: "The single strongest supporting fact or metric from the discussion." },
            strongest_opposing_argument: { type: "string", description: "The single strongest reservation, counter-argument, or caution raised." },
            why_alternatives_rejected: { type: "string", description: "Specific technical reason why other solutions/alternatives were dismissed." },
            remaining_risks: { type: "string", description: "Unresolved risks or potential trade-offs that the team decided to accept." }
          },
          required: ["core_problem", "why_chosen_won", "strongest_supporting_evidence", "strongest_opposing_argument", "why_alternatives_rejected", "remaining_risks"]
        }
      },
      required: [
        "title", "channel", "project", "proposal", "problem_statement", "participants",
        "arguments_for", "arguments_against", "benchmarks", "alternatives_considered",
        "decision", "reasoning", "impact", "tradeoffs", "confidence_score",
        "similarity_detection", "expert_recommendation", "risk_detection", "adr", "why_this_decision"
      ]
    };

    // Implement robust retry policy
    const modelName = REASONING_MODEL;
    console.log(`[AI Engine] Configured Claude model: ${modelName}`);

    // The schema (converted from the original definition) is handed to Claude as
    // an explicit JSON contract; the model returns a single JSON object.
    const jsonContract = `\n\nRespond with ONLY a single valid JSON object (no markdown, no code fences) that conforms to this JSON schema:\n${JSON.stringify(responseSchema)}`;

    const previousDecisionsStr = previousDecisions && previousDecisions.length > 0
      ? previousDecisions.map(d => `- ID ${d.id}: Title "${d.title}". Approved Resolution: "${d.decision}". Date: "${d.created_at || d.timestamp}". Experts: [${d.participants?.join(", ") || d.related_experts?.join(", ")}]`).join("\n")
      : "None recorded yet.";

    const delays = [0, 2000, 5000, 10000];
    let lastError: any = null;

    for (let attempt = 1; attempt <= 4; attempt++) {
      const delay = delays[attempt - 1];
      if (delay > 0) {
        console.log(`[AI Engine] Delaying ${delay / 1000} seconds before Attempt ${attempt}/4...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        console.log(`[AI Engine] Sending request to Claude (Model: ${modelName}) - Attempt ${attempt}/4`);
        const response = await client.messages.create({
          model: modelName,
          max_tokens: 8000,
          system: systemInstruction + jsonContract,
          messages: [
            {
              role: "user",
              content: `Raw Slack Conversation:\n\n${rawConversation}\n\nList of Previous Architectural Decisions:\n${previousDecisionsStr}`,
            },
          ],
        });

        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        let textOutput = textBlock?.text;
        if (!textOutput) {
          throw new Error("Claude returned empty response.");
        }

        // Feature 5: Robust JSON string cleaning for structured output validation
        textOutput = textOutput.trim();
        if (textOutput.startsWith("```json")) {
          textOutput = textOutput.substring(7);
        } else if (textOutput.startsWith("```")) {
          textOutput = textOutput.substring(3);
        }
        if (textOutput.endsWith("```")) {
          textOutput = textOutput.substring(0, textOutput.length - 3);
        }
        textOutput = textOutput.trim();

        const parsedData = JSON.parse(textOutput);

        // Validation & normalization of outputs
        if (!parsedData.title || !parsedData.decision) {
          throw new Error("Structured response did not pass core integrity verification.");
        }

        // Post-processing to assign realistic avatars & structured dates
        const assignAvatars = (messages: any[]) => {
          return (messages || []).map((msg, i) => ({
            ...msg,
            avatar: AVATAR_POOL[(msg.speaker?.charCodeAt(0) || i) % AVATAR_POOL.length],
            reactions: msg.reactions ?? Math.floor(Math.random() * 6),
            replies: msg.replies ?? Math.floor(Math.random() * 3)
          }));
        };

        const processedReplay: Partial<DecisionReplay> = {
          title: parsedData.title,
          channel: parsedData.channel?.startsWith("#") ? parsedData.channel : `#${parsedData.channel || "general"}`,
          project: parsedData.project || "General Project",
          proposal: parsedData.proposal || "",
          problem_statement: parsedData.problem_statement || "",
          participants: parsedData.participants || [],
          arguments_for: assignAvatars(parsedData.arguments_for || []),
          arguments_against: assignAvatars(parsedData.arguments_against || []),
          benchmarks: parsedData.benchmarks || [],
          alternatives_considered: parsedData.alternatives_considered || [],
          decision: parsedData.decision,
          reasoning: parsedData.reasoning || "",
          impact: parsedData.impact || "",
          tradeoffs: parsedData.tradeoffs || [],
          confidence_score: parsedData.confidence_score || 85,
          created_at: new Date().toISOString(),
          related_decisions: (parsedData.participants || []).map((_: any, idx: number) => `ADR-${Math.floor(10 + Math.random() * 20) + idx * 5 + 1}: Related architecture track`),
          related_experts: (parsedData.participants || []).slice(0, 2),
          related_documents: [
            { title: `ADR-${Math.floor(10 + Math.random() * 50)}: System Architecture Blueprint`, url: "https://notion.so/novapay" },
            { title: "Technical Evaluation Document", url: "https://drive.google.com/novapay" }
          ],
          similarity_detection: parsedData.similarity_detection,
          expert_recommendation: parsedData.expert_recommendation,
          risk_detection: parsedData.risk_detection,
          adr: parsedData.adr,
          why_this_decision: parsedData.why_this_decision || null
        };

        return processedReplay;

      } catch (error) {
        lastError = error;
        console.warn(`[AI Engine] Attempt ${attempt}/4 failed. Error:`, error);
      }
    }

    // Helper to detect specific status error patterns
    const isStatusError = (error: any, status: number): boolean => {
      if (!error) return false;
      if (error.status === status || error.statusCode === status || error.status_code === status) {
        return true;
      }
      if (error.response?.status === status || error.response?.statusCode === status) {
        return true;
      }
      if (error.error?.status === status || error.error?.code === status) {
        return true;
      }
      const message = String(error.message || "").toLowerCase();
      if (status === 429) {
        return (
          message.includes("429") ||
          message.includes("resource_exhausted") ||
          message.includes("rate limit") ||
          message.includes("quota exceeded")
        );
      }
      if (status === 503) {
        return (
          message.includes("503") ||
          message.includes("unavailable") ||
          message.includes("temporarily busy") ||
          message.includes("overloaded")
        );
      }
      return false;
    };

    if (isStatusError(lastError, 503)) {
      throw new Error("Claude is temporarily busy. Please try again in a few moments.");
    } else if (isStatusError(lastError, 429)) {
      throw new Error("Rate limit reached. Please wait before generating another replay.");
    } else {
      throw new Error(lastError?.message || "Failed to generate decision replay due to an unexpected error.");
    }
  }
}
