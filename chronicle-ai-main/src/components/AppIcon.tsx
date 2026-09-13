import {
  Slack,
  MessageSquare,
  Users,
  Mail,
  FileText,
  BookOpen,
  Table,
  Github,
  GitBranch,
  CircleDot,
  Trello,
  CheckSquare,
  Contact,
  Cloud,
  Calendar,
  CalendarClock,
  HardDrive,
  Package,
  CreditCard,
  LifeBuoy,
  Plug,
} from "lucide-react";

const ICONS: Record<string, typeof Slack> = {
  Slack,
  MessageSquare,
  Users,
  Mail,
  FileText,
  BookOpen,
  Table,
  Github,
  GitBranch,
  CircleDot,
  Trello,
  CheckSquare,
  Contact,
  Cloud,
  Calendar,
  CalendarClock,
  HardDrive,
  Package,
  CreditCard,
  LifeBuoy,
};

interface AppIconProps {
  icon: string;
  color: string;
  /** tailwind size classes for the tile, e.g. "w-9 h-9" */
  size?: string;
  /** icon size classes, e.g. "w-4 h-4" */
  iconSize?: string;
  className?: string;
}

/** Renders an app's logo as a tinted rounded tile using its brand color. */
export default function AppIcon({ icon, color, size = "w-9 h-9", iconSize = "w-4 h-4", className = "" }: AppIconProps) {
  const Cmp = ICONS[icon] || Plug;
  return (
    <div
      className={`${size} rounded-xl flex items-center justify-center shrink-0 border ${className}`}
      style={{
        backgroundColor: `${color}1A`, // ~10% alpha tint
        borderColor: `${color}33`,
        color,
      }}
    >
      <Cmp className={iconSize} />
    </div>
  );
}
