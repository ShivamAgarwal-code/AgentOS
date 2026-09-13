import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  X, 
  HelpCircle, 
  Users, 
  MessageSquare, 
  Hash, 
  Folder, 
  Terminal, 
  ArrowUpRight 
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionType: string, id: string) => void;
}

interface CommandItem {
  id: string;
  category: "Decisions" | "Experts" | "Threads" | "Channels" | "Projects" | "Commands";
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    // Decisions
    { id: "dec-014", category: "Decisions", title: "Migrate Elasticsearch database to Pinecone vector store", subtitle: "Architecture decision for Sprint 1 semantic indexing", badge: "Accepted" },
    { id: "dec-015", category: "Decisions", title: "Adopt gRPC streams for live agent telemetry", subtitle: "Replace REST polling loop with persistent bi-directional connection", badge: "Proposed" },
    { id: "dec-016", category: "Decisions", title: "Deprecate Redis SSE Gateway in favor of socket streams", subtitle: "Simplify streaming stack under centralized gateway", badge: "Under Review" },
    
    // Experts
    { id: "exp-elena", category: "Experts", title: "Elena Rostova", subtitle: "Lead System Architect • Principal SSE, DB Architecture, Node.js", badge: "98% Match" },
    { id: "exp-marcus", category: "Experts", title: "Marcus Chen", subtitle: "Senior DevOps Engineer • Kubernetes, Redis, Security Ops", badge: "94% Match" },
    { id: "exp-sarah", category: "Experts", title: "Sarah Jenkins", subtitle: "Director of Product Management • UX Standards, Release Strategy", badge: "88% Match" },
    
    // Threads
    { id: "thread-sse", category: "Threads", title: "sse-gateway-deprecation-discussion", subtitle: "Thread started in #tech-architecture • 42 replies", badge: "Active" },
    { id: "thread-pinecone", category: "Threads", title: "pinecone-vs-qdrant-tradeoffs", subtitle: "Thread started in #ai-engine • 18 replies", badge: "Resolved" },
    
    // Channels
    { id: "chan-tech", category: "Channels", title: "#tech-architecture", subtitle: "Core system patterns, ADR proposals, gateway deprecation logs" },
    { id: "chan-ai", category: "Channels", title: "#ai-retrieval-engine", subtitle: "Zilliz/Pinecone integrations, vector metrics, agent orchestration" },
    { id: "chan-payments", category: "Channels", title: "#payments-pipeline", subtitle: "Stripe event queues, idempotent payment reconciliations" },
    
    // Projects
    { id: "proj-agent", category: "Projects", title: "AI Agent Orchestrator", subtitle: "Central execution flow engine for multi-agent loops", badge: "Sprint 1" },
    { id: "proj-memory", category: "Projects", title: "Organizational Long-Term Memory", subtitle: "Vector embeddings indexing system", badge: "Sprint 1" },
    
    // Commands
    { id: "cmd-query", category: "Commands", title: "/chronicle-query <prompt>", subtitle: "Query organizational memory from slack command line" },
    { id: "cmd-expert", category: "Commands", title: "/expert <skills>", subtitle: "Query the domain expert finder engine directly" },
    { id: "cmd-replay", category: "Commands", title: "/replay <id>", subtitle: "Display detailed historical context of a specific decision" }
  ];

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          if (onSelectAction) {
            onSelectAction(item.category, item.id);
          }
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, onSelectAction]);

  // Icon selector based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Decisions": return <HelpCircle className="w-4 h-4 text-amber-500" />;
      case "Experts": return <Users className="w-4 h-4 text-emerald-500" />;
      case "Threads": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "Channels": return <Hash className="w-4 h-4 text-purple-500" />;
      case "Projects": return <Folder className="w-4 h-4 text-indigo-500" />;
      case "Commands": return <Terminal className="w-4 h-4 text-rose-500" />;
      default: return <Search className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="command-palette-portal" className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop overlay */}
          <motion.div
            id="command-palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            id="command-palette-dialog"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            ref={containerRef}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Input Bar */}
            <div id="palette-search-bar" className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 gap-3">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search decisions, people, projects, channels..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent border-0 outline-none focus:ring-0 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div id="palette-results" className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm font-sans">
                  No matches found for "<span className="font-semibold text-zinc-700 dark:text-zinc-300">{searchQuery}</span>"
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Categorized results */}
                  {Array.from(new Set(filteredItems.map(i => i.category))).map(category => {
                    const categoryItems = filteredItems.filter(i => i.category === category);
                    return (
                      <div key={category} className="space-y-1">
                        <div className="text-[10px] font-mono font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 px-3 py-1 uppercase">
                          {category}
                        </div>
                        <div className="space-y-0.5">
                          {categoryItems.map(item => {
                            // Find absolute index in original filtered list
                            const itemIndex = filteredItems.indexOf(item);
                            const isSelected = itemIndex === selectedIndex;

                            return (
                              <button
                                key={item.id}
                                id={`palette-item-${item.id}`}
                                onClick={() => {
                                  if (onSelectAction) onSelectAction(item.category, item.id);
                                  onClose();
                                }}
                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg transition-all ${
                                  isSelected 
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
                                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                                }`}
                              >
                                <div className="flex items-start space-x-3 min-w-0">
                                  <div className={`mt-0.5 p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 ${
                                    isSelected ? "bg-white dark:bg-zinc-700" : ""
                                  }`}>
                                    {getCategoryIcon(item.category)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{item.title}</p>
                                    {item.subtitle && (
                                      <p className={`text-[10px] truncate ${
                                        isSelected ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"
                                      }`}>{item.subtitle}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 shrink-0 ml-2">
                                  {item.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                                      item.badge === "Accepted" || item.badge.includes("Match")
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : item.badge === "Proposed"
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    }`}>
                                      {item.badge}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instruction Footer */}
            <div id="palette-footer" className="bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-600">
              <div className="flex items-center gap-3">
                <span><kbd className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1 shadow-sm">↑↓</kbd> Navigate</span>
                <span><kbd className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1 shadow-sm">Enter</kbd> Select</span>
                <span><kbd className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1 shadow-sm">Esc</kbd> Close</span>
              </div>
              <div>
                <span>Sprint 0 Global Index</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
