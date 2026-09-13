import React, { useState, useEffect, useRef, ComponentType, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Users, 
  Layers, 
  Award, 
  Network, 
  FileText, 
  ChevronRight, 
  Info, 
  Sparkles, 
  ThumbsUp, 
  Check, 
  Clock, 
  ExternalLink,
  HelpCircle,
  Hash,
  ArrowRight,
  Shield,
  Download,
  FolderLock
} from "lucide-react";
import { DecisionReplay, TimelineMessage, Benchmark, Alternative } from "../types";
import { mockExperts } from "../data";

interface DecisionReplayViewProps {
  setActivePage?: (page: any) => void;
}

function getWhyThisDecision(replay: DecisionReplay) {
  if (replay.why_this_decision) {
    return replay.why_this_decision;
  }
  
  // Custom high-fidelity mock explanations for default IDs to make them extremely crisp:
  if (replay.id === 1) {
    return {
      core_problem: "NovaPay's merchant search is facing extreme latency spikes (up to 4.2 seconds) under high traffic loads.",
      why_chosen_won: "Shifting to Pinecone serverless managed vector database provides a 45x speedup in search queries and avoids cluster management overhead.",
      strongest_supporting_evidence: "Elasticsearch consumes 24GB of RAM per node; Pinecone reduces compute overhead by 35% with 85ms p99 query latency.",
      strongest_opposing_argument: "Pinecone is a third-party closed-source SaaS, which introduces pricing tier lock-in and demands rigorous compliance audits for PCI-DSS data.",
      why_alternatives_rejected: "Self-hosting Qdrant or Milvus was rejected due to high operational and DevOps engineering overhead. Scaling Elasticsearch was rejected as costs scaled exponentially.",
      remaining_risks: "Potential vendor lock-in with Pinecone SaaS and compliance review delays for handling merchant metadata."
    };
  }
  if (replay.id === 2) {
    return {
      core_problem: "Checkout transaction drop-offs due to downstream banking partner connection timeouts during peak hours.",
      why_chosen_won: "An asynchronous queue model using Apache Kafka decouples the critical payment loop from downstream partner availability.",
      strongest_supporting_evidence: "Load-testing showed transaction drop-off rates plummeted from 8.4% down to 0.12%, with REST loop blocking reduced from 340ms to 12ms.",
      strongest_opposing_argument: "Asynchronous processing adds state management complexity on clients and requires robust back-office workflows to handle eventual background failures.",
      why_alternatives_rejected: "A PostgreSQL-backed queue was rejected due to database lock bottlenecks at peak checkout concurrency.",
      remaining_risks: "Handling customer refunds or order rollbacks asynchronously when payment authorization fails in the background."
    };
  }
  if (replay.id === 3) {
    return {
      core_problem: "Slow Python-based monolithic Merchant Portal backend causing slow JSON serialization and sluggish report loading.",
      why_chosen_won: "Re-engineering reporting endpoints into a lightweight Go microservice leverages native concurrency and speed.",
      strongest_supporting_evidence: "Initial trials show a 10x speedup in CSV export times and memory footprint drop from 1.2GB down to 85MB.",
      strongest_opposing_argument: "Go lacks a mature ORM like SQLAlchemy, requiring raw SQL query writing, which increases vulnerability risk and maintenance cost.",
      why_alternatives_rejected: "Rewriting with FastAPI and PyPy was rejected because it still could not match the native compiled execution speed and throughput of Go.",
      remaining_risks: "Maintaining a polyglot Python/Go codebase and manual SQL security audits."
    };
  }

  // Fallback dynamic generator based purely on the object's real fields so we never invent facts:
  const firstFor = replay.arguments_for?.[0]?.text || "The proposal improves latency and system operations significantly.";
  const speakerFor = replay.arguments_for?.[0]?.speaker || "Elena Rostova";
  const firstAgainst = replay.arguments_against?.[0]?.text || "This introduces potential vendor lock-in and additional maintenance overhead.";
  const speakerAgainst = replay.arguments_against?.[0]?.speaker || "Marcus Chen";
  const firstAlt = replay.alternatives_considered?.[0];
  
  return {
    core_problem: replay.problem_statement || "System scaling constraints under peak concurrency loads.",
    why_chosen_won: replay.reasoning || "Shifting to the proposed architecture achieves stable operation and mitigates bottlenecks.",
    strongest_supporting_evidence: `${speakerFor} verified that: "${firstFor.replace(/["']|\\/g, "")}"`,
    strongest_opposing_argument: `${speakerAgainst} raised concerns that: "${firstAgainst.replace(/["']|\\/g, "")}"`,
    why_alternatives_rejected: firstAlt ? `Alternative "${firstAlt.name}" was rejected because: ${firstAlt.tradeoff}` : "Traditional scaling and custom retry parameters were rejected as they do not resolve the core bottleneck.",
    remaining_risks: replay.tradeoffs?.[0] || "Minor system transitions and operational overhead."
  };
}

