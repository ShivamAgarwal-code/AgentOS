import { Search, Mail, Cpu, Award, Zap } from "lucide-react";
import { mockExperts } from "../data";

export default function ExpertFinderView() {
  return (
    <div id="expert-finder-container" className="space-y-6">
      {/* Sub header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-sans font-medium text-zinc-100">Expert Finder Engine</h2>
          <p className="text-xs text-zinc-500">Discover domain experts and team deciders based on real slack conversations and decision authorship.</p>
        </div>
        <button className="px-4.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:text-zinc-100 text-xs font-sans transition-all flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span>Re-Index Experts</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search expert profiles by skill (e.g. Pinecone, SAML, gRPC, Go, Postgres)..." 
          className="w-full pl-9 pr-4 py-2 bg-zinc-900/30 border border-zinc-900 rounded-lg text-xs font-sans text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      {/* Grid of Experts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockExperts.map((exp) => (
          <div key={exp.id} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 hover:border-zinc-800 transition-all flex flex-col md:flex-row justify-between gap-4">
            
            {/* User Meta */}
            <div className="flex space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-800 flex-shrink-0">
                <img src={exp.avatar} alt={exp.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans font-medium text-sm text-zinc-100">{exp.name}</h3>
                <p className="text-xs text-zinc-500">{exp.role}</p>
                <div className="text-[10px] text-zinc-500 font-mono">Slack ID: <span className="text-zinc-400">{exp.slackId}</span></div>
                
                {/* Skills Row */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {exp.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-zinc-950 text-[10px] text-zinc-400 font-mono border border-zinc-900">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics column */}
            <div className="flex md:flex-col justify-between items-end border-t md:border-t-0 border-zinc-900 pt-3 md:pt-0 md:pl-4 md:border-l md:border-zinc-900 min-w-[120px] flex-shrink-0">
              <div className="text-right space-y-1">
                <div className="text-[10px] text-zinc-500 font-mono">CONFIDENCE SCORE</div>
                <div className="text-lg font-semibold text-zinc-200 font-sans tracking-tight flex items-center justify-end">
                  <Award className="w-4 h-4 text-zinc-500 mr-1" />
                  {exp.confidence}%
                </div>
              </div>
              <div className="text-right space-y-0.5 mt-2">
                <div className="text-[10px] text-zinc-500 font-mono">DECISIONS AUTHORED</div>
                <div className="text-sm font-medium text-zinc-300 font-mono flex items-center justify-end">
                  <Zap className="w-3.5 h-3.5 text-zinc-500 mr-1" />
                  {exp.decisionCount} Decisions
                </div>
              </div>
              <button className="hidden md:flex items-center space-x-1.5 text-[10px] text-zinc-400 font-mono hover:text-zinc-200 mt-4 transition-colors">
                <Mail className="w-3 h-3" />
                <span>Contact via Slack</span>
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
