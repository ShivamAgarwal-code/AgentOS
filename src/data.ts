import { Decision, Activity, Expert } from "./types";

export const mockDecisions: Decision[] = [
  {
    id: "dec-1",
    title: "Migrate main search provider from Elasticsearch to Pinecone",
    context: "Needed support for low-latency semantic search queries across large Slack conversational contexts without maintaining complex infrastructure.",
    consequences: "Simpler operations and native vector indexes, but increases third-party API costs.",
    project: "AI Retrieval Engine",
    status: "accepted",
    author: "Elena Rostova",
    channel: "#tech-architecture",
    timestamp: "2 hours ago"
  },
  {
    id: "dec-2",
    title: "Deprecate server-sent events (SSE) gateway in favor of gRPC Streams",
    context: "Client SDK connections were unstable over poor mobile networks, leading to missed event logs.",
    consequences: "Bi-directional multiplexing reduces connection drops, but requires a proxy layer for standard web clients.",
    project: "Real-time Gateway",
    status: "proposed",
    author: "Marcus Chen",
    channel: "#realtime-chat",
    timestamp: "5 hours ago"
  },
  {
    id: "dec-3",
    title: "Standardize on SQLite WAL mode for local developer database caching",
    context: "Multiple background workers writing thread summaries caused database lock timeouts in dev environments.",
    consequences: "Concurrency increased significantly with writer-no-block-readers; requires active file handle management.",
    project: "Data Pipeline",
    status: "accepted",
    author: "Sarah Jenkins",
    channel: "#db-performance",
    timestamp: "1 day ago"
  },
  {
    id: "dec-4",
    title: "Adopt standard OIDC credentials flow for Slack external workspace links",
    context: "Enterprise customers requested single-sign-on matching their existing identity providers.",
    consequences: "Enhanced security compliance, minor increase in setup complexity per workspace.",
    project: "Identity & Auth",
    status: "under-review",
    author: "David Vance",
    channel: "#security-reviews",
    timestamp: "2 days ago"
  }
];

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    user: "Elena Rostova",
    action: "identified decision",
    target: "Pinecone migration",
    channel: "#tech-architecture",
    time: "10 mins ago"
  },
  {
    id: "act-2",
    user: "System AI",
    action: "generated draft ADR",
    target: "ADR-014: Pinecone Search",
    channel: "#tech-architecture",
    time: "24 mins ago"
  },
  {
    id: "act-3",
    user: "Marcus Chen",
    action: "proposed decision",
    target: "gRPC Streams replacement",
    channel: "#realtime-chat",
    time: "2 hours ago"
  },
  {
    id: "act-4",
    user: "Sarah Jenkins",
    action: "updated experts profile",
    target: "SQLite performance tags",
    channel: "#db-performance",
    time: "1 day ago"
  }
];

export const mockExperts: Expert[] = [
  {
    id: "exp-1",
    name: "Elena Rostova",
    role: "Principal Infrastructure Architect",
    slackId: "U04829AFE",
    skills: ["Elasticsearch", "Pinecone", "Vector DBs", "Kubernetes", "AWS"],
    decisionCount: 34,
    confidence: 98,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "exp-2",
    name: "Marcus Chen",
    role: "Senior Realtime Systems Engineer",
    slackId: "U03912DFD",
    skills: ["WebSockets", "SSE", "gRPC", "Go", "Network Protocols"],
    decisionCount: 22,
    confidence: 91,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "exp-3",
    name: "Sarah Jenkins",
    role: "Lead Database Engineer",
    slackId: "U05118GHA",
    skills: ["PostgreSQL", "SQLite", "WAL Mode", "Redis", "Query Optimization"],
    decisionCount: 19,
    confidence: 88,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "exp-4",
    name: "David Vance",
    role: "Enterprise Security Director",
    slackId: "U02441CBA",
    skills: ["OAuth 2.0", "OIDC", "SAML", "IAM", "Compliance"],
    decisionCount: 15,
    confidence: 94,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  }
];
