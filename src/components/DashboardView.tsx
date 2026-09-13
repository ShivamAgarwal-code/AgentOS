import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  RefreshCw,
  FolderLock,
  Compass,
  Smile,
  ZapOff,
  Award
} from "lucide-react";
import { mockDecisions, mockActivities, mockExperts } from "../data";
import { Decision } from "../types";

interface DashboardViewProps {
  isLoading: boolean;
  isEmpty: boolean;
}

// Sparkline helper component
function Sparkline({ points, color = "#6C5CE7" }: { points: number[]; color?: string }) {
  const width = 120;
  const height = 30;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  
  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible select-none shrink-0" id="sparkline-svg">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Numerical count up animation component
function AnimatedNumber({ value, suffix = "", duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration;
    const incrementTime = 30;
    const totalSteps = Math.ceil(totalMiliseconds / incrementTime);
    const stepValue = (end - start) / totalSteps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent((prev) => {
        const next = start + step * stepValue;
        if (step >= totalSteps) {
          clearInterval(timer);
          return end;
        }
        return next;
      });
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formatted = Number.isInteger(value) ? Math.round(current).toString() : current.toFixed(1);
  return <span>{formatted}{suffix}</span>;
}

export default function DashboardView({ isLoading, isEmpty }: DashboardViewProps) {
  const [decisions, setDecisions] = useState<Decision[]>(mockDecisions);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "timeline">("timeline");
  const [enterpriseDemo, setEnterpriseDemo] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const syncAll = async () => {
    try {
      // 1. Fetch demo mode status
      const demoRes = await fetch("/api/enterprise-demo");
      let isDemo = false;
      if (demoRes.ok) {
        const demoData = await demoRes.json();
        isDemo = !!demoData.enabled;
        setEnterpriseDemo(isDemo);
      }

      // 2. Fetch decision replays from database
      const response = await fetch("/api/decision-replay");
      if (response.ok) {
        const replays = await response.json();
        if (replays && replays.length > 0) {
          const mapped: Decision[] = replays.map((r: any) => ({
            id: String(r.id).startsWith("dec-") ? String(r.id) : `dec-${r.id}`,
            title: r.title,
            context: r.problem_statement || r.context || "",
            consequences: r.impact || r.consequences || "",
            project: r.project,
            status: "accepted",
            author: r.participants?.[0] || "Elena Rostova",
            channel: r.channel,
            timestamp: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Just now"
          }));
          setDecisions(mapped);
          setSelectedDecision(mapped[0] || null);
        } else {
          setDecisions([]);
          setSelectedDecision(null);
        }
      }

      // 3. Fetch audit logs
      const auditRes = await fetch("/api/audit-trail");
      if (auditRes.ok) {
        const logs = await auditRes.json();
        setAuditLogs(logs || []);
      }
    } catch (err) {
      console.error("Failed to sync dashboard decisions and audit logs:", err);
    }
  };

  useEffect(() => {
    syncAll();

    // Poll backend every 3500ms to pick up Slack events or new generated replays automatically
    const pollInterval = setInterval(() => {
      syncAll();
    }, 3500);

    // Listen to custom toggle events from settings or header
    const handleToggle = () => {
      syncAll();
    };

    window.addEventListener("enterprise-demo-toggled", handleToggle);
    window.addEventListener("replay-generated", handleToggle);
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("enterprise-demo-toggled", handleToggle);
      window.removeEventListener("replay-generated", handleToggle);
    };
  }, []);

  // Render Skeletons when Loading
  if (isLoading) {
    return (
      <div id="dashboard-loading" className="space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl animate-pulse p-5 space-y-3">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
          ))}
        </div>

        {/* Graph and Recent Decisions Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[320px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl animate-pulse" />
            <div className="h-[280px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-[360px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl animate-pulse" />
            <div className="h-[240px] bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-900 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Render Empty State
  if (isEmpty) {
    return (
      <div id="dashboard-empty" className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto space-y-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-xl w-32 h-32 animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 flex items-center justify-center text-zinc-400 dark:text-zinc-500 shadow-lg relative z-10">
            <FolderLock className="w-10 h-10 text-indigo-500" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-zinc-900 dark:text-zinc-100 font-sans font-semibold text-xl tracking-tight">No Active Organizational Memory</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-sans leading-relaxed max-w-md mx-auto">
            To start mapping your organization's reasoning, invite the <span className="font-semibold text-zinc-700 dark:text-zinc-300">@Chronicle</span> bot to your Slack channels and let it capture live decision trails automatically.
          </p>
        </div>

        {/* Instructive Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 text-left space-y-2 shadow-sm">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">Step 1</span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Invite Chronicle to Slack</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Add @Chronicle to #tech-architecture or any channel where core decisions are debated.</p>
          </div>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 text-left space-y-2 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">Step 2</span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Run capture trigger</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Execute <code className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-[10px] text-zinc-600 dark:text-zinc-400">/chronicle-query</code> in Slack to sync historical memory threads.</p>
          </div>
        </div>

        <button className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all flex items-center space-x-2 shadow-md hover:shadow-indigo-500/10">
          <span>Connect Slack Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Status badge styling helper
  const getStatusBadge = (status: Decision["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Accepted</span>
          </span>
        );
      case "proposed":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3 h-3" />
            <span>Proposed</span>
          </span>
        );
      case "deprecated":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>Deprecated</span>
          </span>
        );
      case "under-review":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            <span>Under Review</span>
          </span>
        );
    }
  };

  // Circular progress math
  const radius = 24;
  const strokeWidth = 3.5;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const healthScore = enterpriseDemo ? 99 : 93;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div id="dashboard-content" className="space-y-6">
      {/* Metric Cards row */}
      <div id="metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Knowledge Health (Polished circular progress card) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">KNOWLEDGE HEALTH</span>
              <div className="flex items-baseline space-x-1.5 mt-2">
                <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                  <AnimatedNumber value={healthScore} suffix="%" />
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center font-bold">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  +{enterpriseDemo ? "12%" : "6%"}
                </span>
              </div>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative flex items-center justify-center shrink-0" id="circular-progress-container">
              <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 select-none">
                <circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="text-zinc-100 dark:text-zinc-800/80"
                />
                <circle
                  stroke="currentColor"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">EXC</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">STATUS: EXCELLENT</span>
            <span className="text-[9px] text-zinc-300 dark:text-zinc-600 font-mono">•</span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">COHESION ACTIVE</span>
          </div>
        </motion.div>

        {/* Decision Count */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">DECISIONS SYNCED</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                <AnimatedNumber value={decisions.length || (enterpriseDemo ? 125 : 4)} />
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center font-bold">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +{enterpriseDemo ? "125" : "4"} new
              </span>
            </div>
          </div>
          {/* Subtle trend Sparkline */}
          <div className="mt-4 flex items-end justify-between">
            <Sparkline points={enterpriseDemo ? [85, 95, 102, 110, 118, 122, 125] : [1, 2, 3, 2, 3, 4, 4]} color="#6C5CE7" />
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">48H FEED</span>
          </div>
        </motion.div>

        {/* Experts */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">EXPERTS MAPPED</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                <AnimatedNumber value={enterpriseDemo ? 18 : 3} />
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center font-bold">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +{enterpriseDemo ? "18" : "3"} expert domains
              </span>
            </div>
          </div>
          {/* Subtle trend Sparkline */}
          <div className="mt-4 flex items-end justify-between">
            <Sparkline points={enterpriseDemo ? [8, 10, 12, 11, 14, 16, 18] : [1, 2, 2, 3, 3, 3, 3]} color="#22c55e" />
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">DOMAINS</span>
          </div>
        </motion.div>

        {/* Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">MONITORED PROJECTS</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                <AnimatedNumber value={enterpriseDemo ? 9 : 3} />
              </span>
              <span className="text-xs text-zinc-500 font-mono">{enterpriseDemo ? "active" : "active"}</span>
            </div>
          </div>
          {/* Subtle trend Sparkline */}
          <div className="mt-4 flex items-end justify-between">
            <Sparkline points={enterpriseDemo ? [3, 4, 4, 5, 5, 8, 9] : [1, 2, 2, 2, 3, 3, 3]} color="#3b82f6" />
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">{enterpriseDemo ? "12 CHANNELS" : "3 CHANNELS"}</span>
          </div>
        </motion.div>

        {/* Active Discussions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
        >
          <div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">THREADS MONITORED</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                <AnimatedNumber value={enterpriseDemo ? 96 : 12} />
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-mono flex items-center font-bold animate-pulse">
                <MessageSquare className="w-2.5 h-2.5 mr-1" />
                Active now
              </span>
            </div>
          </div>
          {/* Subtle trend Sparkline */}
          <div className="mt-4 flex items-end justify-between">
            <Sparkline points={enterpriseDemo ? [40, 54, 48, 62, 70, 85, 96] : [4, 6, 5, 8, 9, 11, 12]} color="#f59e0b" />
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">STREAMING</span>
          </div>
        </motion.div>
      </div>

      {/* Main dashboard content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Graph Preview & Table) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Beautiful interactive custom vector graph preview */}
          <div id="graph-preview" className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">Knowledge Graph Topology</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Live relationship vectors linking Slack threads to architectural decisions</p>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold bg-indigo-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-zinc-800">
                ACTIVE PIPELINE
              </span>
            </div>

            {/* Micro canvas/SVG representation of the graph */}
            <div className="h-64 border border-zinc-200 dark:border-zinc-900/60 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-center relative overflow-hidden">
              {/* Decorative connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 dark:opacity-40">
                <line x1="120" y1="120" x2="300" y2="80" stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-800" />
                <line x1="120" y1="120" x2="250" y2="180" stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-800" />
                <line x1="300" y1="80" x2="480" y2="120" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 dark:text-zinc-700" />
                <line x1="250" y1="180" x2="480" y2="120" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 dark:text-zinc-700" />
                <line x1="480" y1="120" x2="620" y2="140" stroke="currentColor" strokeWidth="1" className="text-zinc-300 dark:text-zinc-800" />
              </svg>

              {/* Node 1: Channels */}
              <div className="absolute left-[8%] top-[40%] flex flex-col items-center group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-zinc-400 transition-colors shadow-sm">
                  <span className="font-mono text-xs">#</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 font-mono">#tech-arch</span>
              </div>

              {/* Node 2: Users */}
              <div className="absolute left-[34%] top-[18%] flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 overflow-hidden group-hover:border-zinc-400 transition-colors shadow-md">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="Elena" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-zinc-700 dark:text-zinc-400 mt-1">Elena R.</span>
              </div>

              {/* Node 3: Users */}
              <div className="absolute left-[28%] top-[60%] flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 overflow-hidden group-hover:border-zinc-400 transition-colors shadow-md">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="Marcus" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-zinc-700 dark:text-zinc-400 mt-1">Marcus C.</span>
              </div>

              {/* Node 4: Main Central Decision (The Hub) with subtle pulse */}
              <div className="absolute left-[58%] top-[35%] flex flex-col items-center group cursor-pointer scale-110">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl filter blur-md animate-pulse duration-1000" />
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:bg-indigo-700 transition-all relative z-10">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="text-[10px] text-zinc-800 dark:text-zinc-200 font-semibold mt-1.5 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 shadow-sm relative z-10">
                  DEC-014
                </span>
              </div>

              {/* Node 5: Output ADR */}
              <div className="absolute left-[82%] top-[45%] flex flex-col items-center group cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-zinc-400 transition-colors shadow-sm">
                  <Zap className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 font-mono">ADR-14</span>
              </div>

              {/* Floating informational banner inside graph */}
              <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5 backdrop-blur-sm shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactively linked: 142 decisions connected across 224 nodes</span>
              </div>
            </div>
          </div>

          {/* Recent Decisions Table & Timeline Switcher */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">Synchronized Decisions</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Decisions parsed from slack conversations by our reasoning engine</p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 self-start sm:self-auto">
                <button
                  id="tab-toggle-timeline"
                  onClick={() => setActiveTab("timeline")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === "timeline"
                      ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  Timeline View
                </button>
                <button
                  id="tab-toggle-table"
                  onClick={() => setActiveTab("table")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === "table"
                      ? "bg-white dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  Table View
                </button>
              </div>
            </div>

            {activeTab === "timeline" ? (
              <div className="space-y-6 pl-2 relative" id="recent-decisions-timeline">
                {/* Vertical timeline line */}
                <div className="absolute left-5 top-2 bottom-2 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                
                {decisions.map((dec, idx) => {
                  const expert = mockExperts.find(e => e.name === dec.author);
                  return (
                    <div 
                      key={dec.id} 
                      className="flex items-start gap-4 relative group cursor-pointer"
                      onClick={() => setSelectedDecision(dec)}
                    >
                      {/* Circle indicator */}
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all ${
                        selectedDecision?.id === dec.id 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10" 
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover:border-zinc-400"
                      }`}>
                        <span className="text-[10px] font-mono font-bold">0{idx + 1}</span>
                      </div>

                      {/* Content Box */}
                      <div className={`flex-1 p-4 rounded-xl border transition-all ${
                        selectedDecision?.id === dec.id
                          ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-300 dark:border-zinc-800"
                          : "bg-white/50 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-800 hover:bg-white/80 dark:hover:bg-zinc-900/20"
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                              {dec.id.toUpperCase()}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">{dec.project}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(dec.status)}
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{dec.timestamp}</span>
                          </div>
                        </div>
                        
                        <h5 className={`font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-150 transition-colors ${
                          selectedDecision?.id === dec.id ? "text-indigo-600 dark:text-indigo-400" : "group-hover:text-indigo-500"
                        }`}>
                          {dec.title}
                        </h5>
                        
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                          {dec.context}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          <span className="flex items-center gap-1.5">
                            <img 
                              src={expert?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"}
                              alt={dec.author} 
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-sans text-zinc-600 dark:text-zinc-400 font-medium">{dec.author}</span>
                          </span>
                          <span>Recorded in <strong className="text-zinc-500 dark:text-zinc-400">{dec.channel}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-900 text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                      <th className="pb-3 font-normal">Decision / Project</th>
                      <th className="pb-3 font-normal">Author</th>
                      <th className="pb-3 font-normal">Channel</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal text-right">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-900/60 text-xs">
                    {decisions.map((dec) => (
                      <tr 
                        key={dec.id} 
                        id={`decision-row-${dec.id}`}
                        className={`group hover:bg-zinc-50 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors ${
                          selectedDecision?.id === dec.id ? "bg-zinc-100/50 dark:bg-zinc-900/40 font-medium" : ""
                        }`}
                        onClick={() => setSelectedDecision(dec)}
                      >
                        <td className="py-3.5 pr-4">
                          <div className="font-sans text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                            {dec.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {dec.project}
                          </div>
                        </td>
                        <td className="py-3.5 text-zinc-600 dark:text-zinc-400 font-sans">{dec.author}</td>
                        <td className="py-3.5 text-zinc-500 font-mono">{dec.channel}</td>
                        <td className="py-3.5">{getStatusBadge(dec.status)}</td>
                        <td className="py-3.5 text-zinc-500 text-right font-mono">{dec.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Side Panels) */}
        <div className="space-y-6">
          
          {/* Expert Spotlight Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold uppercase tracking-wider">EXPERT SPOTLIGHT</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30 font-bold flex items-center gap-1">
                <Award className="w-3 h-3" /> FEATURED
              </span>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120" 
                  alt="Elena Rostova" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/25"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-white dark:border-zinc-900 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-none">Elena Rostova</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">Principal Infrastructure Architect</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-zinc-400 dark:text-zinc-500">REASONING CONFIDENCE</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">98% Match Score</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-855 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: "98%" }} />
              </div>
            </div>

            <div>
              <h5 className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Top Verified Domains</h5>
              <div className="flex flex-wrap gap-1.5">
                {["Elasticsearch", "Pinecone", "Vector DBs", "Kubernetes", "AWS"].map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono border-t border-zinc-100 dark:border-zinc-900/60">
              <span>Active in #tech-architecture</span>
              <span>34 Decisions Mapped</span>
            </div>
          </motion.div>

          {/* Active Detail Inspection Panel */}
          {selectedDecision && (
            <motion.div 
              layoutId="decisionDetailPanel"
              id="selected-decision-detail"
              className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-4 relative shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-bold tracking-wider">SELECTED DECISION DETAIL</span>
                <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  {selectedDecision.id.toUpperCase()}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-200 leading-snug">{selectedDecision.title}</h4>
                <span className="text-[10px] text-zinc-500 font-mono block">Project: {selectedDecision.project}</span>
              </div>

              <hr className="border-zinc-200 dark:border-zinc-900" />

              <div className="space-y-3.5">
                <div>
                  <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">CONTEXT & MOTIVATION</h5>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans mt-1">
                    {selectedDecision.context}
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">CONSEQUENCES & TRADE-OFFS</h5>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans mt-1">
                    {selectedDecision.consequences}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono border-t border-zinc-200/50 dark:border-zinc-900/40">
                <span>By: {selectedDecision.author}</span>
                <span>In: {selectedDecision.channel}</span>
              </div>
            </motion.div>
          )}

          {/* Enterprise Audit Trail */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <FolderLock className="w-4 h-4 text-indigo-500 shrink-0" />
                <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">Enterprise Audit Trail</h4>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Verifiable logging of organizational reasoning operations</p>
            </div>

            <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-900/80 bg-zinc-50/40 dark:bg-zinc-950/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate max-w-[140px]" title={act.user}>
                        {act.user}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span className="text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                        {act.action}
                      </span>
                      <span>
                        {act.duration ? `${(act.duration / 1000).toFixed(1)}s` : "1.4s"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono border-t border-zinc-100 dark:border-zinc-900/60 pt-1.5">
                      <span className="text-zinc-400">{act.model}</span>
                      <span className="text-emerald-500 font-semibold">{act.confidence ? `${act.confidence.toFixed(1)}% conf` : "88.5% conf"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">No audit logs recorded yet.</p>
              )}
            </div>
          </div>

          {/* Upcoming Reviews Panel */}
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100">Decision Lifecycles</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Proposals scheduled for upcoming reviews</p>
            </div>

            <div className="p-3 border border-zinc-200 dark:border-zinc-900 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 text-xs flex justify-between items-center group cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
              <div>
                <p className="text-zinc-800 dark:text-zinc-300 font-semibold">SSE Gateway Deprecation Review</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Scheduled in 3 days</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
