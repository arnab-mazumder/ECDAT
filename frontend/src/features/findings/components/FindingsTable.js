"use client";

import React from "react";
import { GitPullRequest, ExternalLink, Loader2, AlertCircle, Wrench, Zap } from "lucide-react";

export default function FindingsTable({
  findings = [],
  selectedFindingIds = [],
  onSelectionChange = () => {},
  onFixSelected = () => {},
  onFixAllCritical = () => {},
  remediationMap = {},
}) {
  if (!findings || findings.length === 0) {
    return (
      <div className="findings-table-card" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        <h3>No Cryptographic Findings Found</h3>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          Either no scan has been executed yet, or the scanned repository adheres to quantum-safe cryptographic standards.
        </p>
      </div>
    );
  }

  const selectedSet = new Set(selectedFindingIds);
  const allIds = findings.map((f) => f.id);
  const isAllSelected = findings.length > 0 && findings.every((f) => selectedSet.has(f.id));
  const isSomeSelected = findings.some((f) => selectedSet.has(f.id)) && !isAllSelected;

  const criticalCount = findings.filter(
    (f) => (f.severity || "").toLowerCase() === "critical"
  ).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(Array.from(next));
  };

  const getPRStatusBadge = (findingId) => {
    const item = remediationMap[findingId];
    if (!item) {
      return <span className="pr-status-badge status-none">Not Fixed</span>;
    }

    if (item.status === "done" && item.pr_url) {
      return (
        <a
          href={item.pr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="pr-status-badge status-open"
          title={`Branch: ${item.branch || "ecdat/pqc-fix"}`}
        >
          <GitPullRequest size={12} />
          PR Open
          <ExternalLink size={10} style={{ marginLeft: 3 }} />
        </a>
      );
    }

    if (item.status === "failed") {
      return (
        <span className="pr-status-badge status-failed" title={item.error || "Patch failed validation"}>
          <AlertCircle size={12} />
          Fix Failed
        </span>
      );
    }

    // In-progress stages: queued, cloning, patching, validating, pushing
    const stageLabels = {
      queued: "Queued",
      cloning: "Cloning...",
      patching: "Patching...",
      validating: "Validating...",
      pushing: "Pushing PR...",
    };

    return (
      <span className="pr-status-badge status-running">
        <Loader2 size={12} className="spin-icon" />
        {stageLabels[item.status] || "Fixing..."}
      </span>
    );
  };

  return (
    <div className="findings-table-card">
      {/* TABLE TOOLBAR / SELECTION ACTIONS */}
      <div className="table-actions-bar">
        <div className="selection-info">
          <span>{selectedSet.size} of {findings.length} selected</span>
        </div>

        <div className="table-btn-group">
          <button
            className="fix-selected-btn"
            disabled={selectedSet.size === 0}
            onClick={onFixSelected}
          >
            <Wrench size={13} />
            Fix Selected ({selectedSet.size})
          </button>

          <button
            className="fix-critical-btn"
            disabled={criticalCount === 0}
            onClick={onFixAllCritical}
          >
            <Zap size={13} />
            Fix All Critical ({criticalCount})
          </button>
        </div>
      </div>

      <table className="findings-table">
        <thead>
          <tr>
            <th style={{ width: 36, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isSomeSelected;
                }}
                onChange={handleSelectAll}
                className="row-checkbox"
              />
            </th>
            <th>SEVERITY</th>
            <th>ALGORITHM</th>
            <th>LOCATION</th>
            <th>TYPE</th>
            <th>KEY SIZE</th>
            <th>RISK SCORE</th>
            <th>RECOMMENDATION</th>
            <th>PR STATUS</th>
          </tr>
        </thead>

        <tbody>
          {findings.map((finding) => {
            const isSelected = selectedSet.has(finding.id);
            return (
              <tr key={finding.id} className={isSelected ? "row-selected" : ""}>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(finding.id)}
                    className="row-checkbox"
                  />
                </td>

                <td>
                  <span
                    className={`severity-badge severity-${(finding.severity || "medium").toLowerCase()}`}
                  >
                    {finding.severity}
                  </span>
                </td>

                <td className="algorithm-cell">
                  {finding.algorithm}
                </td>

                <td className="location-cell">
                  {finding.file}
                  {finding.line ? `:${finding.line}` : ""}
                </td>

                <td>
                  {finding.artifactType}
                </td>

                <td>
                  {finding.keySize || "-"}
                </td>

                <td
                  className={`risk-score-cell ${
                    finding.riskScore >= 90
                      ? "high-risk-score"
                      : ""
                  }`}
                >
                  {finding.riskScore}
                </td>

                <td className="recommendation-cell">
                  {finding.recommendation?.rationale || finding.recommendation?.algorithm || "-"}
                </td>

                <td className="pr-status-cell">
                  {getPRStatusBadge(finding.id)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="findings-table-footer">
        <span>
          Showing {findings.length} {findings.length === 1 ? "finding" : "findings"}
        </span>
      </div>
    </div>
  );
}