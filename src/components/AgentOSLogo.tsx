interface AgentOSLogoProps {
  className?: string;
}

/**
 * AgentOS mark - a warm clay "hub-and-spokes" glyph: one central agent
 * orchestrating actions out to multiple connected apps.
 */
export default function AgentOSLogo({ className = "w-8 h-8" }: AgentOSLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      id="agentos-logo-svg"
    >
      {/* Spokes to connected apps */}
      <line x1="50" y1="50" x2="50" y2="16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="80" y2="34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="80" y2="66" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="50" y2="84" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="20" y2="66" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
      <line x1="50" y1="50" x2="20" y2="34" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.55" />

      {/* Connected app nodes */}
      <circle cx="50" cy="16" r="6" fill="currentColor" />
      <circle cx="80" cy="34" r="6" fill="currentColor" />
      <circle cx="80" cy="66" r="6" fill="currentColor" />
      <circle cx="50" cy="84" r="6" fill="currentColor" />
      <circle cx="20" cy="66" r="6" fill="currentColor" />
      <circle cx="20" cy="34" r="6" fill="currentColor" />

      {/* Central agent core */}
      <circle cx="50" cy="50" r="11" fill="currentColor" />
      <circle cx="50" cy="50" r="4" fill="var(--color-cream-100, #faf9f5)" />
    </svg>
  );
}
