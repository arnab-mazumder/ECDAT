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
    bg: "#dc2626",
    text: "#dc2626",
    badgeBg: "#fef2f2",
    badgeBorder: "#fecaca",
    badgeText: "#991b1b",
  },
  high: {
    bg: "#ea580c",
    text: "#ea580c",
    badgeBg: "#fff7ed",
    badgeBorder: "#fed7aa",
    badgeText: "#9a3412",
  },
  medium: {
    bg: "#f59e0b",
    text: "#d97706",
    badgeBg: "#fffbeb",
    badgeBorder: "#fde68a",
    badgeText: "#92400e",
  },
  low: {
    bg: "#16a34a",
    text: "#16a34a",
    badgeBg: "#f0fdf4",
    badgeBorder: "#bbf7d0",
    badgeText: "#166534",
  },
};