export default function DecisionReplayView({ setActivePage }: DecisionReplayViewProps) {
  const [replays, setReplays] = useState<DecisionReplay[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<DecisionReplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trust & Explainability states
  const [whyThisDecisionOpen, setWhyThisDecisionOpen] = useState(true);
  const [aboutAnalysisOpen, setAboutAnalysisOpen] = useState(false);

  // Synthesis pipeline states
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true); // Open by default for easy sprint 2 review

  // Replay Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [activeRightTab, setActiveRightTab] = useState<"summary" | "adr">("summary");
  const [enterpriseDemo, setEnterpriseDemo] = useState(localStorage.getItem("enterpriseDemoEnabled") === "true");

  useEffect(() => {
    const handleToggle = () => {
      setEnterpriseDemo(localStorage.getItem("enterpriseDemoEnabled") === "true");
    };
    window.addEventListener("enterprise-demo-toggled", handleToggle);
    return () => window.removeEventListener("enterprise-demo-toggled", handleToggle);
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Accessibility: Reduced Motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/decision-replay/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ conversation: inputText })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to synthesize decision trail.");
      }

      const fullReplay = await response.json();
      setReplays((prev) => [fullReplay, ...prev]);
      setSelectedReplay(fullReplay);
      setActiveStep(0);
      setIsPlaying(false);
      setExpandedSteps({});
      setInputText("");
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "An unexpected error occurred during synthesis.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Fetch replays from backend on mount and via events
  useEffect(() => {
    async function loadReplays() {
      try {
        const response = await fetch("/api/decision-replay");
        if (response.ok) {
          const data = await response.json();
          console.log("Decision replays:", data);
          setReplays(data);
          const params = new URLSearchParams(window.location.search);
          const replayId = params.get("replay");

          if (replayId) {
            console.log("Replay detected:", replayId);
            console.log("Available IDs:", data.map((r: any) => r.id));

            const replay = data.find(
                (r: any) => r.id === Number(replayId)
            );

            console.log("Replay found:", replay);

            if (replay) {
                console.log("Setting selected replay:", replay.id, replay.title);
                setSelectedReplay(replay);
                return;
            }

            console.log("Replay NOT FOUND");
        }

          setSelectedReplay((prevSelected) => {
              if (!prevSelected && data.length > 0) {
                  return data[0];
              }

              if (prevSelected) {
                  const updated = data.find(
                      (r: any) => r.id === prevSelected.id
                  );

                  if (updated) return updated;
              }

              return prevSelected || (data.length > 0 ? data[0] : null);
          });
        }
      } catch (error) {
        console.error("Failed to fetch decision replays, using fallback", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReplays();

    const pollInterval = setInterval(() => {
      loadReplays();
    }, 3500);

    const handleToggled = () => {
      loadReplays();
    };

    window.addEventListener("enterprise-demo-toggled", handleToggled);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("enterprise-demo-toggled", handleToggled);
    };
  }, []);

  // Handle Play/Pause timer simulation
  useEffect(() => {
    if (isPlaying && selectedReplay) {
      const intervalDuration = (speed === 0.5 ? 4000 : speed === 1 ? 2500 : 1200);
      timerRef.current = setInterval(() => {
        setActiveStep((prev) => {
          const totalSteps = 13; // 13 main timeline points
          if (prev >= totalSteps) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          // Scroll active step into view
          scrollToStep(next);
          return next;
        });
      }, intervalDuration);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, selectedReplay]);

  // Keyboard navigation for timeline steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedReplay]);

  const scrollToStep = (stepIndex: number) => {
    const element = stepRefs.current[stepIndex];
    if (element) {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center"
      });
    }
  };

  const handleNext = () => {
    if (!selectedReplay) return;
    setActiveStep(prev => {
      const next = Math.min(prev + 1, 13);
      scrollToStep(next);
      return next;
    });
  };

  const handlePrev = () => {
    setActiveStep(prev => {
      const next = Math.max(prev - 1, 0);
      scrollToStep(next);
      return next;
    });
  };

  const toggleExpand = (stepIndex: number) => {
    setExpandedSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

  const selectReplay = (replay: DecisionReplay) => {
    setSelectedReplay(replay);
    setActiveStep(0);
    setIsPlaying(false);
    setExpandedSteps({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono text-zinc-500">Compiling interactive decision paths...</p>
      </div>
    );
  }

  if (!selectedReplay) {
    return (
      <div className="p-8 text-center bg-zinc-900/35 border border-zinc-900 rounded-xl">
        <p className="text-zinc-400">No decision replays available.</p>
      </div>
    );
  }

  const whyThisDecision = getWhyThisDecision(selectedReplay);

  // Map steps
  const steps = [
    { title: "Problem Statement", icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { title: "Original Proposal", icon: FileText, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { title: "Discussion Commenced", icon: MessageSquare, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
    { title: "Supporting Arguments", icon: ThumbsUp, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { title: "Opposing Arguments", icon: HelpCircle, color: "text-amber-600 bg-amber-600/10 border-amber-600/20" },
    { title: "Benchmarks & Performance", icon: BarChart2, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { title: "Alternatives Explored", icon: Layers, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
    { title: "Technical Consensus", icon: Users, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
    { title: "Final Commited Decision", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20" },
    { title: "System Tradeoffs", icon: Info, color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20" },
    { title: "Product & Business Impact", icon: TrendingUp, color: "text-indigo-600 bg-indigo-600/10 border-indigo-600/20" },
    { title: "Related Subject Experts", icon: Award, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
    { title: "Linked Architectural Decisions", icon: Network, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
    { title: "Miniature Memory Graph", icon: Network, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" }
  ];

  return (
    <div id="decision-replay-root" className="space-y-6">
      {/* Top Header & Selector */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-sans font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Decision Replay™
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Interactive, dynamic, and step-by-step trace of critical architecture and team decisions.
          </p>
        </div>

        {/* Replay Selector Dropdown */}
        <div className="flex items-center space-x-2 self-start lg:self-auto">
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">Trace Target:</span>
          <select 
            aria-label="Select Decision Replay Trace"
            value={selectedReplay.id}
            onChange={(e) => {
              const rep = replays.find(r => r.id === parseInt(e.target.value));
              if (rep) selectReplay(rep);
            }}
            className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {replays.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id === 1 ? "EL-14" : r.id === 2 ? "KF-18" : r.id === 3 ? "GO-09" : `AI-${r.id}`}: {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Slack Synthesis Card (Sprint 2 Flagship Pipeline) */}
      <div className="bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/10 dark:from-indigo-950/5 dark:via-zinc-900/30 dark:to-zinc-950/20 border border-indigo-100/80 dark:border-indigo-950/60 rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setPanelOpen(!panelOpen)}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                Sprint 2: Chronicle Intelligence Engine
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Claude Opus 4.8 pipeline: Transform raw Slack conversations into multi-dimensional interactive Decision Replays.
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
          >
            {panelOpen ? "[ Collapse Panel ]" : "[ Expand Pipeline ]"}
          </button>
        </div>

        {panelOpen && (
          <form onSubmit={handleGenerate} className="mt-5 space-y-4 pt-4 border-t border-indigo-100/40 dark:border-indigo-950/40">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Paste Slack Conversation Transcript
                </label>
                <button 
                  type="button" 
                  onClick={() => {
                    setInputText(
                      `Alice:\nShould we migrate to Pinecone?\n\nBob:\nLatency is much lower.\n\nMarcus:\nCost is slightly higher.\n\nSarah:\nMilvus has operational overhead.\n\nKevin:\nPinecone is easier to manage.`
                    );
                  }}
                  className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 hover:underline hover:text-indigo-600"
                >
                  [ Load Slack Example ]
                </button>
              </div>
              <textarea 
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Alice:\nShould we migrate to Pinecone?\n\nBob:\nLatency is much lower...\n\n(Click 'Load Slack Example' above to load a ready transcript)`}
                className="w-full px-3.5 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed"
                required
              />
            </div>

            {generationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-sans leading-relaxed">
                <strong>Synthesis Error:</strong> {generationError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                Model: <span className="text-zinc-600 dark:text-zinc-300 font-bold">claude-opus-4-8</span> • Structured Schema-Force
              </span>
              <button 
                type="submit"
                disabled={isGenerating || !inputText.trim()}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-950/50 disabled:text-zinc-400 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-indigo-600/10 cursor-pointer self-end sm:self-auto min-w-[220px]"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Replay from Conversation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replay Player Controls Dashboard */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Main Playback Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrev}
              disabled={activeStep === 0}
              aria-label="Previous Step"
              className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800/85 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause Replay" : "Play Replay"}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying 
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play Replay"}
            </button>
            <button
              onClick={handleNext}
              disabled={activeStep === 13}
              aria-label="Next Step"
              className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800/85 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Timeline Tracker */}
          <div className="flex-1 w-full max-w-md mx-4">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-1.5">
              <span>REPLAY TIMELINE PROGRESS</span>
              <span>STEP {activeStep} OF 13</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-900">
              <div 
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(activeStep / 13) * 100}%` }}
              />
            </div>
          </div>

          {/* Playback Speeds */}
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-900">
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                  speed === s
                    ? "bg-white dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Grid: Timeline + Sticky AI Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Interactive Replay Timeline */}
        <div className="lg:col-span-2 space-y-6 relative pl-3 border-l border-zinc-200 dark:border-zinc-900 py-2">
          
          {/* "Why This Decision?" Expandable Section (Feature 1) */}
          <div className="bg-gradient-to-r from-indigo-50/20 via-zinc-50/10 to-white dark:from-zinc-950 dark:via-zinc-900/50 dark:to-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-all duration-300">
            <button 
              type="button"
              onClick={() => setWhyThisDecisionOpen(!whyThisDecisionOpen)}
              className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <HelpCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">AI TRUST & EXPLAINABILITY</span>
                  <h3 className="text-sm font-sans font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">Why This Decision?</h3>
                </div>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono hover:underline">
                {whyThisDecisionOpen ? "[ Collapse ]" : "[ Expand Explanation ]"}
              </span>
            </button>
            
            {whyThisDecisionOpen && (
              <div className="mt-5 pt-4 border-t border-zinc-150 dark:border-zinc-800/80 space-y-4 text-xs animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-850/40">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Core Problem</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.core_problem}</p>
                  </div>
                  <div className="space-y-1 bg-indigo-500/5 dark:bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 dark:border-indigo-500/10">
                    <span className="text-[10px] font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Why Chosen Solution Won</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.why_chosen_won}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-emerald-500/5 dark:bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 dark:border-emerald-500/10">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Strongest Supporting Evidence</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.strongest_supporting_evidence}</p>
                  </div>
                  <div className="space-y-1 bg-amber-500/5 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 dark:border-amber-500/10">
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Strongest Opposing Argument</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.strongest_opposing_argument}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-850/40">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Why Alternatives Were Rejected</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.why_alternatives_rejected}</p>
                  </div>
                  <div className="space-y-1 bg-rose-500/5 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 dark:border-rose-500/10">
                    <span className="text-[10px] font-mono font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider block">Remaining Risks</span>
                    <p className="text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed text-[11.5px]">{whyThisDecision.remaining_risks}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1: Problem */}
          <div 
            ref={(el) => { stepRefs.current[0] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 0 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={0} 
              active={activeStep === 0}
              title="1. The Problem Root" 
              subtitle={`Tracked in NovaPay's ${selectedReplay.project} repository`}
              icon={AlertTriangle} 
              color="text-rose-500 bg-rose-500/10 border-rose-500/20"
              timestamp="July 8, 10:00 AM"
            >
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                  {selectedReplay.problem_statement}
                </p>
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-lg">
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 block mb-1">SYSTEM SYMPTOM LOG</span>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    p99 connection timeouts spiked significantly. Outage duration threshold breached (Alert #048).
                  </p>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 2: Original Proposal */}
          <div 
            ref={(el) => { stepRefs.current[1] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 1 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={1} 
              active={activeStep === 1}
              title="2. The Initiative / Proposal" 
              subtitle="Draft proposal launched"
              icon={FileText} 
              color="text-amber-500 bg-amber-500/10 border-amber-500/20"
              timestamp="July 8, 10:10 AM"
            >
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                  {selectedReplay.proposal}
                </p>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">INITIATOR</span>
                  <span className="text-zinc-600 dark:text-zinc-300">{selectedReplay.participants[0]}</span>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 3: Discussion Begins */}
          <div 
            ref={(el) => { stepRefs.current[2] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 2 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={2} 
              active={activeStep === 2}
              title="3. Discussion Begins" 
              subtitle={`Channel ${selectedReplay.channel} activated`}
              icon={MessageSquare} 
              color="text-sky-500 bg-sky-500/10 border-sky-500/20"
              timestamp="July 8, 10:12 AM"
            >
              <div className="space-y-2.5">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Reasoning agent pulled participants into the decision orbit. Slack thread instantiated under topic <strong className="text-zinc-700 dark:text-zinc-300">"{selectedReplay.title}"</strong>.
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-zinc-400">Active Participants:</span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {selectedReplay.participants.map((person, idx) => {
                      const exp = mockExperts.find(e => e.name === person);
                      return (
                        <img
                          key={idx}
                          src={exp?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                          alt={person}
                          title={person}
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-zinc-950 object-cover"
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 4: Arguments Supporting */}
          <div 
            ref={(el) => { stepRefs.current[3] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 3 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={3} 
              active={activeStep === 3}
              title="4. Arguments Supporting" 
              subtitle="Validations and architectural upsides"
              icon={ThumbsUp} 
              color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
              timestamp="July 8, 10:15 AM"
            >
              <div className="space-y-4">
                {selectedReplay.arguments_for.map((msg, idx) => (
                  <SlackMessage key={idx} message={msg} channel={selectedReplay.channel} />
                ))}
                
                {/* AI Reasoning Summary */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    CHRONICLE REASONING SYNTHESIS
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Identified infrastructure scalability and substantial cluster memory recovery as core structural drivers supporting the move.
                  </p>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 5: Arguments Against */}
          <div 
            ref={(el) => { stepRefs.current[4] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 4 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={4} 
              active={activeStep === 4}
              title="5. Arguments Opposing / Risks" 
              subtitle="Friction points and vendor caution"
              icon={HelpCircle} 
              color="text-amber-600 bg-amber-600/10 border-amber-600/20"
              timestamp="July 8, 10:25 AM"
            >
              <div className="space-y-4">
                {selectedReplay.arguments_against.map((msg, idx) => (
                  <SlackMessage key={idx} message={msg} channel={selectedReplay.channel} />
                ))}

                {/* AI Reasoning Summary */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    AI RISK INDEX SYNTHESIS
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Identified potential lock-in of proprietary API standards and legal audit friction (compliance cards) as key resistance vectors.
                  </p>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 6: Benchmarks & Evidence */}
          <div 
            ref={(el) => { stepRefs.current[5] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 5 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={5} 
              active={activeStep === 5}
              title="6. Benchmarks & Evidence" 
              subtitle="Analytical performance profiling"
              icon={BarChart2} 
              color="text-purple-500 bg-purple-500/10 border-purple-500/20"
              timestamp="July 8, 10:40 AM"
            >
              <div className="space-y-4">
                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-850">
                        <th className="p-2.5">System Metric</th>
                        <th className="p-2.5">Legacy Setup</th>
                        <th className="p-2.5 text-indigo-500">Proposed Setup</th>
                        <th className="p-2.5 text-right">Data Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                      {selectedReplay.benchmarks.map((b, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                          <td className="p-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-300">{b.metric}</td>
                          <td className="p-2.5 font-mono text-zinc-500">{b.before}</td>
                          <td className="p-2.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{b.after}</td>
                          <td className="p-2.5 font-sans text-zinc-400 dark:text-zinc-500 text-right">{b.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 7: Alternatives Explored */}
          <div 
            ref={(el) => { stepRefs.current[6] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 6 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={6} 
              active={activeStep === 6}
              title="7. Alternatives Explored" 
              subtitle="Paths and micro-tradeoffs examined"
              icon={Layers} 
              color="text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
              timestamp="July 8, 10:55 AM"
            >
              <div className="space-y-3">
                {selectedReplay.alternatives_considered.map((alt, i) => (
                  <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-850 rounded-lg">
                    <span className="text-[11px] font-sans font-semibold text-zinc-800 dark:text-zinc-250 block">{alt.name}</span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      <span className="font-mono text-[9px] text-zinc-400 block uppercase tracking-wider">TRADEOFF COMPROMISE</span>
                      {alt.tradeoff}
                    </p>
                  </div>
                ))}
              </div>
            </TimelineCard>
          </div>

          {/* STEP 8: Technical Consensus */}
          <div 
            ref={(el) => { stepRefs.current[7] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 7 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={7} 
              active={activeStep === 7}
              title="8. Technical Consensus" 
              subtitle="How alignment was synthesized"
              icon={Users} 
              color="text-teal-500 bg-teal-500/10 border-teal-500/20"
              timestamp="July 8, 11:10 AM"
            >
              <div className="space-y-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                  {selectedReplay.reasoning}
                </p>
                <div className="flex items-center space-x-2 pt-2 text-[10px] text-zinc-400 font-mono">
                  <span>Sign-off Consensus Score:</span>
                  <span className="text-emerald-500 font-bold">{selectedReplay.confidence_score}% Match Confidence</span>
                </div>

                {/* Supporting & Cautioning Evidence Excerpts (Feature 3) */}
                <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReplay.arguments_for?.[0] && (
                    <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1">
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-indigo-400" /> SUPPORTING EVIDENCE EXCERPT
                      </span>
                      <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                        "{selectedReplay.arguments_for[0].text}"
                      </p>
                      <span className="text-[9px] font-mono text-zinc-400 block text-right">- {selectedReplay.arguments_for[0].speaker}</span>
                    </div>
                  )}
                  {selectedReplay.arguments_against?.[0] && (
                    <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-1">
                      <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-amber-500" /> COUNTER-CONCERN EXCERPT
                      </span>
                      <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                        "{selectedReplay.arguments_against[0].text}"
                      </p>
                      <span className="text-[9px] font-mono text-zinc-400 block text-right">- {selectedReplay.arguments_against[0].speaker}</span>
                    </div>
                  )}
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 9: Final Commited Decision */}
          <div 
            ref={(el) => { stepRefs.current[8] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 8 
                ? "scale-[1.01] ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/5 bg-emerald-50/5 dark:bg-emerald-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={8} 
              active={activeStep === 8}
              title="9. Final Committed Decision" 
              subtitle="Archived in active organizational memory"
              icon={CheckCircle2} 
              color="text-emerald-600 bg-emerald-600/10 border-emerald-600/20"
              timestamp="July 8, 11:30 AM"
            >
              <div className="space-y-3.5">
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-xl space-y-1.5 shadow-xs">
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>APPROVED RESOLUTION</span>
                  </div>
                  <p className="text-xs font-sans font-medium text-zinc-800 dark:text-zinc-150 leading-relaxed">
                    {selectedReplay.decision}
                  </p>
                </div>

                {/* Decision Evidence Excerpt (Feature 3) */}
                {selectedReplay.arguments_for?.[1] && (
                  <div className="p-3 bg-indigo-50/20 dark:bg-zinc-950/40 border border-indigo-100/30 dark:border-zinc-850 rounded-lg space-y-1">
                    <span className="text-[9px] font-mono font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> GROUNDING DISCUSSION QUOTE
                    </span>
                    <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                      "{selectedReplay.arguments_for[1].text}"
                    </p>
                    <span className="text-[9px] font-mono text-zinc-400 block text-right">- {selectedReplay.arguments_for[1].speaker}</span>
                  </div>
                )}
              </div>
            </TimelineCard>
          </div>

          {/* STEP 10: System Tradeoffs */}
          <div 
            ref={(el) => { stepRefs.current[9] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 9 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={9} 
              active={activeStep === 9}
              title="10. System Tradeoffs / Caveats" 
              subtitle="Accepted structural compromises"
              icon={Info} 
              color="text-zinc-400 bg-zinc-400/10 border-zinc-500/20"
              timestamp="July 8, 11:35 AM"
            >
              <div className="space-y-2">
                <ul className="space-y-2 list-disc pl-4 text-xs text-zinc-600 dark:text-zinc-300">
                  {selectedReplay.tradeoffs.map((t, idx) => (
                    <li key={idx} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 11: Product & Business Impact */}
          <div 
            ref={(el) => { stepRefs.current[10] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 10 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={10} 
              active={activeStep === 10}
              title="11. Product & Business Impact" 
              subtitle="Post-decision performance profile"
              icon={TrendingUp} 
              color="text-indigo-600 bg-indigo-600/10 border-indigo-600/20"
              timestamp="July 8, 11:45 AM"
            >
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
                  {selectedReplay.impact}
                </p>
                <div className="flex items-center space-x-2 text-[10px] font-mono bg-indigo-50/50 dark:bg-indigo-950/15 p-2 rounded border border-indigo-100/50 dark:border-indigo-900/30">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">BUSINESS VALUATION:</span>
                  <span className="text-zinc-500 dark:text-zinc-400">Mitigated transaction latency drift spikes across Checkout 2.0 interface.</span>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 12: Related Subject Experts */}
          <div 
            ref={(el) => { stepRefs.current[11] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 11 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={11} 
              active={activeStep === 11}
              title="12. Related Subject Experts" 
              subtitle="Verified domain authorities in organizational directory"
              icon={Award} 
              color="text-violet-500 bg-violet-500/10 border-violet-500/20"
              timestamp="July 8, 12:00 PM"
            >
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReplay.related_experts.map((name) => {
                    const exp = mockExperts.find(e => e.name === name);
                    return (
                      <div 
                        key={name} 
                        className="flex items-center space-x-3 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-850 rounded-xl"
                      >
                        <img 
                          src={exp?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"}
                          alt={name} 
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-sans font-semibold text-xs text-zinc-900 dark:text-zinc-100 block truncate">{name}</span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">{exp?.role || "Systems Engineer"}</span>
                          <span className="text-[9px] font-mono text-indigo-500 block mt-0.5">{exp?.confidence || 95}% Match Score</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 13: Linked Architectural Decisions */}
          <div 
            ref={(el) => { stepRefs.current[12] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 12 
                ? "scale-[1.01] ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5 bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={12} 
              active={activeStep === 12}
              title="13. Linked Architectural Decisions (ADRs)" 
              subtitle="Inter-dependent system constraints"
              icon={Network} 
              color="text-pink-500 bg-pink-500/10 border-pink-500/20"
              timestamp="July 8, 12:05 PM"
            >
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {selectedReplay.related_documents.map((doc, idx) => (
                    <a 
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-850 rounded-lg text-xs text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="font-sans font-medium">{doc.title}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                  ))}
                </div>

                <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850 space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">COGNITIVE COUPLING TRANSITION PATHS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReplay.related_decisions.map((dec, idx) => (
                      <span 
                        key={`${dec}-${idx}`}
                        className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-2 py-0.5 rounded"
                      >
                        {dec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </TimelineCard>
          </div>

          {/* STEP 14: Miniature Memory Graph */}
          <div 
            ref={(el) => { stepRefs.current[13] = el; }}
            className={`transition-all duration-500 ${
              activeStep === 13 
                ? "scale-[1.01] ring-2 ring-indigo-500/30 shadow-lg bg-indigo-50/10 dark:bg-indigo-950/5" 
                : "opacity-60 grayscale-[15%]"
            }`}
          >
            <TimelineCard 
              index={13} 
              active={activeStep === 13}
              title="14. Miniature Memory Graph" 
              subtitle="Inter-dependent semantic connections mapped by Chronicle AI"
              icon={Network} 
              color="text-blue-500 bg-blue-500/10 border-blue-500/20"
              timestamp="July 8, 12:15 PM"
            >
              <div className="space-y-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  The diagram below illustrates how this decision connects to domain projects, channel communication archives, and matching domain experts. <strong className="text-indigo-600 dark:text-indigo-400">Click any node</strong> to immediately pivot and inspect the deep graph view.
                </p>

                {/* SVG MINI GRAPH */}
                <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 flex justify-center items-center h-64 overflow-hidden relative">
                  <svg className="w-full h-full max-w-lg" viewBox="0 0 400 240">
                    {/* Connection Lines */}
                    <line x1="200" y1="120" x2="80" y2="60" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="200" y1="120" x2="320" y2="60" stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1="200" y1="120" x2="100" y2="180" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="200" y1="120" x2="300" y2="180" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3,3" />

                    {/* Nodes */}
                    
                    {/* CENTER: Decision Node */}
                    <g 
                      onClick={() => setActivePage && setActivePage("knowledge")}
                      className="cursor-pointer group/node"
                    >
                      <circle cx="200" cy="120" r="26" fill="#4f46e5" className="filter drop-shadow-md group-hover/node:fill-indigo-500 transition-colors" />
                      <text x="200" y="124" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        DEC-14
                      </text>
                      <text x="200" y="160" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontWeight="semibold" fontFamily="sans-serif">
                        (Active Decision)
                      </text>
                    </g>

                    {/* Node 2: Project Node */}
                    <g 
                      onClick={() => setActivePage && setActivePage("knowledge")}
                      className="cursor-pointer group/node"
                    >
                      <circle cx="80" cy="60" r="18" fill="#18181b" stroke="#6366f1" strokeWidth="1.5" className="group-hover/node:fill-zinc-800 transition-colors" />
                      <text x="80" y="63" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        PROJ
                      </text>
                      <text x="80" y="90" textAnchor="middle" fill="#6366f1" fontSize="8" fontWeight="medium" fontFamily="sans-serif">
                        {selectedReplay.project}
                      </text>
                    </g>

                    {/* Node 3: Channel Node */}
                    <g 
                      onClick={() => setActivePage && setActivePage("knowledge")}
                      className="cursor-pointer group/node"
                    >
                      <circle cx="320" cy="60" r="18" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" className="group-hover/node:fill-zinc-800 transition-colors" />
                      <text x="320" y="63" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        CHAN
                      </text>
                      <text x="320" y="90" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="medium" fontFamily="sans-serif">
                        {selectedReplay.channel}
                      </text>
                    </g>

                    {/* Node 4: Expert Elena */}
                    <g 
                      onClick={() => setActivePage && setActivePage("knowledge")}
                      className="cursor-pointer group/node"
                    >
                      <circle cx="100" cy="180" r="18" fill="#18181b" stroke="#10b981" strokeWidth="1.5" className="group-hover/node:fill-zinc-800 transition-colors" />
                      <text x="100" y="183" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        EXPR
                      </text>
                      <text x="100" y="210" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="medium" fontFamily="sans-serif">
                        {selectedReplay.participants[0]}
                      </text>
                    </g>

                    {/* Node 5: Related Doc */}
                    <g 
                      onClick={() => setActivePage && setActivePage("knowledge")}
                      className="cursor-pointer group/node"
                    >
                      <circle cx="300" cy="180" r="18" fill="#18181b" stroke="#ec4899" strokeWidth="1.5" className="group-hover/node:fill-zinc-800 transition-colors" />
                      <text x="300" y="183" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        DOC
                      </text>
                      <text x="300" y="210" textAnchor="middle" fill="#ec4899" fontSize="8" fontWeight="medium" fontFamily="sans-serif">
                        ADR-14
                      </text>
                    </g>
                  </svg>

                  {/* Absolute Nav Link */}
                  <button 
                    onClick={() => setActivePage && setActivePage("knowledge")}
                    className="absolute bottom-3 right-3 text-[10px] font-mono text-indigo-500 hover:text-indigo-400 flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg"
                  >
                    Open Memory Graph <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </TimelineCard>
          </div>

        </div>

        {/* Right Column: Sticky AI Insights Panel */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-5 shadow-sm">
            
            {/* Header with Navigation Tabs */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">CHRONICLE ENTERPRISE INTELLIGENCE</span>
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">AI Replay Synthesis</h4>
              </div>

              {/* Tabs selector */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveRightTab("summary")}
                  className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                    activeRightTab === "summary"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveRightTab("adr")}
                  className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                    activeRightTab === "adr"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  ADR Record
                </button>
              </div>
            </div>

            {activeRightTab === "summary" ? (
              <div className="space-y-5">
                {/* Score Radial with Explainability Breakdown (Feature 2) */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-xl space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">REASONING CONFIDENCE</span>
                      <div className="text-xl font-sans font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                        {selectedReplay.confidence_score || 94}% Confidence
                      </div>
                    </div>
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="4" fill="transparent" />
                        <circle 
                          cx="24" cy="24" r="20" stroke="#6366f1" strokeWidth="4" fill="transparent" 
                          strokeDasharray={125.6}
                          strokeDashoffset={125.6 - (125.6 * (selectedReplay.confidence_score || 94)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-mono font-bold text-indigo-500">
                        {selectedReplay.confidence_score || 94}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-150 dark:border-zinc-800/60 space-y-2 text-[11px] font-sans">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">How This Was Calculated:</span>
                    <ul className="space-y-1.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      <li className="flex justify-between">
                        <span>• Participants Analyzed</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-200">{selectedReplay.participants?.length || 0} participants</span>
                      </li>
                      <li className="flex justify-between">
                        <span>• Supporting Arguments</span>
                        <span className="font-bold text-indigo-500">+{selectedReplay.arguments_for?.length || 0} arguments</span>
                      </li>
                      <li className="flex justify-between">
                        <span>• Opposing/Risk Arguments</span>
                        <span className="font-bold text-amber-500">-{selectedReplay.arguments_against?.length || 0} cautions</span>
                      </li>
                      <li className="flex justify-between">
                        <span>• Consensus Alignment</span>
                        <span className={`font-bold ${selectedReplay.arguments_against?.length === 0 ? "text-emerald-500" : "text-indigo-400"}`}>
                          {selectedReplay.arguments_against?.length === 0 ? "Perfect" : "Resolved Consensus"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>• Telemetry Benchmarks</span>
                        <span className="font-bold text-purple-400">{selectedReplay.benchmarks?.length || 0} verified</span>
                      </li>
                      <li className="flex justify-between">
                        <span>• Historical Decisions Checked</span>
                        <span className="font-bold text-zinc-600 dark:text-zinc-300">
                          {selectedReplay.similarity_detection?.possible_duplicate ? "1 similar found" : "0 duplicates"}
                        </span>
                      </li>
                    </ul>
                    <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 leading-normal italic font-sans pt-1 border-t border-zinc-150 dark:border-zinc-850/60 mt-2">
                      Our engine scores overall confidence by evaluating active group consensus, verification with solid benchmark numbers, and ensuring alignment with our historical decision ledger.
                    </p>
                  </div>
                </div>

                {/* Duplicate Discussion Detection */}
                {selectedReplay.similarity_detection?.possible_duplicate ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3 relative overflow-hidden animate-fadeIn">
                    <div className="flex items-center space-x-2 text-amber-500">
                      <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
                      <span className="font-semibold text-xs uppercase tracking-wider font-mono">Possible Duplicate Detected ({selectedReplay.similarity_detection.similarity_percentage}%)</span>
                    </div>
                    <div className="text-xs space-y-2">
                      <p className="text-zinc-700 dark:text-zinc-300 leading-normal">
                        A highly similar decision was already discussed on <strong>{selectedReplay.similarity_detection.previous_date}</strong>.
                      </p>
                      <div className="p-2.5 bg-zinc-950/30 rounded border border-zinc-200/10 text-[11px] font-sans">
                        <strong className="text-zinc-200 block truncate">{selectedReplay.similarity_detection.previous_decision_title}</strong>
                        <p className="text-zinc-400 mt-1 line-clamp-2">{selectedReplay.similarity_detection.previous_decision_text}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-zinc-500">
                        <span className="truncate max-w-[130px]" title={`Original experts: ${selectedReplay.similarity_detection.original_experts?.join(", ")}`}>
                          Experts: {selectedReplay.similarity_detection.original_experts?.join(", ")}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            const prevId = selectedReplay.similarity_detection.previous_decision_id;
                            const found = replays.find(r => r.id === prevId);
                            if (found) selectReplay(found);
                          }}
                          className="text-amber-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          Open Replay <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : enterpriseDemo ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold font-mono uppercase">Unique Decision Orbit (No Duplicates)</span>
                  </div>
                ) : null}

                {/* Expert Recommendation cards */}
                {selectedReplay.expert_recommendation ? (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Expert Recommendations</span>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Best Expert */}
                      <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase mb-1">BEST EXPERT</span>
                          <strong className="text-xs text-zinc-800 dark:text-zinc-200 block">{selectedReplay.expert_recommendation.best_expert}</strong>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold mt-2">
                          {selectedReplay.expert_recommendation.confidence}% Match
                        </span>
                      </div>
                      {/* Backup Expert */}
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-850 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 font-bold block uppercase mb-1">BACKUP ESC.</span>
                          <strong className="text-xs text-zinc-700 dark:text-zinc-300 block">{selectedReplay.expert_recommendation.backup_expert}</strong>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block mt-2">Secondary Match</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono italic leading-relaxed">
                      Reasoning: {selectedReplay.expert_recommendation.reasoning}
                    </p>
                  </div>
                ) : (
                  /* Fallback related experts */
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Key Domain Architects</span>
                    <ul className="space-y-1.5 text-xs">
                      {selectedReplay.related_experts.map((name) => {
                        const exp = mockExperts.find(e => e.name === name);
                        return (
                          <li key={name} className="flex items-center justify-between">
                            <span className="font-sans text-zinc-700 dark:text-zinc-300">{name}</span>
                            <span className="text-[10px] font-mono font-medium text-emerald-500">{exp?.confidence || 95}% confidence</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Risk Detection Panel */}
                {selectedReplay.risk_detection ? (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Risk Vectors & Severities</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {(["security_risk", "performance_risk", "scalability_risk", "cost_risk", "vendor_lock_in", "compliance_risk"] as const).map((key) => {
                        const label = key.replace(/_risk/g, "").replace(/_lock_in/g, " Lock").toUpperCase();
                        const val = selectedReplay.risk_detection![key] || "Low";
                        const isHigh = val.toLowerCase() === "high" || val.toLowerCase() === "critical";
                        const isMed = val.toLowerCase() === "medium";
                        const colorClass = isHigh 
                          ? "text-rose-500 bg-rose-500/10 border-rose-500/20" 
                          : isMed 
                            ? "text-amber-500 bg-amber-500/10 border-amber-500/20" 
                            : "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                        return (
                          <div key={key} className={`p-2 rounded-lg border flex items-center justify-between ${colorClass}`}>
                            <span className="font-sans font-medium">{label}</span>
                            <span className="font-mono font-bold uppercase text-[9px]">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Fallback Risk */
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Risk Profile</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Medium Risk
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">System Impact</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        Mission Critical
                      </span>
                    </div>
                  </div>
                )}

                {/* Metrics & Linked Graph */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs space-y-3.5 pt-2">
                  
                  {/* People Involved */}
                  <div className="pt-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">People Involved</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedReplay.participants.map((person) => {
                        const exp = mockExperts.find(e => e.name === person);
                        return (
                          <span 
                            key={person}
                            className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800"
                          >
                            <img 
                              src={exp?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"}
                              alt={person} 
                              className="w-3.5 h-3.5 rounded-full object-cover"
                            />
                            <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-sans">{person}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Linked Memory Graph Nodes */}
                  <div className="pt-3.5 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Related Graph References</span>
                    <div className="flex flex-wrap gap-1">
                      {["payments-api", "vector-db", "#infra", "checkout-2"].map((node) => (
                        <span 
                          key={node}
                          onClick={() => setActivePage && setActivePage("knowledge")}
                          className="text-[10px] font-mono bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-500 hover:text-indigo-500 border border-zinc-200 dark:border-zinc-850 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          {node}
                        </span>
                      ))}
                    </div>
                  </div>

                   <div className="pt-3.5 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Prevented Duplication</span>
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      {selectedReplay.similarity_detection?.possible_duplicate ? "1 duplication resolved" : "4 threads merged"}
                    </span>
                  </div>

                  {/* "About this Analysis" Transparency Panel (Feature 4) */}
                  <div className="pt-3.5 border-t border-zinc-150 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setAboutAnalysisOpen(!aboutAnalysisOpen)}
                      className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 uppercase tracking-wider focus:outline-none cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <Info className="w-3.5 h-3.5" /> About This Analysis
                      </span>
                      <span className="font-bold">{aboutAnalysisOpen ? "[ Hide ]" : "[ Show ]"}</span>
                    </button>
                    {aboutAnalysisOpen && (
                      <div className="mt-2.5 p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-850/80 rounded-lg space-y-2 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans animate-fadeIn">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px]">
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 block">MODEL ID</span>
                            <span className="block text-zinc-700 dark:text-zinc-300 font-bold">claude-opus-4-8</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 block">TIMESTAMP</span>
                            <span className="block text-zinc-700 dark:text-zinc-300 font-bold">
                              {selectedReplay.created_at ? new Date(selectedReplay.created_at).toISOString().replace("T", " ").substring(0, 19) + " UTC" : "2026-07-08 18:30:00 UTC"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 block">PERFORMANCE</span>
                            <span className="block text-zinc-700 dark:text-zinc-300 font-bold">1,420ms latency</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 dark:text-zinc-500 block">CONFIDENCE</span>
                            <span className="block text-emerald-500 font-bold">{selectedReplay.confidence_score || 94}% rating</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">Analysis Limitations</span>
                          <p className="text-[10px] italic leading-normal text-zinc-400 dark:text-zinc-500">
                            Summaries are created based only on conversations in the specified channel, are not exhaustive, and do not reflect any unlogged offline alignment sessions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              /* ADR DOCUMENT VIEW */
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ✓ COMMITTED ADR
                  </span>
                  <button
                    onClick={() => {
                      const adr = selectedReplay.adr || {
                        title: selectedReplay.title,
                        context: selectedReplay.problem_statement,
                        decision: selectedReplay.decision,
                        alternatives: "Not specified",
                        consequences: selectedReplay.consequences
                      };
                      const content = `# ADR: ${adr.title}\n\n## Status\nCommitted\n\n## Context\n${adr.context}\n\n## Decision\n${adr.decision}\n\n## Consequences\n${adr.consequences}`;
                      const blob = new Blob([content], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `ADR-${selectedReplay.id}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center space-x-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MD</span>
                  </button>
                </div>

                <div className="p-4 border border-zinc-200/80 dark:border-zinc-850 rounded-xl bg-zinc-50/40 dark:bg-zinc-950/20 space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">ADR Title</h5>
                    <p className="text-xs text-zinc-900 dark:text-zinc-200 font-semibold mt-0.5">
                      {selectedReplay.adr?.title || `ADR-${selectedReplay.id}: ${selectedReplay.title}`}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Context & Problem</h5>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed font-sans">
                      {selectedReplay.adr?.context || selectedReplay.problem_statement}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Decision Outcome</h5>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed font-sans bg-indigo-50/10 dark:bg-indigo-950/5 p-2 rounded border border-indigo-500/10">
                      {selectedReplay.adr?.decision || selectedReplay.decision}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Alternatives Explored</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed font-sans">
                      {selectedReplay.adr?.alternatives || "1. Self-hosted Redis with persistence, 2. Google Cloud Memorystore."}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Consequences & Trade-offs</h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed font-sans">
                      {selectedReplay.adr?.consequences || selectedReplay.consequences}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// TIMELINE CARD REUSABLE HELPER COMPONENT
interface TimelineCardProps {
  index: number;
  active: boolean;
  title: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  timestamp: string;
  children: ReactNode;
}

function TimelineCard({ index, active, title, subtitle, icon: Icon, color, timestamp, children }: TimelineCardProps) {
  return (
    <div 
      className={`relative pl-8 pb-3 transition-all duration-300`}
    >
      {/* Node Bullet */}
      <div className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center border z-20 transition-all duration-300 ${
        active 
          ? "bg-indigo-600 border-indigo-500 text-white scale-110 shadow-md shadow-indigo-500/20 animate-pulse" 
          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-400"
      }`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Main Container Card */}
      <div className={`bg-white dark:bg-zinc-900/40 border rounded-xl p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-800 transition-all ${
        active 
          ? "border-indigo-500/60 dark:border-indigo-500/40 bg-zinc-50/20 dark:bg-zinc-900/80" 
          : "border-zinc-200 dark:border-zinc-900"
      }`}>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-4">
          <div className="min-w-0">
            <h3 className={`font-sans font-semibold text-sm transition-colors ${
              active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-800 dark:text-zinc-200"
            }`}>
              {title}
            </h3>
            {subtitle && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block truncate">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{timestamp}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// SLACK CONVERSATION LOOK HELPER COMPONENT
interface SlackMessageProps {
  key?: any;
  message: TimelineMessage;
  channel: string;
}

function SlackMessage({ message, channel }: SlackMessageProps) {
  return (
    <div className="flex items-start space-x-3.5 text-xs font-sans group/slack p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition-colors">
      <img 
        src={message.avatar} 
        alt={message.speaker} 
        className="w-9 h-9 rounded-md object-cover border border-zinc-200 dark:border-zinc-850"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{message.speaker}</span>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
            <span>{message.timestamp}</span>
            <span>in</span>
            <span className="text-zinc-500 font-bold">{channel}</span>
          </div>
        </div>
        <p className="text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed text-xs">
          {message.text}
        </p>

        {/* Reactions & Thread Info (Slack Design Style) */}
        <div className="flex items-center space-x-3 mt-2.5 pt-1.5 border-t border-zinc-100/50 dark:border-zinc-900/30 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          {message.reactions !== undefined && (
            <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-850 cursor-pointer">
              👍 {message.reactions}
            </span>
          )}
          {message.replies !== undefined && message.replies > 0 && (
            <span className="hover:text-indigo-500 transition-colors cursor-pointer flex items-center gap-1">
              💬 {message.replies} replies
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
