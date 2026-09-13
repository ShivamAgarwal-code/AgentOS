import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Check, Plus, Zap, Plug } from "lucide-react";
import AppIcon from "./AppIcon";

interface Integration {
  id: string;
  name: string;
  category: string;
  color: string;
  icon: string;
  description: string;
  liveCapable: boolean;
  actionCount: number;
  connected: boolean;
}

export default function IntegrationsView() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((data: Integration[]) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesCat = activeCat === "All" || i.category === activeCat;
      const q = query.toLowerCase();
      const matchesQuery = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [items, activeCat, query]);

  const connectedCount = items.filter((i) => i.connected).length;

  const toggle = async (item: Integration) => {
    setPending((p) => ({ ...p, [item.id]: true }));
    const next = !item.connected;
    // optimistic update
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, connected: next } : i)));
    try {
      const res = await fetch(`/api/integrations/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected: next }),
      });
      const data = await res.json();
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, connected: !!data.connected } : i)));
    } catch {
      // rollback
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, connected: item.connected } : i)));
    } finally {
      setPending((p) => ({ ...p, [item.id]: false }));
    }
  };

  return (
    <div id="integrations-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-coal-900 dark:text-cream-50">Integrations</h2>
          <p className="text-sm text-coal-500 dark:text-cream-400 mt-1">
            Connect the apps your agent can take action in. The more you connect, the more it can do in one run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatPill label="Connected" value={`${connectedCount}`} accent />
          <StatPill label="Available" value={`${items.length}`} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-coal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cream-300 dark:border-coal-700 bg-cream-50 dark:bg-coal-900/40 text-sm text-coal-800 dark:text-cream-100 placeholder:text-coal-400 focus:outline-none focus:border-clay-400 focus:ring-4 focus:ring-clay-500/10 transition-all"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCat === cat
                ? "bg-clay-500 text-white shadow-sm"
                : "bg-cream-100/70 dark:bg-coal-900/40 border border-cream-300 dark:border-coal-700 text-coal-600 dark:text-cream-400 hover:border-clay-300 hover:text-clay-700 dark:hover:text-clay-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 shimmer" />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
                className={`group relative rounded-2xl border p-5 transition-all ${
                  item.connected
                    ? "border-clay-300 dark:border-clay-500/30 bg-clay-50/60 dark:bg-clay-500/5"
                    : "border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40 hover:border-clay-200 dark:hover:border-coal-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <AppIcon icon={item.icon} color={item.color} size="w-11 h-11" iconSize="w-5 h-5" />
                  {item.connected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-warmgold-400/15 text-warmgold-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-warmgold-400 animate-pulse" /> connected
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-sm font-semibold text-coal-900 dark:text-cream-50 flex items-center gap-1.5">
                  {item.name}
                  {item.liveCapable && (
                    <span title="Supports live execution">
                      <Zap className="w-3.5 h-3.5 text-clay-500" />
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-xs text-coal-500 dark:text-cream-400 leading-relaxed min-h-[32px]">{item.description}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-coal-400 dark:text-coal-600">
                    {item.actionCount} action{item.actionCount !== 1 ? "s" : ""} · {item.category}
                  </span>
                  <button
                    onClick={() => toggle(item)}
                    disabled={pending[item.id]}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                      item.connected
                        ? "bg-cream-200/80 dark:bg-coal-800/70 text-coal-600 dark:text-cream-300 hover:bg-clay-100 hover:text-clay-700"
                        : "bg-clay-500 text-white hover:bg-clay-600 shadow-sm"
                    }`}
                  >
                    {item.connected ? (
                      <><Check className="w-3.5 h-3.5" /> Connected</>
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Connect</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-coal-400 dark:text-coal-600">
          <Plug className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No apps match your search.</p>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`px-4 py-2 rounded-xl border text-center ${
        accent
          ? "border-clay-300 dark:border-clay-500/30 bg-clay-50/70 dark:bg-clay-500/5"
          : "border-cream-300 dark:border-coal-800 bg-cream-50 dark:bg-coal-900/40"
      }`}
    >
      <div className={`text-lg font-semibold ${accent ? "text-clay-600 dark:text-clay-400" : "text-coal-800 dark:text-cream-100"}`}>{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-coal-400 dark:text-coal-600">{label}</div>
    </div>
  );
}
