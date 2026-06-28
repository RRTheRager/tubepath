import {
  LayoutDashboard,
  MessageCircle,
  PlaySquare,
  Settings,
  Sparkles,
  Wand2,
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
  { id: "feed", label: "For You", href: "/app/feed", icon: Sparkles },
  { id: "dashboard", label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { id: "videos", label: "Videos", href: "/app/videos", icon: PlaySquare },
  { id: "suggestions", label: "AI Studio", href: "/app/suggestions", icon: Wand2, premium: true },
  { id: "chat", label: "AI Coach", href: "/app/chat", icon: MessageCircle, premium: true },
  { id: "settings", label: "Settings", href: "/app/settings", icon: Settings },
];
