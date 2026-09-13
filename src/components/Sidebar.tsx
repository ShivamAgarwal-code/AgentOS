import { motion } from "motion/react";
import {
  Sparkles,
  Plug,
  Activity,
  LayoutDashboard,
  Network,
  History,
  Users2,
  BarChart3,
  Settings2,
  Github,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageId } from "../types";
import AgentOSLogo from "./AgentOSLogo";

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof Sparkles;
}

const primaryItems: NavItem[] = [
  { id: "console", label: "Agent Console", icon: Sparkles },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "activity", label: "Activity", icon: Activity },
];

const memoryItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "knowledge", label: "Memory Graph", icon: Network },
  { id: "replay", label: "Decision Replay", icon: History },
  { id: "experts", label: "Expert Finder", icon: Users2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export default function Sidebar({ activePage, setActivePage, collapsed = false, setCollapsed }: SidebarProps) {
  const renderItem = (item: NavItem) => {
    const IconComponent = item.icon;
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => setActivePage(item.id)}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center rounded-lg text-sm font-medium transition-all relative group ${
          collapsed ? "justify-center py-3" : "space-x-3 px-3 py-2.5"
        } ${
          isActive
            ? "text-coal-900 dark:text-cream-50 font-semibold bg-clay-100/70 dark:bg-clay-500/10"
            : "text-coal-500 dark:text-cream-400 hover:text-coal-900 dark:hover:text-cream-200 hover:bg-cream-200/60 dark:hover:bg-coal-800/50"
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="active-nav-indicator"
            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-clay-500"
          />
        )}
        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-clay-600 dark:text-clay-400" : "text-coal-400 group-hover:text-clay-500"}`} />
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {item.label}
          </motion.span>
        )}
      </button>
    );
  };

  return (
    <aside
      id="sidebar-container"
      className={`bg-cream-100 dark:bg-coal-950 border-r border-cream-300 dark:border-coal-800 flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex flex-col flex-1 py-6 overflow-y-auto ${collapsed ? "px-2" : "px-4"}`}>
        {/* Brand */}
        <div
          id="brand-logo"
          className={`flex items-center space-x-2.5 mb-8 text-coal-900 dark:text-cream-50 ${collapsed ? "justify-center px-0" : "px-3"}`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-clay-500 animate-floatSlow">
            <AgentOSLogo className="w-8 h-8" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <h1 className="font-sans font-semibold text-sm tracking-tight">AgentOS</h1>
              <span className="text-[10px] text-clay-600/80 dark:text-clay-400/80 font-mono uppercase tracking-wider">Cross-app agent</span>
            </motion.div>
          )}
        </div>

        {/* Primary agent nav */}
        <nav id="sidebar-nav-primary" className="space-y-1.5">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-coal-400 dark:text-coal-600">Agent</p>
          )}
          {primaryItems.map(renderItem)}
        </nav>

        {/* Secondary / memory nav */}
        <nav id="sidebar-nav-memory" className="space-y-1.5 mt-6">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-coal-400 dark:text-coal-600">Memory</p>
          )}
          {memoryItems.map(renderItem)}
        </nav>
      </div>

      {/* Footer */}
      <div id="sidebar-footer" className={`border-t border-cream-300 dark:border-coal-800 ${collapsed ? "p-2 space-y-2" : "p-4 space-y-3"}`}>
        {!collapsed ? (
          <>
            <a
              id="github-link"
              href="https://github.com/agentos"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-mono text-coal-500 hover:text-clay-600 dark:hover:text-clay-400 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>github.com/agentos</span>
            </a>
            <a
              id="docs-link"
              href="/docs/architecture/sprint0_architecture.md"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-mono text-coal-500 hover:text-clay-600 dark:hover:text-clay-400 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>documentation</span>
            </a>
            <div id="version-display" className="px-3 py-1 flex items-center justify-end text-[10px] text-coal-400 dark:text-coal-600 font-mono">
              <span>v1.0.0</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <a href="https://github.com/agentos" target="_blank" rel="noopener noreferrer" title="GitHub" className="p-1.5 rounded-md hover:bg-cream-200 dark:hover:bg-coal-800 text-coal-500">
              <Github className="w-4 h-4" />
            </a>
          </div>
        )}

        {setCollapsed && (
          <button
            id="sidebar-collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md border border-cream-300 dark:border-coal-800 hover:bg-cream-200 dark:hover:bg-coal-800 text-coal-500 hover:text-coal-900 dark:hover:text-cream-200 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}
