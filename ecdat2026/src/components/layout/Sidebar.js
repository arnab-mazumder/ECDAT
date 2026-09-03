"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutGrid,
  PlusCircle,
  ShieldAlert,
  Code2,
  Sliders,
  FileText,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "New Scan", href: "/scan", icon: PlusCircle },
    { label: "Findings", href: "/findings", icon: ShieldAlert },
    { label: "Code Workspace", href: "/workspace", icon: Code2 },
    { label: "Validation", href: "/validation", icon: Sliders },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <Link href="/dashboard" className="brand-logo-link">
          <img
            src="/ecdat-logo.png"
            alt="ECDAT Enterprise Security"
            className="brand-logo-img"
          />
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
