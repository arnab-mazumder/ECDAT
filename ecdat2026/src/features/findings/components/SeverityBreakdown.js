"use client";

import React from "react";

export default function SeverityBreakdown({ severity }) {
  return (
    <div className="severity-card">
      <h3 className="card-title">SEVERITY BREAKDOWN</h3>

      <div className="severity-grid">
        <div className="severity-box critical">
          <strong>{severity.critical}</strong>
          <span>Critical</span>
        </div>

        <div className="severity-box high">
          <strong>{severity.high}</strong>
          <span>High</span>
        </div>

        <div className="severity-box medium">
          <strong>{severity.medium}</strong>
          <span>Medium</span>
        </div>

        <div className="severity-box low">
          <strong>{severity.low}</strong>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}