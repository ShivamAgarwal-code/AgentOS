import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  Zap,
  ExternalLink,
  Cpu,
  CircleSlash,
  Wand2,
} from "lucide-react";
import AppIcon from "./AppIcon";

interface ExecutedStep {
  app_id: string;
  app_name: string;
  action_id: string;
  action_label: string;
  description: string;
  params: Record<string, string>;
  rationale: string;
  status: "success" | "simulated" | "skipped" | "error";
  result: string;
  link?: string;
}

interface AgentRun {
  id: string;
  goal: string;
  summary: string;
  planner: "claude" | "heuristic";
  steps: ExecutedStep[];
  apps_used: string[];
}

interface Meta {
  id: string;
  name: string;
  color: string;
  icon: string;
  connected: boolean;
}

const EXAMPLES = [
  "A customer emailed asking for a refund - process it and keep everyone in the loop",
  "We found a critical bug in checkout. Triage it across the team.",
  "Schedule a 30-min product sync with the team for tomorrow and announce it",
  "A new lead came in from the website - get sales on it",
  "Draft our weekly investor update and circulate it for review",
];

export default function AgentConsoleView() {
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "planning" | "executing" | "done">("idle");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((list: Meta[]) => {
        const m: Record<string, Meta> = {};
        list.forEach((i) => (m[i.id] = i));
        setMeta(m);
      })
      .catch(() => {});
    return () => timers.current.forEach((t) => clearTimeout(t));
  }, []);

  const connectedCount = Object.values(meta).filter((m: Meta) => m.connected).length;

  const runAgent = async (g: string) => {
    const text = g.trim();
    if (!text || running) return;
    timers.current.forEach((t) => clearTimeout(t));
    setError(null);
    setRun(null);
    setVisibleSteps(0);
    setRunning(true);
    setPhase("planning");

    try {
      // Small planning beat for a live feel.
      const started = Date.now();
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: text }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Agent run failed");
      }
      const data: AgentRun = await res.json();

      // Ensure the "planning" state is visible for at least ~900ms.
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 900 - elapsed);
      timers.current.push(
        window.setTimeout(() => {
          setRun(data);
          setPhase("executing");
          // Reveal steps one-by-one for a live execution feel.
          data.steps.forEach((_, i) => {
            timers.current.push(
              window.setTimeout(() => {
                setVisibleSteps(i + 1);
                if (i === data.steps.length - 1) {
                  timers.current.push(
                    window.setTimeout(() => {
                      setPhase("done");
                      setRunning(false);
                    }, 650)
                  );
                }
              }, 650 * (i + 1))
            );
          });
          if (data.steps.length === 0) {
            setPhase("done");
            setRunning(false);
          }
        }, wait)
      );
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setPhase("idle");
      setRunning(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runAgent(goal);
    }
  };

  const reset = () => {
    timers.current.forEach((t) => clearTimeout(t));
    setRun(null);
    setPhase("idle");
    setGoal("");
    setVisibleSteps(0);
    setError(null);
  };

  return (
    <div id="agent-console" className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40">
        <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-clay-400/20 blur-3xl pointer-events-none animate-floatSlow" />
        <div className="relative px-6 sm:px-10 py-10 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-100/80 dark:bg-clay-500/10 border border-clay-200 dark:border-clay-500/20 text-clay-700 dark:text-clay-300 text-[11px] font-mono uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              One agent · {Object.keys(meta).length || 23} apps
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-coal-900 dark:text-cream-50 leading-tight">
              What should the <span className="text-gradient-clay">agent</span> do?
            </h1>
            <p className="mt-3 text-sm sm:text-base text-coal-500 dark:text-cream-400 max-w-2xl">
              Describe a goal in plain English. AgentOS plans a workflow and takes action across your connected
              apps - Slack, Gmail, Notion, GitHub, Calendar and more.
            </p>

            {/* Input */}
            <div className="mt-7">
              <div className="relative rounded-2xl border border-cream-300 dark:border-coal-700 bg-cream-50 dark:bg-coal-950/60 shadow-sm focus-within:border-clay-400 focus-within:ring-4 focus-within:ring-clay-500/10 transition-all">
                <textarea
                  id="agent-goal-input"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  disabled={running}
                  placeholder="e.g. A customer emailed about a refund - process it and notify the team…"
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-coal-800 dark:text-cream-100 placeholder:text-coal-400 dark:placeholder:text-coal-600 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <span className="text-[11px] font-mono text-coal-400 dark:text-coal-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-clay-500 animate-pulse" />
                    {connectedCount} apps connected · ⌘⏎ to run
                  </span>
                  <button
                    id="run-agent-btn"
                    onClick={() => runAgent(goal)}
                    disabled={running || !goal.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-clay-500 hover:bg-clay-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm transition-all active:scale-95"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {running ? "Working…" : "Run agent"}
                  </button>
                </div>
              </div>

              {/* Example chips */}
              {phase === "idle" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {EXAMPLES.map((ex, i) => (
                    <motion.button
                      key={ex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => {
                        setGoal(ex);
                        runAgent(ex);
                      }}
                      className="text-left text-xs px-3 py-2 rounded-lg border border-cream-300 dark:border-coal-700 bg-cream-100/60 dark:bg-coal-900/40 text-coal-600 dark:text-cream-400 hover:border-clay-300 hover:text-clay-700 dark:hover:text-clay-300 transition-all"
                    >
                      {ex}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-clay-300 bg-clay-50 dark:bg-clay-500/10 text-clay-700 dark:text-clay-300 px-4 py-3 text-sm flex items-center gap-2">
          <CircleSlash className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Planning state */}
      <AnimatePresence>
        {phase === "planning" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 p-6"
          >
            <div className="flex items-center gap-3 text-coal-700 dark:text-cream-200">
              <div className="w-10 h-10 rounded-xl bg-clay-100 dark:bg-clay-500/10 flex items-center justify-center animate-pulseRing">
                <Wand2 className="w-5 h-5 text-clay-600 dark:text-clay-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Planning your workflow…</p>
                <p className="text-xs text-coal-500 dark:text-coal-400">Claude is deciding which apps to act across.</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-cream-200/60 dark:bg-coal-800/40 shimmer" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run result */}
      <AnimatePresence>
        {run && (phase === "executing" || phase === "done") && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Summary card */}
            <div className="rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-clay-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-coal-900 dark:text-cream-50">Agent plan</p>
                    <p className="text-sm text-coal-600 dark:text-cream-300 mt-0.5 max-w-2xl">{run.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border border-cream-300 dark:border-coal-700 text-coal-500 dark:text-cream-400">
                    <Cpu className="w-3 h-3" />
                    {run.planner === "claude" ? "Claude Opus 4.8" : "Heuristic planner"}
                  </span>
                  {phase === "done" && (
                    <button
                      onClick={reset}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-clay-100 dark:bg-clay-500/10 text-clay-700 dark:text-clay-300 hover:bg-clay-200 transition-colors"
                    >
                      New goal
                    </button>
                  )}
                </div>
              </div>

              {/* apps used */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-coal-400 dark:text-coal-600 uppercase tracking-wider">Acting across</span>
                {run.apps_used.map((id) => {
                  const m = meta[id];
                  return m ? (
                    <div key={id} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border border-cream-300 dark:border-coal-700 bg-cream-100/60 dark:bg-coal-900/40">
                      <AppIcon icon={m.icon} color={m.color} size="w-5 h-5" iconSize="w-3 h-3" />
                      <span className="text-[11px] font-medium text-coal-600 dark:text-cream-300">{m.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Steps timeline */}
            <div className="relative pl-2">
              <div className="space-y-3">
                {run.steps.slice(0, visibleSteps).map((step, i) => {
                  const m = meta[step.app_id];
                  const done = phase === "done" || i < visibleSteps - 1;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                      className="relative rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <AppIcon icon={m?.icon || "Plug"} color={m?.color || "#d97757"} size="w-11 h-11" iconSize="w-5 h-5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono text-coal-400 dark:text-coal-600">Step {i + 1}</span>
                            <span className="text-sm font-semibold text-coal-900 dark:text-cream-50">{step.app_name}</span>
                            <span className="text-coal-300 dark:text-coal-700">·</span>
                            <span className="text-sm text-coal-600 dark:text-cream-300">{step.action_label}</span>
                            <StatusBadge status={step.status} done={done} />
                          </div>
                          <p className="text-sm text-coal-600 dark:text-cream-400 mt-1">{step.description}</p>

                          {/* params */}
                          {Object.keys(step.params).length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {Object.entries(step.params).slice(0, 4).map(([k, v]) => (
                                <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cream-200/70 dark:bg-coal-800/60 text-coal-500 dark:text-cream-400 truncate max-w-[220px]">
                                  <span className="text-clay-600 dark:text-clay-400">{k}</span>: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* result */}
                          <AnimatePresence>
                            {done && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3 flex items-center gap-2 text-sm text-coal-700 dark:text-cream-200"
                              >
                                <div className="w-5 h-5 rounded-full bg-warmgold-400/20 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-warmgold-500" />
                                </div>
                                <span>{step.result}</span>
                                {step.link && (
                                  <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-clay-600 dark:text-clay-400 hover:underline">
                                    open <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* executing shimmer for the next pending step */}
                {phase === "executing" && visibleSteps < run.steps.length && (
                  <div className="rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 p-5 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-clay-500 animate-spin" />
                    <span className="text-sm text-coal-500 dark:text-coal-400">Executing step {visibleSteps + 1} of {run.steps.length}…</span>
                  </div>
                )}
              </div>
            </div>

            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-warmgold-400/40 bg-warmgold-400/5 p-5 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warmgold-400/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-warmgold-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-coal-900 dark:text-cream-50">Workflow complete</p>
                    <p className="text-xs text-coal-500 dark:text-cream-400">
                      {run.steps.length} action{run.steps.length !== 1 ? "s" : ""} taken across {run.apps_used.length} app{run.apps_used.length !== 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => runAgent(goal)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-clay-700 dark:text-clay-300 hover:gap-3 transition-all"
                >
                  Run again <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status, done }: { status: string; done: boolean }) {
  if (!done) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cream-200/70 dark:bg-coal-800/60 text-coal-500">
        <Loader2 className="w-2.5 h-2.5 animate-spin" /> running
      </span>
    );
  }
  const live = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
        live
          ? "bg-warmgold-400/15 text-warmgold-500"
          : "bg-clay-100 dark:bg-clay-500/10 text-clay-600 dark:text-clay-400"
      }`}
    >
      {live ? "live" : "simulated"}
    </span>
  );
}
