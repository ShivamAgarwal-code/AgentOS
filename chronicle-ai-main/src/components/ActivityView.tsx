import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Check, ExternalLink, Activity as ActivityIcon, RefreshCw, Sparkles } from "lucide-react";
import AppIcon from "./AppIcon";

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

interface Meta {
  id: string;
  color: string;
  icon: string;
}

export default function ActivityView() {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch("/api/activity").then((r) => r.json()),
      fetch("/api/integrations").then((r) => r.json()),
    ])
      .then(([acts, ints]: [ActivityRecord[], Meta[]]) => {
        setRecords(acts);
        const m: Record<string, Meta> = {};
        ints.forEach((i: any) => (m[i.id] = i));
        setMeta(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div id="activity-view" className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-coal-900 dark:text-cream-50">Activity</h2>
          <p className="text-sm text-coal-500 dark:text-cream-400 mt-1">Every action the agent has taken across your apps.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-cream-300 dark:border-coal-700 bg-cream-50 dark:bg-coal-900/40 text-coal-600 dark:text-cream-300 hover:border-clay-300 hover:text-clay-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 shimmer" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-cream-400 dark:border-coal-800">
          <div className="w-12 h-12 rounded-2xl bg-clay-100 dark:bg-clay-500/10 flex items-center justify-center mx-auto mb-4">
            <ActivityIcon className="w-6 h-6 text-clay-500" />
          </div>
          <p className="text-sm font-medium text-coal-700 dark:text-cream-200">No actions yet</p>
          <p className="text-xs text-coal-400 dark:text-coal-600 mt-1 flex items-center justify-center gap-1">
            Head to the <Sparkles className="w-3 h-3 text-clay-500" /> Agent Console and give the agent a goal.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical timeline line */}
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-cream-300 dark:bg-coal-800" />
          <div className="space-y-3">
            {records.map((rec, i) => {
              const m = meta[rec.app_id];
              const live = rec.status === "success";
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                  className="relative flex items-start gap-4 rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 p-4 hover:border-clay-200 dark:hover:border-coal-700 transition-colors"
                >
                  <div className="relative z-10">
                    <AppIcon icon={m?.icon || "Plug"} color={m?.color || "#d97757"} size="w-11 h-11" iconSize="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-coal-900 dark:text-cream-50">{rec.app_name}</span>
                      <span className="text-coal-300 dark:text-coal-700">·</span>
                      <span className="text-sm text-coal-600 dark:text-cream-300">{rec.action}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          live ? "bg-warmgold-400/15 text-warmgold-500" : "bg-clay-100 dark:bg-clay-500/10 text-clay-600 dark:text-clay-400"
                        }`}
                      >
                        {live ? "live" : "simulated"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-coal-700 dark:text-cream-200">
                      <div className="w-4 h-4 rounded-full bg-warmgold-400/20 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-warmgold-500" />
                      </div>
                      <span className="truncate">{rec.result}</span>
                      {rec.link && (
                        <a href={rec.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-clay-600 dark:text-clay-400 hover:underline shrink-0">
                          open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-coal-400 dark:text-coal-600 mt-1.5 truncate">
                      Goal: <span className="italic">{rec.goal}</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-coal-400 dark:text-coal-600 shrink-0">{formatTime(rec.time)}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
