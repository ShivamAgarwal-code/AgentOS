import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AIReasoningService } from "./src/services/aiReasoningService";
import { initSlackAgent, getSlackStatus } from "./src/services/slackAgent";
import { generateEnterpriseDemoData } from "./src/services/demoGenerator";
import { CONNECTORS, DEFAULT_CONNECTED } from "./src/connectors/catalog";
import { runAgent, AgentRun } from "./src/services/agentService";

const startTime = Date.now();

interface AuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  model: string;
  confidence: number;
  duration: number;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  let enterpriseDemoEnabled = false;
  let enterpriseReplaysList = generateEnterpriseDemoData();

  let auditTrailList: AuditRecord[] = [
    {
      id: "audit-1",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      user: "diyamenon444@gmail.com",
      action: "Generate Replay",
      model: "gemini-3.5-flash",
      confidence: 91.2,
      duration: 2150
    },
    {
      id: "audit-2",
      timestamp: new Date(Date.now() - 7200 * 1000).toISOString(),
      user: "System (Slack Bot)",
      action: "Detect Duplicates",
      model: "gemini-3.5-flash",
      confidence: 88.5,
      duration: 1420
    }
  ];

  // JSON parsing middleware
  

  // API Health Endpoints
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      version: "0.1.0",
      database: "connected (SQLite foundation initialized)",
      uptime: Math.floor((Date.now() - startTime) / 1000)
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      version: "0.1.0",
      database: "connected (SQLite foundation initialized)",
      uptime: Math.floor((Date.now() - startTime) / 1000)
    });
  });

  // Decision Replay Endpoints (Proxy to FastAPI with robust local fallback)
  const mockReplaysFallback = [
    {
      "id": 1,
      "title": "Migrate search service from Elasticsearch to Pinecone",
      "channel": "#infra",
      "project": "Payments API",
      "proposal": "Deprecate Elasticsearch and introduce Pinecone Managed Vector Database to index payment transaction metadata as dense vectors, enabling sub-100ms similarity search.",
      "problem_statement": "NovaPay's merchant search and payment verification is facing extreme latency spikes (up to 4.2 seconds) on complex transaction metadata searches, directly impacting checkout success rates.",
      "participants": ["Elena Rostova", "Marcus Chen", "Priya Shah", "Kevin Wong"],
      "arguments_for": [
        {
          "speaker": "Elena Rostova",
          "text": "By shifting to vector-based query representation, we reduce the search space from millions of database records to a highly optimized multi-dimensional index. Pinecone's managed index saves us weeks of Kubernetes cluster maintenance.",
          "timestamp": "10:14 AM",
          "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
          "reactions": 5,
          "replies": 2
        },
        {
          "speaker": "Kevin Wong",
          "text": "Elasticsearch is hogging 24GB of RAM per node in our cluster. Offloading this workload to Pinecone decreases our infrastructure overhead by 35%.",
          "timestamp": "10:30 AM",
          "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
          "reactions": 4,
          "replies": 0
        }
      ],
      "arguments_against": [
        {
          "speaker": "Marcus Chen",
          "text": "Pinecone is a closed-source SaaS. If we migrate, we are locked into their pricing tiers. Additionally, handling customer payment card data (PCI-DSS compliance) inside a third-party vector store will require rigorous legal compliance reviews.",
          "timestamp": "10:20 AM",
          "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
          "reactions": 6,
          "replies": 3
        },
        {
          "speaker": "Priya Shah",
          "text": "We will have to rewrite our entire query parser engine. The transition period means maintaining dual ingestion pipelines, doubling our write-load.",
          "timestamp": "10:45 AM",
          "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80",
          "reactions": 2,
          "replies": 1
        }
      ],
      "benchmarks": [
        {
          "metric": "Query Latency (p99)",
          "before": "4,200ms",
          "after": "85ms",
          "source": "Benchmark suite v1.4"
        },
        {
          "metric": "Memory Consumption",
          "before": "24GB/node",
          "after": "2.4GB/node",
          "source": "Kubernetes cluster metrics"
        }
      ],
      "alternatives_considered": [
        {
          "name": "Self-hosted Qdrant/Milvus",
          "tradeoff": "Lower license cost but requires full-time DevOps engineer to manage clustering, replication, and sharding."
        },
        {
          "name": "Scaling current Elasticsearch clusters",
          "tradeoff": "Temporary fix. Costs scale exponentially and query latency remains linear with database growth."
        }
      ],
      "decision": "Proceed with migrating NovaPay Search & Verification to Pinecone Managed Vector Store.",
      "reasoning": "The astronomical 45x speedup in query response times outweighs SaaS vendor dependency. Standard encryption policies and Pinecone's SOC2 compliance satisfy our legal department's PCI-DSS requirements.",
      "impact": "Drastic improvement of Checkout 2.0 checkout latency, complete mitigation of peak-traffic search bottlenecks, and reduced server crashes during Friday afternoon sales.",
      "tradeoffs": [
        "Vendor lock-in with Pinecone SaaS.",
        "Dual ingestion pipeline complexity during the 3-week transition phase."
      ],
      "confidence_score": 94.2,
      "created_at": "2026-07-08T10:00:00Z",
      "related_decisions": ["DEP-02: Deprecate Legacy WebSocket Service", "ID-11: Implement JWT auth in Checkout 2.0"],
      "related_experts": ["Elena Rostova", "Kevin Wong"],
      "related_documents": [
        {"title": "ADR-14: Search Migration Blueprint", "url": "https://notion.so/novapay/adr-14"},
        {"title": "PCI Compliance Audit Report", "url": "https://drive.google.com/novapay/pci-audit-2026"}
      ]
    },
    {
      "id": 2,
      "title": "Introduce Kafka-backed Event Queue for checkout authorization",
      "channel": "#payments",
      "project": "Checkout 2.0",
      "proposal": "Transition Checkout 2.0 payments system to an asynchronous queue model using Apache Kafka to hold checkout transactions, resolving bank outages gracefully without failing user requests.",
      "problem_statement": "NovaPay is experiencing checkout transaction drop-offs due to downstream banking partner connection timeouts during peak shopping hours. The synchronous REST API blocks the main event loop.",
      "participants": ["Sarah Ahmed", "Marcus Chen", "Elena Rostova", "Priya Shah"],
      "arguments_for": [
        {
          "speaker": "Sarah Ahmed",
          "text": "By shifting to an asynchronous event-driven layout, we can return an immediate 'Processing' status to clients and process transactions reliably in the background, even if the payment gateway goes down.",
          "timestamp": "2:15 PM",
          "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80",
          "reactions": 8,
          "replies": 1
        },
        {
          "speaker": "Elena Rostova",
          "text": "We already have a Kafka cluster running for our ledger system, so setting up a new 'checkout-auth' topic carries minimal infra overhead.",
          "timestamp": "2:30 PM",
          "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
          "reactions": 5,
          "replies": 0
        }
      ],
      "arguments_against": [
        {
          "speaker": "Marcus Chen",
          "text": "This introduces asynchronous state management complexity to the mobile app and Checkout 2.0 frontend. Clients must transition to long polling or WebSockets/SSE to receive receipt confirmations.",
          "timestamp": "2:20 PM",
          "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80",
          "reactions": 4,
          "replies": 2
        },
        {
          "speaker": "Priya Shah",
          "text": "If a transaction fails in the background after we tell the customer it's 'Processing', we must handle rollback, refund, and customer support notifications asynchronously. This is a business process nightmare.",
          "timestamp": "2:40 PM",
          "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80",
          "reactions": 3,
          "replies": 4
        }
      ],
      "benchmarks": [
        {
          "metric": "Transaction Drop-off Rate",
          "before": "8.4% during peak",
          "after": "0.12%",
          "source": "Sentry performance metrics"
        },
        {
          "metric": "HTTP Event-Loop Block Time",
          "before": "340ms avg",
          "after": "12ms avg",
          "source": "New Relic APM"
        }
      ],
      "alternatives_considered": [
        {
          "name": "Database-backed polling (PostgreSQL queue)",
          "tradeoff": "Simpler to implement but database locks at scale will create read bottlenecks during high checkout concurrency."
        },
        {
          "name": "Aggressive HTTP Retry Policies with Exponential Backoff",
          "tradeoff": "Still holds client threads open, eventually causing client connection exhaustion."
        }
      ],
      "decision": "Approved. Shift Checkout 2.0 authorization pipeline to Apache Kafka with SSE notifications.",
      "reasoning": "Reliability and customer transaction safety are our primary priorities. Background asynchronous processing with proper dead-letter-queues ensures zero transaction loss, even during complete bank partner outages.",
      "impact": "Almost completely eliminated aborted checkouts, greatly smoothed server loads, and increased NovaPay's Net Promoter Score.",
      "tradeoffs": [
        "Complex frontend UI state management (listening to Server-Sent Events).",
        "Requires robust back-office logic for asynchronous transaction failures."
      ],
      "confidence_score": 96.5,
      "created_at": "2026-07-08T11:30:00Z",
      "related_decisions": ["DEP-02: Deprecate Legacy WebSocket Service"],
      "related_experts": ["Sarah Ahmed", "Elena Rostova"],
      "related_documents": [
        {"title": "ADR-18: Event-Driven Payments Architecture", "url": "https://notion.so/novapay/adr-18"},
        {"title": "SSE Connection Guidelines", "url": "https://wiki.novapay/sse-standard"}
      ]
    },
    {
      "id": 3,
      "title": "Migrate Merchant Portal backend to Go microservices",
      "channel": "#backend",
      "project": "Merchant Portal",
      "proposal": "Re-engineer high-volume reporting endpoints into a lightweight Go microservice, drastically increasing speed and lowering memory overhead.",
      "problem_statement": "The Python-based monolithic Merchant Portal backend is suffering from slow JSON serialization speeds and high memory usage, leading to sluggish report loading for high-volume merchants.",
      "participants": ["Elena Rostova", "Priya Shah", "Kevin Wong"],
      "arguments_for": [
        {
          "speaker": "Kevin Wong",
          "text": "Go's execution performance and native concurrency support are perfect for streaming large transaction datasets. Our initial trials show a 10x speedup in CSV export times.",
          "timestamp": "11:15 AM",
          "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
          "reactions": 6,
          "replies": 1
        },
        {
          "speaker": "Priya Shah",
          "text": "This modularization allows us to deploy reporting independently from the primary payment core, reducing risk during weekly releases.",
          "timestamp": "11:25 AM",
          "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80",
          "reactions": 4,
          "replies": 0
        }
      ],
      "arguments_against": [
        {
          "speaker": "Elena Rostova",
          "text": "Go lacks a mature ORM like SQLAlchemy, meaning we will write raw SQL queries for reporting. This increases database maintenance cost and SQL injection vectors if not audited carefully.",
          "timestamp": "11:20 AM",
          "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
          "reactions": 5,
          "replies": 3
        }
      ],
      "benchmarks": [
        {
          "metric": "JSON Serialization Time",
          "before": "840ms",
          "after": "35ms",
          "source": "Reporting Benchmarks 2026"
        },
        {
          "metric": "Average RAM Usage",
          "before": "1.2GB",
          "after": "85MB",
          "source": "Docker container profiles"
        }
      ],
      "alternatives_considered": [
        {
          "name": "Rewrite with FastAPI and PyPy compiler",
          "tradeoff": "FastAPI is faster than Django, but still cannot match native static-binary compilation speeds and concurrency throughput of Go."
        }
      ],
      "decision": "Approved. Rebuild reporting system in Go; keep other administrative tasks in the Django core.",
      "reasoning": "Go is an industry standard for reporting and heavy-data APIs. The performance benefits are too significant to ignore, especially as our larger enterprise merchants scale up.",
      "impact": "Supercharged report processing and solved high memory leaks in production.",
      "tradeoffs": [
        "Polyglot codebase with mixed Python and Go expertise required.",
        "Raw SQL query validation overhead."
      ],
      "confidence_score": 91.0,
      "created_at": "2026-07-08T09:15:00Z",
      "related_decisions": [],
      "related_experts": ["Kevin Wong", "Priya Shah"],
      "related_documents": [
        {"title": "ADR-09: Polyglot Microservices Strategy", "url": "https://notion.so/novapay/adr-09"}
      ]
    }
  ];

  let activeReplaysList = [...mockReplaysFallback];

  // Initialize Slack Agent Bolt integration
  initSlackAgent(app, activeReplaysList, (newReplay) => {
    const targetList = enterpriseDemoEnabled ? enterpriseReplaysList : activeReplaysList;
    const correctId = targetList.length > 0
      ? Math.max(...targetList.map(r => r.id)) + 1
      : 1;
    newReplay.id = correctId;
    targetList.unshift(newReplay);
    console.log(`[Slack Agent] New Slack-generated decision replay added to memory: ${newReplay.id}`);
  });
  app.use(express.json());
  // Enterprise Demo status endpoints
  app.get("/api/enterprise-demo", (req, res) => {
    res.json({ enabled: enterpriseDemoEnabled });
  });

  app.post("/api/enterprise-demo", (req, res) => {
    const { enabled } = req.body;
    enterpriseDemoEnabled = !!enabled;
    console.log(`[Enterprise Demo] Mode changed to: ${enterpriseDemoEnabled}`);
    res.json({ enabled: enterpriseDemoEnabled });
  });

  // Audit Trail endpoint
  app.get("/api/audit-trail", (req, res) => {
    res.json(auditTrailList);
  });

  app.get("/api/decision-replay", (req, res) => {
    if (enterpriseDemoEnabled) {
      res.json(enterpriseReplaysList);
    } else {
      res.json(activeReplaysList);
    }
  });

  app.get("/api/slack-status", (req, res) => {
    res.json({ status: getSlackStatus() });
  });
  app.get("/api/debug/replays", (req, res) => {
    res.json({
      count: activeReplaysList.length,
      ids: activeReplaysList.map(r => r.id),
    });
  });
  app.get("/api/decision-replay/:id", (req, res) => {
    const { id } = req.params;
    const targetList = enterpriseDemoEnabled ? enterpriseReplaysList : activeReplaysList;
    const item = targetList.find(r => r.id === parseInt(id));
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Replay not found" });
    }
  });

  app.post("/api/decision-replay/mock", (req, res) => {
    const newItem = { ...req.body, id: Date.now() };
    if (enterpriseDemoEnabled) {
      enterpriseReplaysList.unshift(newItem as any);
    } else {
      activeReplaysList.unshift(newItem as any);
    }
    res.json(newItem);
  });

  app.post("/api/decision-replay/generate", async (req, res) => {
    const { conversation } = req.body;
    if (!conversation || typeof conversation !== "string") {
      return res.status(400).json({ error: "conversation is required and must be a string" });
    }

    const opStartTime = Date.now();

    try {
      console.log("[AI Engine] Synthesizing decision replay from Slack transcript using Gemini...");
      const targetList = enterpriseDemoEnabled ? enterpriseReplaysList : activeReplaysList;
      
      const generatedReplay = await AIReasoningService.generateReplayFromConversation(
        conversation,
        targetList
      );
      
      const nextId = targetList.length > 0 
        ? Math.max(...targetList.map(r => r.id)) + 1 
        : 1;

      const fullReplay = {
        ...generatedReplay,
        id: nextId
      };

      if (enterpriseDemoEnabled) {
        enterpriseReplaysList.unshift(fullReplay as any);
      } else {
        activeReplaysList.unshift(fullReplay as any);
      }

      // Record AI Operation in Enterprise Audit Trail
      const durationMs = Date.now() - opStartTime;
      const modelUsed = process.env.GEMINI_MODEL || "gemini-3.5-flash";
      const newAuditLog: AuditRecord = {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: req.body.user || "diyamenon444@gmail.com",
        action: "Generate Replay",
        model: modelUsed,
        confidence: fullReplay.confidence_score || 85,
        duration: durationMs
      };
      auditTrailList.unshift(newAuditLog);

      console.log(`[AI Engine] Decision Replay ${nextId} generated and stored successfully. Audit log appended.`);
      res.json(fullReplay);
    } catch (error: any) {
      console.error("[AI Engine] Failed to generate replay:", error);
      res.status(500).json({ error: error.message || "Failed to generate decision replay" });
    }
  });


  // ============================================================
  // AgentOS — Cross-app action agent endpoints
  // ============================================================

  // In-memory integration connection state (seeded with sensible defaults).
  const connectedApps = new Set<string>(DEFAULT_CONNECTED);
  // In-memory cross-app action activity + agent run history.
  const agentRuns: AgentRun[] = [];
  interface ActivityRecord {
    id: string;
    app_id: string;
    app_name: string;
    action: string;
    result: string;
    status: string;
    link?: string;
    goal: string;
    time: string;
  }
  const activityLog: ActivityRecord[] = [];

  // List all connectors from the catalog + their connection status.
  app.get("/api/integrations", (req, res) => {
    res.json(
      CONNECTORS.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        color: c.color,
        icon: c.icon,
        description: c.description,
        liveCapable: !!c.liveCapable,
        actionCount: c.actions.length,
        connected: connectedApps.has(c.id),
      }))
    );
  });

  // Toggle / set a connector's connection state.
  app.post("/api/integrations/:id", (req, res) => {
    const { id } = req.params;
    const exists = CONNECTORS.some((c) => c.id === id);
    if (!exists) return res.status(404).json({ error: "Unknown integration" });
    const connect = typeof req.body?.connected === "boolean" ? req.body.connected : !connectedApps.has(id);
    if (connect) connectedApps.add(id);
    else connectedApps.delete(id);
    res.json({ id, connected: connectedApps.has(id) });
  });

  // Run the agent: plan a cross-app workflow for a goal, then execute it.
  app.post("/api/agent/run", async (req, res) => {
    const goal = (req.body?.goal || "").toString().trim();
    if (!goal) return res.status(400).json({ error: "A goal is required." });
    try {
      const connectedIds = Array.from(connectedApps);
      const run = await runAgent(goal, connectedIds);
      agentRuns.unshift(run);
      // Fan run steps into the activity log.
      run.steps.forEach((s) => {
        activityLog.unshift({
          id: `${run.id}-${activityLog.length}-${Math.random().toString(36).slice(2, 6)}`,
          app_id: s.app_id,
          app_name: s.app_name,
          action: s.action_label,
          result: s.result,
          status: s.status,
          link: s.link,
          goal: run.goal,
          time: s.finished_at,
        });
      });
      res.json(run);
    } catch (error: any) {
      console.error("[AgentOS] Agent run failed:", error);
      res.status(500).json({ error: error.message || "Agent run failed" });
    }
  });

  // Agent run history.
  app.get("/api/agent/runs", (req, res) => {
    res.json(agentRuns.slice(0, 25));
  });

  // Cross-app activity feed.
  app.get("/api/activity", (req, res) => {
    res.json(activityLog.slice(0, 100));
  });

  // Serve Vite in development, static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AgentOS] AgentOS running on port ${PORT} — cross-app action agent online`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
