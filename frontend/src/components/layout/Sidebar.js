"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutGrid,
  PlusCircle,
  ShieldAlert,
  Code2,
  Sliders,
  FileText,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Automatically close drawer on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "New Scan", href: "/scan", icon: PlusCircle },
    { label: "Findings", href: "/findings", icon: ShieldAlert },
    { label: "Code Workspace", href: "/workspace", icon: Code2 },
    { label: "Validation", href: "/validation", icon: Sliders },
    { label: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <>
      {/* Persistent Top-Left Hamburger Button */}
      <button
        type="button"
        className="hamburger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle navigation menu"
        title={isOpen ? "Close Menu" : "Open Menu"}
      >
        <Menu size={20} />
      </button>

      {/* Dark Backdrop Overlay over Pages */}
      <div
        className={`drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer Overlay */}
      <aside className={`sidebar-drawer ${isOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link
            href="/dashboard"
            className="brand-logo-link"
            onClick={() => setIsOpen(false)}
          >
            <img
              src="/ecdat-logo.png"
              alt="ECDAT Enterprise Security"
              className="brand-logo-img"
            />
          </Link>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (pathname === "/" && item.href === "/dashboard");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
