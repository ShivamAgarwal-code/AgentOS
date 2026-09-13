import { useState, useEffect } from "react";
import { Settings2, Cpu, Database, Bell, Shield, Slack, Save, Sparkles, CheckCircle2 } from "lucide-react";

export default function SettingsView() {
  const [slackStatus, setSlackStatus] = useState<"connected" | "missing" | "invalid">("missing");
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    fetch("/api/slack-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status) {
          setSlackStatus(data.status);
        }
      })
      .catch((err) => console.error("[Settings] Failed to fetch Slack status:", err));

    fetch("/api/enterprise-demo")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setDemoEnabled(!!data.enabled);
        }
      })
      .catch((err) => console.error("[Settings] Failed to fetch demo status:", err));
  }, []);

  const handleToggleDemo = async (checked: boolean) => {
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/enterprise-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked })
      });
      if (res.ok) {
        const data = await res.json();
        setDemoEnabled(!!data.enabled);
        localStorage.setItem("enterpriseDemo", String(data.enabled));
        // Dispatch an event to notify the rest of the application
        window.dispatchEvent(new CustomEvent("enterprise-demo-toggled", { detail: data.enabled }));
      }
    } catch (err) {
      console.error("[Settings] Failed to toggle Enterprise Demo:", err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div id="settings-container" className="space-y-6 max-w-4xl">
      {/* Sub header */}
      <div className="border-b border-zinc-900 pb-5">
        <h2 className="text-xl font-sans font-medium text-zinc-100">Chronicle Engine Settings</h2>
        <p className="text-xs text-zinc-500">Configure monitored Slack channels, automated reasoning loops, and database local caching engines.</p>
      </div>

      <div className="space-y-6">
        {/* Enterprise Demo Mode Switch */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-sans font-medium text-sm text-zinc-200">Enterprise Demo Mode</h3>
                <p className="text-[11px] text-zinc-500">Enable realistic offline simulations containing hundreds of generated decisions, experts, and activities.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {loadingDemo && <span className="text-[10px] font-mono text-zinc-500">updating...</span>}
              <button
                id="enterprise-demo-toggle-btn"
                disabled={loadingDemo}
                onClick={() => handleToggleDemo(!demoEnabled)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  demoEnabled ? "bg-indigo-600" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform duration-200 ${
                    demoEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {demoEnabled && (
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-indigo-300 font-mono flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span>Offline Enterprise Simulation is Active: Over 120+ decisions and timeline traces loaded. No Slack configuration needed.</span>
            </div>
          )}
        </div>

        {/* Slack Connection panel */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Slack className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-sm text-zinc-200">Slack API Credentials</h3>
              <p className="text-[11px] text-zinc-500">Manage Bot tokens and workspace event configurations.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">Slack Bot User OAuth Token</label>
              <input 
                type="password" 
                value="xoxb-••••••••••••-••••••••••••••••" 
                disabled
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">Signing Secret</label>
              <input 
                type="password" 
                value="••••••••••••••••••••••••••••••••" 
                disabled
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 focus:outline-none font-mono"
              />
            </div>
          </div>
          
          <div className="text-[10px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-900/60 pt-3">
            <span className="text-zinc-500">Credentials managed securely via the AI Studio Secrets panel.</span>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-950/80 rounded-md border border-zinc-900/60 w-fit">
              <span className="text-zinc-500">Slack Status:</span>
              {slackStatus === "connected" && (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  ✓ Connected
                </span>
              )}
              {slackStatus === "missing" && (
                <span className="text-amber-500 font-semibold flex items-center gap-1">
                  ⚠ Credentials Missing
                </span>
              )}
              {slackStatus === "invalid" && (
                <span className="text-amber-500 font-semibold flex items-center gap-1">
                  ⚠ Invalid Credentials
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Database settings */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Database className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-sm text-zinc-200">Local Database Engine</h3>
              <p className="text-[11px] text-zinc-500">Configure SQLite session file pathways and auto-backup policies.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">SQLite DB Filename</label>
              <input 
                type="text" 
                defaultValue="chronicle_memory.db" 
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-200 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase">SQLAlchemy Pool Configuration</label>
              <select className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-300 focus:outline-none">
                <option>SingletonThreadPool (Default for SQLite)</option>
                <option>QueuePool (Production PG)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Loop Settings */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Cpu className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-sm text-zinc-200">AI Reasoning Pipeline</h3>
              <p className="text-[11px] text-zinc-500">Adjust background Claude synthesis parameters.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-300">Automated ADR Generation</p>
                <p className="text-[11px] text-zinc-500">Generates draft Architecture Decision Records in markdown when proposals are marked accepted.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-zinc-50 rounded" />
            </div>
            <hr className="border-zinc-900" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-300">Dynamic Graph Linkage</p>
                <p className="text-[11px] text-zinc-500">Continuously runs semantic analysis to connect threads with similar engineering logic blocks.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-zinc-50 rounded" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-sans transition-all">
            Cancel
          </button>
          <button className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-all flex items-center space-x-1.5 shadow-sm">
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
