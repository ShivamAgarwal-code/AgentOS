export type PageId = "dashboard" | "knowledge" | "replay" | "experts" | "analytics" | "settings";

export interface Decision {
  id: string;
  title: string;
  context: string;
  consequences: string;
  project: string;
  status: "accepted" | "proposed" | "deprecated" | "under-review";
  author: string;
  channel: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  channel: string;
  time: string;
}

export interface Expert {
  id: string;
  name: string;
  role: string;
  slackId: string;
  skills: string[];
  decisionCount: number;
  confidence: number;
  avatar: string;
}

export interface TimelineMessage {
  speaker: string;
  text: string;
  timestamp: string;
  avatar: string;
  reactions?: number;
  replies?: number;
}

export interface Benchmark {
  metric: string;
  before: string;
  after: string;
  source: string;
}

export interface Alternative {
  name: string;
  tradeoff: string;
}

export interface DocumentLink {
  title: string;
  url: string;
}

export interface SimilarityDetection {
  possible_duplicate: boolean;
  similarity_percentage: number;
  previous_decision_id: number;
  previous_decision_title: string;
  previous_decision_text: string;
  previous_date: string;
  original_experts: string[];
}

export interface ExpertRecommendation {
  best_expert: string;
  backup_expert: string;
  confidence: number;
  reasoning: string;
}

export interface RiskDetection {
  security_risk: string;
  performance_risk: string;
  scalability_risk: string;
  cost_risk: string;
  vendor_lock_in: string;
  compliance_risk: string;
}

export interface ADRDocument {
  title: string;
  context: string;
  decision: string;
  alternatives: string;
  consequences: string;
}

export interface DecisionReplay {
  id: number;
  title: string;
  channel: string;
  project: string;
  proposal: string;
  problem_statement: string;
  participants: string[];
  arguments_for: TimelineMessage[];
  arguments_against: TimelineMessage[];
  benchmarks: Benchmark[];
  alternatives_considered: Alternative[];
  decision: string;
  reasoning: string;
  impact: string;
  tradeoffs: string[];
  confidence_score: number;
  created_at: string;
  related_decisions: string[];
  related_experts: string[];
  related_documents: DocumentLink[];
  similarity_detection?: SimilarityDetection;
  expert_recommendation?: ExpertRecommendation;
  risk_detection?: RiskDetection;
  adr?: ADRDocument;
  why_this_decision?: WhyThisDecision;
}

export interface WhyThisDecision {
  core_problem: string;
  why_chosen_won: string;
  strongest_supporting_evidence: string;
  strongest_opposing_argument: string;
  why_alternatives_rejected: string;
  remaining_risks: string;
}

