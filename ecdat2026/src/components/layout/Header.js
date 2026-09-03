"use client";

import React from "react";
import Button from "../ui/Button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="dashboard-header">
      <div className="header-titles">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Overview of your cryptographic inventory and quantum readiness.
        </p>
      </div>

      <Link href="/scan">
        <Button variant="primary" className="new-scan-btn">
          <Plus className="w-4 h-4" />
          <span>New Scan</span>
        </Button>
      </Link>
    </header>
  );
}
