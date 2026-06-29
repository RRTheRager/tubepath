import {
  GitBranch,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  PlaySquare,
  Settings,
  Sparkles,
  TrendingUp,
  Wand2,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Requires full (paid) access; shown with a lock during trial. */
  premium?: boolean;
}

export const NAV: NavItem[] = [
  { id: "feed", label: "Insights", href: "/app/feed", icon: Sparkles },
  { id: "dashboard", label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", href: "/app/pipeline", icon: GitBranch, premium: true },
  { id: "analytics", label: "Analytics", href: "/app/analytics", icon: LineChart, premium: true },
  { id: "growth", label: "Growth", href: "/app/growth", icon: TrendingUp, premium: true },
  { id: "videos", label: "Videos", href: "/app/videos", icon: PlaySquare },
  { id: "thumbnails", label: "Thumbnails", href: "/app/thumbnails", icon: ImageIcon },
  { id: "suggestions", label: "AI Studio", href: "/app/suggestions", icon: Wand2, premium: true },
  { id: "chat", label: "AI Coach", href: "/app/chat", icon: MessageCircle, premium: true },
  { id: "settings", label: "Settings", href: "/app/settings", icon: Settings },
];
