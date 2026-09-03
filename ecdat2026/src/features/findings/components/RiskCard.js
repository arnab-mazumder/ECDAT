"use client";

import React from "react";

export default function RiskCard({ overallRisk, riskLevel }) {
  return (
    <div className="risk-card">
      <h3 className="card-title">OVERALL RISK</h3>

      <div className="risk-score">
        <span className="risk-number">{overallRisk}</span>
        <span className="risk-total">/100</span>
      </div>

      <div className="risk-level">
        <span className="risk-dot"></span>
        <span>{riskLevel.toUpperCase()} EXPOSURE</span>
      </div>
    </div>
  );
}