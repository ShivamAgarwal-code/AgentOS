import { DecisionReplay, TimelineMessage, Benchmark, Alternative, DocumentLink } from "../types";

const PROJECTS = [
  "Checkout 2.0",
  "NovaPay Search",
  "Merchant Portal",
  "Ledgers API",
  "Auth-Gateway",
  "Core-Reasoning",
  "Dynamic-Router",
  "Edge-Caching",
  "Telemetry-Daemon"
];

const CHANNELS = [
  "#infra",
  "#payments",
  "#backend",
  "#security",
  "#ai-engine",
  "#compliance",
  "#devops",
  "#sre"
];

const EXPERTS = [
  { name: "Elena Rostova", role: "Principal Systems Architect", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" },
  { name: "Marcus Chen", role: "Senior SRE / DevOps", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120" },
  { name: "Priya Shah", role: "Head of Security & Compliance", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120" },
  { name: "Kevin Wong", role: "Staff Backend Engineer", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120" },
  { name: "Sarah Ahmed", role: "Lead Systems Developer", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120" },
  { name: "David Kim", role: "Core Infrastructure Engineer", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120" }
];

const TOPICS = [
  {
    title: "Migrate search service from Elasticsearch to Pinecone",
    problem: "Outage risks due to severe connection timeouts and scaling bottleneck during peak shopping events.",
    proposal: "Incorporate a managed high-dimensionality vector database (Pinecone serverless) for rapid search queries.",
    decision: "Proceed with migrating NovaPay Search & Verification to Pinecone Managed Vector Store.",
    reasoning: "The 45x speedup in query response times outweighs SaaS vendor dependency.",
    impact: "Complete mitigation of peak-traffic search bottlenecks."
  },
  {
    title: "Introduce Kafka-backed Event Queue for checkout authorization",
    problem: "Checkout transaction drop-offs due to downstream bank connection timeouts.",
    proposal: "Transition checkout authorization pipeline to an asynchronous queue using Apache Kafka.",
    decision: "Approved. Shift checkout authorization pipeline to Apache Kafka with SSE notifications.",
    reasoning: "Background asynchronous processing with proper dead-letter-queues ensures zero transaction loss.",
    impact: "Almost completely eliminated aborted checkouts and smoothed server loads."
  },
  {
    title: "Migrate Merchant Portal backend to Go microservices",
    problem: "Slow Django JSON serialization speeds and high memory usage leading to sluggish reporting.",
    proposal: "Re-engineer high-volume reporting endpoints into a lightweight Go microservice.",
    decision: "Approved. Rebuild reporting system in Go; keep admin tasks in Django.",
    reasoning: "Go is an industry standard for reporting and heavy-data APIs. Speedups are substantial.",
    impact: "Supercharged report processing and solved memory leaks."
  },
  {
    title: "Deploy Multi-Region active-active CockroachDB cluster",
    problem: "Single-point-of-failure on us-east-1 RDS instance risking absolute platform downtime.",
    proposal: "Migrate PostgreSQL database to active-active CockroachDB spanning three AWS regions.",
    decision: "Approved CockroachDB multi-region deployment with enterprise encryption keys.",
    reasoning: "cockroachDB's consensus-based replication ensures 99.999% availability.",
    impact: "Guaranteed uninterrupted transaction handling even during complete AWS region blackout."
  },
  {
    title: "Decommission old WebSockets and adopt gRPC streams",
    problem: "High browser concurrency socket limits causing connection starvation on mobile clients.",
    proposal: "Swap raw WebSockets with HTTP/2-backed gRPC bidirectional streams for streaming telemetry.",
    decision: "Migrate Checkout 2.0 streaming backend exclusively to gRPC.",
    reasoning: "Multiplexing benefits over single HTTP/2 connection drastically reduces resource footprints.",
    impact: "Resolved client thread exhaustion and improved battery lifetimes on mobile clients."
  },
  {
    title: "Integrate HashiCorp Vault for credentials and API keys",
    problem: "Hardcoded Stripe secrets and database passwords found in repository audits.",
    proposal: "Mandate HashiCorp Vault for unified dynamic secrets injection across all microservices.",
    decision: "Decommission dotenv-based secrets and route all config through HashiCorp Vault.",
    reasoning: "Enforces strict access control, automatic rotation, and rigorous audit logging of secrets.",
    impact: "Secured enterprise posture and satisfied compliance criteria."
  },
  {
    title: "Switch to AWS Graviton (ARM64) for EC2 computing resources",
    problem: "Compute cloud budget growing at 30% month-over-month on generic x86 instances.",
    proposal: "Re-build Docker images to support ARM64 architecture and migrate computing clusters to Graviton 3.",
    decision: "Approved ARM64 migration for all stateless payments API microservices.",
    reasoning: "Graviton offers up to 40% better price-performance compared to standard x86 instances.",
    impact: "Cut core monthly infrastructure billing by 26.4% without any performance degradation."
  },
  {
    title: "Enforce strict mutual TLS (mTLS) in internal service mesh",
    problem: "Potential man-in-the-middle exploits if internal network perimeters are breached.",
    proposal: "Use Linkerd/Istio service mesh to enforce strict mTLS and auto-rotating certificates for all pods.",
    decision: "Approved Istio service mesh mTLS enforcement across all production Kubernetes clusters.",
    reasoning: "Zero-Trust architecture requirement. Internal transport security is non-negotiable.",
    impact: "Guaranteed internal wire-level encryption across all microservices."
  }
];

export function generateEnterpriseDemoData(): DecisionReplay[] {
  const replays: DecisionReplay[] = [];
  
  // Add 120 high-fidelity realistic decisions to mock the "hundreds of decisions" dataset
  for (let i = 1; i <= 125; i++) {
    const topicTemplate = TOPICS[(i - 1) % TOPICS.length];
    const project = PROJECTS[i % PROJECTS.length];
    const channel = CHANNELS[i % CHANNELS.length];
    
    // Assign random set of experts for this decision
    const shuffledExperts = [...EXPERTS].sort(() => 0.5 - Math.random());
    const participants = shuffledExperts.slice(0, 3 + (i % 3));
    const participantNames = participants.map(p => p.name);
    
    const confidenceScore = parseFloat((82 + (i % 17) + Math.random()).toFixed(1));
    const dateOffsetDays = i * 2; // Stagger dates backwards
    const date = new Date(Date.now() - dateOffsetDays * 24 * 60 * 60 * 1000);
    
    const title = `[DEP-${100 + i}] ${topicTemplate.title} (${project})`;
    
    // Select an older decision to be a duplicate if i is high-numbered
    const isDuplicate = i > 15 && i % 4 === 0;
    const similarity_detection = isDuplicate ? {
      possible_duplicate: true,
      similarity_percentage: Math.floor(74 + (i % 22)),
      previous_decision_id: (i % 10) + 1,
      previous_decision_title: `[DEP-${100 + (i % 10)}] ${TOPICS[(i % 10) % TOPICS.length].title}`,
      previous_decision_text: TOPICS[(i % 10) % TOPICS.length].decision,
      previous_date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      original_experts: [shuffledExperts[0].name, shuffledExperts[1].name]
    } : {
      possible_duplicate: false,
      similarity_percentage: 0,
      previous_decision_id: 0,
      previous_decision_title: "",
      previous_decision_text: "",
      previous_date: "",
      original_experts: []
    };

    const bestExpert = shuffledExperts[0];
    const backupExpert = shuffledExperts[1];
    const expert_recommendation = {
      best_expert: bestExpert.name,
      backup_expert: backupExpert.name,
      confidence: Math.floor(88 + (i % 11)),
      reasoning: `${bestExpert.name} has mapped expert domain authority on project '${project}' with ${15 + (i % 25)} successful decisions in ${channel}.`
    };

    const risk_detection = {
      security_risk: (i % 4 === 0 ? "Critical" : i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low") as any,
      performance_risk: (i % 5 === 0 ? "Critical" : i % 4 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low") as any,
      scalability_risk: (i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low") as any,
      cost_risk: (i % 4 === 0 ? "High" : i % 3 === 0 ? "Medium" : "Low") as any,
      vendor_lock_in: (i % 5 === 0 ? "Critical" : i % 3 === 0 ? "High" : "Low") as any,
      compliance_risk: (i % 6 === 0 ? "Critical" : i % 4 === 0 ? "Medium" : "Low") as any
    };

    const adr = {
      title: `ADR-${200 + i}: ${topicTemplate.title}`,
      context: `Under project ${project}, the team faced architectural strain regarding ${topicTemplate.problem.toLowerCase()}`,
      problem: topicTemplate.problem,
      decision: topicTemplate.decision,
      alternatives: `1. Traditional caching with customized Redis structures.\n2. Over-provisioning generic nodes.\n3. Custom in-memory lock patterns.`,
      tradeoffs: `Accepting vendor dependency or slightly higher cloud hosting overhead to gain reliable transaction throughput and sub-millisecond scaling response.`,
      consequences: `Reduced CPU overhead by 40%, complete prevention of downstream database connection bottlenecks, and stable platform operation during peak events.`,
      owners: participantNames.join(", "),
      timestamp: date.toLocaleDateString()
    };

    // Reconstruct Slack Messages
    const arguments_for: TimelineMessage[] = [
      {
        speaker: participantNames[0],
        text: `Based on initial system evaluations, shifting to this architecture for ${project} improves latency significantly. The raw telemetry matches our theoretical models.`,
        timestamp: "10:14 AM",
        avatar: participants[0]?.avatar || EXPERTS[0].avatar,
        reactions: 6,
        replies: 1
      },
      {
        speaker: participantNames[1],
        text: `Agreed. We ran load testing in staging and the throughput metrics look rock-solid under high concurrency loads. This resolves our scaling bottlenecks in ${channel}.`,
        timestamp: "10:22 AM",
        avatar: participants[1]?.avatar || EXPERTS[1].avatar,
        reactions: 4,
        replies: 0
      }
    ];

    const arguments_against: TimelineMessage[] = [
      {
        speaker: participantNames[2] || "Priya Shah",
        text: `We must consider potential vendor lock-in or additional subscription costs for managed packages. Additionally, compliance requirements mean we must audit data encryption.`,
        timestamp: "10:30 AM",
        avatar: participants[2]?.avatar || EXPERTS[2].avatar,
        reactions: 3,
        replies: 2
      }
    ];

    const benchmarks: Benchmark[] = [
      {
        metric: "Execution Latency (p99)",
        before: `${1800 + (i % 300)}ms`,
        after: `${14 + (i % 12)}ms`,
        source: "Datadog synthetic APM runs"
      },
      {
        metric: "Resource Overhead (RAM)",
        before: `${12 + (i % 8)} GB/node`,
        after: `${1.1 + (i % 2)} GB/node`,
        source: "Staging container telemetry logs"
      }
    ];

    const alternatives_considered: Alternative[] = [
      {
        name: "Scale traditional cluster hardware",
        tradeoff: "Inefficient cost model. Resource utilization scales linearly, but licensing models grow exponentially."
      },
      {
        name: "Introduce aggressive retry parameters with backoff",
        tradeoff: "Still results in thread-pool exhaustion and eventual complete connection starvation under heavy concurrency."
      }
    ];

    const related_documents: DocumentLink[] = [
      { title: `ADR-${200 + i}: ${topicTemplate.title} Reference Sheet`, url: "https://notion.so/novapay" },
      { title: `System Integration Runbook`, url: "https://wiki.novapay" }
    ];

    replays.push({
      id: i,
      title: topicTemplate.title,
      channel,
      project,
      proposal: topicTemplate.proposal,
      problem_statement: topicTemplate.problem,
      participants: participantNames,
      arguments_for,
      arguments_against,
      benchmarks,
      alternatives_considered,
      decision: topicTemplate.decision,
      reasoning: topicTemplate.reasoning,
      impact: topicTemplate.impact,
      tradeoffs: [`Vendor lock-in or additional cloud hosting overhead.`, `Requires training staff on new API configurations.`],
      confidence_score: confidenceScore,
      created_at: date.toISOString(),
      related_decisions: [`DEP-${99 + i}: Upstream service migration`, `ADR-${150 + i}: Config parameters`],
      related_experts: participantNames.slice(0, 2),
      related_documents,
      similarity_detection,
      expert_recommendation,
      risk_detection,
      adr
    });
  }

  return replays;
}
