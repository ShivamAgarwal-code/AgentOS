import { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Menu,
  X,
  Search,
  User,
  ChevronRight,
  Sparkles,
  Zap,
  RefreshCw,
  FolderLock,
  Volume2
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import AgentConsoleView from "./components/AgentConsoleView";
import IntegrationsView from "./components/IntegrationsView";
import ActivityView from "./components/ActivityView";
import DashboardView from "./components/DashboardView";
import KnowledgeGraphView from "./components/KnowledgeGraphView";
import DecisionReplayView from "./components/DecisionReplayView";
import ExpertFinderView from "./components/ExpertFinderView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import CommandPalette from "./components/CommandPalette";
import { PageId } from "./types";

// URL routing: each sidebar tab maps to a real, deep-linkable path.
const PAGE_TO_PATH: Record<PageId, string> = {
  console: "/",
  integrations: "/integrations",
  activity: "/activity",
  dashboard: "/dashboard",
  knowledge: "/memory",
  replay: "/replay",
  experts: "/experts",
  analytics: "/analytics",
  settings: "/settings",
};

const PATH_TO_PAGE: Record<string, PageId> = Object.entries(PAGE_TO_PATH).reduce(
  (acc, [page, path]) => {
    acc[path] = page as PageId;
    return acc;
  },
  {} as Record<string, PageId>
);

function pageFromLocation(): PageId {
  // A ?replay=<id> query param opens the Decision Replay view.
  if (new URLSearchParams(window.location.search).get("replay")) return "replay";
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_PAGE[path] ?? "console";
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(() => pageFromLocation());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Dark theme only.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
  }, []);

  // Command palette shortcut listener (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Controls to demonstrate empty and loading state skeletons requested by the user
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoEmpty, setDemoEmpty] = useState(false);
  const [enterpriseDemo, setEnterpriseDemo] = useState(() => {
    return localStorage.getItem("enterpriseDemo") === "true";
  });

  // Sync enterprise demo mode state from backend on mount and via events
  useEffect(() => {
    fetch("/api/enterprise-demo")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setEnterpriseDemo(!!data.enabled);
          localStorage.setItem("enterpriseDemo", String(data.enabled));
        }
      })
      .catch((err) => console.error("Failed to load demo mode state:", err));

    const handleToggled = (e: any) => {
      setEnterpriseDemo(!!e.detail);
    };

    window.addEventListener("enterprise-demo-toggled", handleToggled);
    return () => window.removeEventListener("enterprise-demo-toggled", handleToggled);
  }, []);

  const handleToggleEnterpriseDemo = async () => {
    const nextVal = !enterpriseDemo;
    setEnterpriseDemo(nextVal);
    localStorage.setItem("enterpriseDemo", String(nextVal));
    try {
      await fetch("/api/enterprise-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextVal })
      });
      window.dispatchEvent(new CustomEvent("enterprise-demo-toggled", { detail: nextVal }));
    } catch (err) {
      console.error("Failed to sync toggle to backend:", err);
    }
  };

  // Live rotating system logs/events ticker
  const liveTickerEvents = [
    "Refunded a customer in Stripe, opened a Zendesk ticket, and let the team know in Slack",
    "Pulled a new lead from Gmail into HubSpot and handed it to someone on Linear",
    "Booked a meeting on Google Calendar and gave everyone a heads-up in Slack and Discord",
    "Filed a bug in GitHub, copied it into Jira, and dropped a note in #engineering",
    "Connected Notion - the agent can now use all 23 of your apps"
  ];
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % liveTickerEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [liveTickerEvents.length]);
  // Keep view state in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      startTransition(() => setActivePage(pageFromLocation()));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handlePageChange = (page: PageId) => {
    const path = PAGE_TO_PATH[page];
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    startTransition(() => {
      setActivePage(page);
    });
    setMobileMenuOpen(false);
  };

  const triggerDemoLoading = () => {
    setDemoLoading(true);
    setTimeout(() => {
      setDemoLoading(false);
    }, 1500);
  };

  // Render proper breadcrumbs
  const getBreadcrumbs = () => {
    const formatName = (str: string) => {
      if (str === "console") return "Agent Console";
      if (str === "integrations") return "Integrations";
      if (str === "activity") return "Activity";
      if (str === "knowledge") return "Memory Graph";
      if (str === "replay") return "Decision Replay";
      if (str === "experts") return "Expert Finder";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    return (
      <div id="breadcrumbs" className="flex items-center space-x-1.5 text-xs font-mono text-coal-500">
        <span>AgentOS</span>
        <ChevronRight className="w-3.5 h-3.5 text-coal-400 dark:text-coal-700" />
        <span className="text-coal-700 dark:text-cream-400 font-semibold">{formatName(activePage)}</span>
      </div>
    );
  };

  // Render active page view
  const renderActiveView = () => {
    switch (activePage) {
      case "console":
        return <AgentConsoleView />;
      case "integrations":
        return <IntegrationsView />;
      case "activity":
        return <ActivityView />;
      case "dashboard":
        return <DashboardView isLoading={demoLoading} isEmpty={demoEmpty} />;
      case "knowledge":
        return <KnowledgeGraphView />;
      case "replay":
        return <DecisionReplayView setActivePage={handlePageChange} />;
      case "experts":
        return <ExpertFinderView />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView isLoading={demoLoading} isEmpty={demoEmpty} />;
    }
  };

  return (
    <div 
      id="app-root-container" 
      className="flex min-h-screen bg-cream-100 dark:bg-coal-950 text-coal-900 dark:text-cream-50 font-sans selection:bg-clay-200 dark:selection:bg-clay-500/30 selection:text-coal-900 transition-colors duration-200"
    >
      {/* Sidebar - Desktop Layout */}
      <div className="hidden lg:block">
        <Sidebar 
          activePage={activePage} 
          setActivePage={handlePageChange} 
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Menu Slide Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              id="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Drawer body */}
            <motion.div 
              id="mobile-drawer-body"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950 z-50 lg:hidden"
            >
              <div className="flex justify-end p-4 border-b border-zinc-200 dark:border-zinc-900">
                <button id="close-mobile-menu" onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <Sidebar 
                activePage={activePage} 
                setActivePage={handlePageChange} 
                collapsed={false}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div id="main-content-layout" className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Professional Header Section */}
        <header id="app-header" className="h-16 border-b border-cream-300 dark:border-coal-800 bg-cream-100/80 dark:bg-coal-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
          
          {/* Breadcrumbs and Mobile trigger */}
          <div className="flex items-center space-x-3">
            <button 
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(true)} 
              className="lg:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            {getBreadcrumbs()}
          </div>

          {/* Interactive Global Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md min-w-[240px] lg:min-w-[320px] mx-6">
            <button
              id="global-search-trigger-btn"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/80 text-zinc-400 dark:text-zinc-500 text-xs transition-all text-left shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800 min-w-0"
            >
              <div className="flex items-center space-x-2 min-w-0 mr-2 flex-1">
                <Search className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">Search decisions, people, projects, channels...</span>
              </div>
              <kbd className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] px-1.5 py-0.5 rounded shadow-sm text-zinc-500 font-sans flex-shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Controls & Meta indicators */}
          <div className="flex items-center space-x-4">
            
            {/* Mini Toggle Bar for Skeletons & Empty states demonstration */}
            <div id="demo-toggles" className="hidden lg:flex items-center space-x-2.5 bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-900 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-400 dark:text-zinc-600 font-semibold uppercase">DEMO:</span>
              <button 
                id="toggle-loading"
                onClick={triggerDemoLoading}
                className={`transition-colors ${demoLoading ? "text-indigo-600 dark:text-zinc-100 font-bold underline" : "hover:text-zinc-800 dark:hover:text-zinc-200"}`}
              >
                Loading
              </button>
              <span>|</span>
              <button 
                id="toggle-empty"
                onClick={() => setDemoEmpty(!demoEmpty)}
                className={`transition-colors ${demoEmpty ? "text-indigo-600 dark:text-zinc-100 font-bold underline" : "hover:text-zinc-800 dark:hover:text-zinc-200"}`}
              >
                {demoEmpty ? "Real-Data" : "Empty-State"}
              </button>
              <span>|</span>
              <button 
                id="toggle-enterprise-demo"
                onClick={handleToggleEnterpriseDemo}
                className={`transition-colors flex items-center space-x-1 ${enterpriseDemo ? "text-indigo-600 dark:text-indigo-400 font-bold underline" : "hover:text-zinc-800 dark:hover:text-zinc-200"}`}
              >
                <span>Enterprise Demo</span>
                <span className={`w-1.5 h-1.5 rounded-full ${enterpriseDemo ? "bg-indigo-500 animate-pulse" : "bg-zinc-400"}`} />
              </button>
            </div>

            {/* User Avatar metadata */}
            <div id="user-metadata-badge" className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                  alt="SaaS Founder Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden xl:inline text-xs font-medium text-zinc-600 dark:text-zinc-300">Founding Engineer</span>
            </div>
          </div>
        </header>

        {/* Live system events status ticker */}
        <div 
          id="live-ticker-bar"
          className="bg-cream-200/50 dark:bg-coal-900/40 border-b border-cream-300 dark:border-coal-800 h-9 px-6 lg:px-8 flex items-center justify-between text-xs font-mono"
        >
          <div className="flex items-center space-x-2.5 overflow-hidden w-full">
            <span className="inline-flex items-center space-x-1 text-clay-600 dark:text-clay-400 font-semibold uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-500 animate-ping mr-1" />
              Live Feed
            </span>
            <span className="text-cream-400 dark:text-coal-800 shrink-0">|</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="text-zinc-600 dark:text-zinc-400 truncate pr-4"
              >
                {liveTickerEvents[tickerIndex]}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hidden md:flex items-center space-x-1.5 text-zinc-400 dark:text-zinc-600 shrink-0 select-none">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Telemetry online</span>
          </div>
        </div>

        {/* Primary Screen Page Content container */}
        <main id="main-content-scroll" className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + (demoLoading ? "-loading" : "") + (demoEmpty ? "-empty" : "")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette Dialog Modal */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
        onSelectAction={(category, id) => {
          console.log("Selected item:", category, id);
          // Navigate to corresponding view based on selected command palette items
          if (category === "Decisions" || category === "Threads" || category === "Channels") {
            handlePageChange("dashboard");
          } else if (category === "Experts") {
            handlePageChange("experts");
          } else if (category === "Projects") {
            handlePageChange("analytics");
          } else if (category === "Commands") {
            handlePageChange("settings");
          }
        }}
      />
    </div>
  );
}
