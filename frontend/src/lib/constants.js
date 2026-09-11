export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", active: true },
  { label: "New Scan", href: "/scan", icon: "PlusCircle", active: false },
  { label: "Findings", href: "/findings", icon: "ShieldAlert", active: false },
  { label: "Code Workspace", href: "/workspace", icon: "Code2", active: false },
  { label: "Validation", href: "/validation", icon: "Sliders", active: false },
  { label: "Reports", href: "/reports", icon: "FileText", active: false },
];

export const SEVERITY_COLORS = {
  critical: {
    bg: "#b91c1c",
    text: "#dc2626",
    badgeBg: "#fef2f2",
    badgeBorder: "#fecaca",
    badgeText: "#991b1b",
  },
  high: {
    bg: "#8c4a4a",
    text: "#4b5563",
    badgeBg: "#ffffff",
    badgeBorder: "#d1d5db",
    badgeText: "#374151",
  },
  medium: {
    bg: "#787f7b",
    text: "#6b7280",
    badgeBg: "#f3f4f6",
    badgeBorder: "#e5e7eb",
    badgeText: "#4b5563",
  },
  low: {
    bg: "#424945",
    text: "#9ca3af",
    badgeBg: "#f9fafb",
    badgeBorder: "#f3f4f6",
    badgeText: "#6b7280",
  },
};
