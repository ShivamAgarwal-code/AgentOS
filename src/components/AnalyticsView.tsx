import { BarChart3, TrendingUp, Cpu, Network, MessageSquare, ArrowRight } from "lucide-react";

export default function AnalyticsView() {
  return (
    <div id="analytics-container" className="space-y-6">
      {/* Sub header */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-xl font-sans font-medium text-zinc-100">Cognitive Velocity Analytics</h2>
        <p className="text-xs text-zinc-500">Examine metrics tracking organization learning cycles, conversation entropy, and reasoning capture rates.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Metric Card 1 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-3">
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">COGNITIVE INTEGRATION VELOCITY</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-zinc-100 font-sans tracking-tight">4.2 hours</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center">-12% (Faster)</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Average time from initial Slack thread proposal to automated decision indexation and ADR draft synthesis.
          </p>
        </div>

        {/* Core Metric Card 2 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-3">
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">REASONING CAPTURE RATIO</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-zinc-100 font-sans tracking-tight">91.8%</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center">+4.2%</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Calculated percentage of technical slack channel proposals successfully resolved and captured with valid motivation logs.
          </p>
        </div>

        {/* Core Metric Card 3 */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-3">
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">COMMUNICATION ENTROPY RATE</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-zinc-100 font-sans tracking-tight">12.4%</span>
            <span className="text-xs text-rose-400 font-mono flex items-center">-1.5%</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            The percentage of messages identified as duplicate threads, circular debate patterns, or unresolved logic gates.
          </p>
        </div>
      </div>

      {/* Decorative Custom High-Fidelity SVG Line Chart */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-sans font-medium text-sm text-zinc-100">Monthly Reasoning Synthesis Activity</h4>
            <p className="text-xs text-zinc-500">Historical trend of decisions synthesized automatically vs captured by team actions</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-zinc-100" />
              <span>Automated capture</span>
            </span>
            <span className="flex items-center space-x-1.5 text-zinc-500">
              <span className="w-2.5 h-2.5 rounded bg-zinc-800" />
              <span>User triggered</span>
            </span>
          </div>
        </div>

        {/* Chart representation */}
        <div className="h-64 border border-zinc-900/40 rounded-lg bg-zinc-950/40 flex items-end justify-between p-6 relative">
          
          {/* Chart Axes lines */}
          <div className="absolute inset-x-6 bottom-14 h-[1px] bg-zinc-900" />
          <div className="absolute inset-x-6 top-10 h-[1px] bg-zinc-900/50" />
          <div className="absolute inset-x-6 top-28 h-[1px] bg-zinc-900/50" />

          {/* SVG line overlay */}
          <svg className="absolute inset-x-6 bottom-14 h-40 w-[calc(100%-3rem)] pointer-events-none overflow-visible">
            {/* Automated capture line */}
            <path 
              d="M 0 120 Q 80 100 160 80 T 320 50 T 480 20 T 640 10" 
              fill="none" 
              stroke="#f4f4f5" 
              strokeWidth="2" 
            />
            {/* User triggered capture line */}
            <path 
              d="M 0 140 Q 80 130 160 110 T 320 105 T 480 90 T 640 85" 
              fill="none" 
              stroke="#52525b" 
              strokeWidth="1.5" 
              strokeDasharray="4"
            />
          </svg>

          {/* X axis labels */}
          <div className="absolute inset-x-6 bottom-4 flex justify-between text-[10px] font-mono text-zinc-500">
            <span>JAN</span>
            <span>FEB</span>
            <span>MAR</span>
            <span>APR</span>
            <span>MAY</span>
            <span>JUN</span>
            <span>JUL (NOW)</span>
          </div>

          <div className="absolute top-2.5 left-2.5 text-[10px] text-zinc-600 font-mono">Volume (Decisions)</div>
        </div>
      </div>
    </div>
  );
}
