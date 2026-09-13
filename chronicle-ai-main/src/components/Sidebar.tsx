import { motion } from "motion/react";
import { 
  LayoutDashboard, 
  Network, 
  History, 
  Users2, 
  BarChart3, 
  Settings2, 
  Github, 
  BookOpen, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PageId } from "../types";
import ChronicleLogo from "./ChronicleLogo";

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({ activePage, setActivePage, collapsed = false, setCollapsed }: SidebarProps) {
  const menuItems = [
    { id: "dashboard" as PageId, label: "Dashboard", icon: LayoutDashboard },
    { id: "knowledge" as PageId, label: "Memory Graph", icon: Network },
    { id: "replay" as PageId, label: "Decision Replay", icon: History },
    { id: "experts" as PageId, label: "Expert Finder", icon: Users2 },
    { id: "analytics" as PageId, label: "Analytics", icon: BarChart3 },
    { id: "settings" as PageId, label: "Settings", icon: Settings2 },
  ];

  return (
    <aside 
      id="sidebar-container" 
      className={`bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex flex-col flex-1 py-6 ${collapsed ? "px-2" : "px-4"}`}>
        {/* Brand Logo Container */}
        <div 
          id="brand-logo" 
          className={`flex items-center space-x-2.5 mb-8 text-zinc-900 dark:text-zinc-50 ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ChronicleLogo className="w-8 h-8" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-sans font-semibold text-sm tracking-tight">Chronicle AI</h1>
              <span className="text-[10px] text-zinc-500 font-mono">REASONING ENGINE</span>
            </motion.div>
          )}
        </div>

        {/* Navigation Section */}
        <nav id="sidebar-nav" className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActivePage(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-lg text-sm font-medium transition-all relative ${
                  collapsed ? "justify-center py-3" : "space-x-3 px-3 py-2.5"
                } ${
                  isActive 
                    ? "text-zinc-900 dark:text-zinc-50 font-semibold bg-zinc-100/50 dark:bg-zinc-900/60" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30"
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Meta Navigation */}
      <div id="sidebar-footer" className={`border-t border-zinc-200 dark:border-zinc-900 ${collapsed ? "p-2 space-y-2" : "p-4 space-y-3"}`}>
        {!collapsed ? (
          <>
            <a 
              id="github-link"
              href="https://github.com/chronicle-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>github.com/chronicle</span>
            </a>
            <a 
              id="docs-link"
              href="/docs/architecture/sprint0_architecture.md" 
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>documentation</span>
            </a>
            <div id="version-display" className="px-3 py-1 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-600 font-mono">
              <span>Sprint 0 Polished</span>
              <span>v0.1.0</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <a 
              href="https://github.com/chronicle-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              title="GitHub"
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="/docs/architecture/sprint0_architecture.md" 
              title="Documentation"
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
            >
              <BookOpen className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Collapse toggle button */}
        {setCollapsed && (
          <button
            id="sidebar-collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md border border-zinc-200 dark:border-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
}
