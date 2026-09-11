"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { SlidersHorizontal, AlertTriangle, Info, ShieldAlert, GitPullRequest } from "lucide-react";

export default function RiskCard({ stats }) {
  const cards = [
    {
      title: "TOTAL FINDINGS",
      value: stats.totalFindings,
      icon: SlidersHorizontal,
      iconColor: "text-muted",
      valueColor: "text-dark",
    },
    {
      title: "CRITICAL FINDINGS",
      value: stats.criticalFindings,
      icon: AlertTriangle,
      iconColor: "text-critical-icon",
      valueColor: "text-critical",
    },
    {
      title: "HIGH FINDINGS",
      value: stats.highFindings,
      icon: Info,
      iconColor: "text-muted",
      valueColor: "text-dark",
    },
    {
      title: "QUANTUM RISK",
      customValue: (
        <div className="flex items-baseline gap-1">
          <span className="text-critical text-stat-value">{stats.quantumRisk.score}</span>
          <span className="text-risk-max">
            /{stats.quantumRisk.maxScore} — {stats.quantumRisk.label}
          </span>
        </div>
      ),
      icon: ShieldAlert,
      iconColor: "text-critical-icon",
    },
    {
      title: "PQC REMEDIATION",
      customValue: (
        <div className="flex items-baseline gap-1">
          <span className="text-stat-value" style={{ color: "#059669", fontWeight: 700 }}>
            {stats.remediationReady ?? stats.totalFindings ?? 0}
          </span>
          <span className="text-risk-max" style={{ marginLeft: 4 }}>
            PQC Fixes Ready
          </span>
        </div>
      ),
      icon: GitPullRequest,
      iconColor: "text-muted",
    },
  ];

  return (
    <div className="risk-cards-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{card.title}</span>
              <Icon className={`stat-card-icon ${card.iconColor}`} />
            </div>
            <div className="stat-card-body">
              {card.customValue ? (
                card.customValue
              ) : (
                <span className={`text-stat-value ${card.valueColor}`}>
                  {card.value}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
