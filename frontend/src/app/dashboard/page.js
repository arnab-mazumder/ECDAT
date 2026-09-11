"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, PlusCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import RiskCard from "@/features/dashboard/components/RiskCard";
import RiskDistribution from "@/features/dashboard/components/RiskDistribution";
import PriorityFindings from "@/features/dashboard/components/PriorityFindings";
import "@/features/dashboard/dashboard.css";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading dashboard metrics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <Header />
        <div style={{ padding: 40, maxWidth: 600, margin: "40px auto", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <LayoutGrid size={48} color="#0284c7" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>No Active Scan Dashboard</h2>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
            Upload a repository ZIP file on the <strong>New Scan</strong> page to see real-time quantum readiness scores, cryptographic asset risk distributions, and prioritized vulnerability findings.
          </p>
          <button
            onClick={() => router.push("/scan")}
            style={{
              marginTop: 24,
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <PlusCircle size={16} />
            Start New Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Header />

      {/* Row 1: Stat Cards */}
      <RiskCard stats={data.stats} />

      {/* Row 2: Risk Distribution & Latest Scan */}
      <RiskDistribution
        distribution={data.riskDistribution}
        latestScan={data.latestScan}
      />

      {/* Row 3: Highest Priority Findings Table */}
      <PriorityFindings findings={data.priorityFindings} />
    </div>
  );
}
