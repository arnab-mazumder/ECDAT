"use client";

import React from "react";
import { AlertTriangle, Radiation } from "lucide-react";

export default function Badge({ score, severity, className = "" }) {
  const isCritical = severity.toLowerCase() === "critical";

  if (isCritical) {
    return (
      <span className={`risk-badge risk-badge-critical ${className}`}>
        <span className="badge-icon-critical">
          <Radiation className="w-3.5 h-3.5" />
        </span>
        <span className="badge-text">{score} Critical</span>
      </span>
    );
  }

  return (
    <span className={`risk-badge risk-badge-high ${className}`}>
      <AlertTriangle className="w-3.5 h-3.5 badge-icon-high" />
      <span className="badge-text">{score} High</span>
    </span>
  );
}
