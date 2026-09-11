"use client";

import React, { useState } from "react";
import { GitPullRequest, X, AlertTriangle, ShieldCheck, CheckCircle2, Code } from "lucide-react";

export default function RemediationModal({
  selectedFindings = [],
  activeScan = null,
  onClose,
  onStarted,
}) {
  const [grouping, setGrouping] = useState("per_file");
  const [githubToken, setGithubToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  const repoUrl = activeScan?.repo_url || activeScan?.target || "";
  const targetPath = activeScan?.target_path || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findings: selectedFindings,
          repo_url: repoUrl,
          target_path: targetPath,
          grouping: grouping,
          github_token: githubToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.job_id) {
        throw new Error(data.error || data.detail || "Failed to start remediation job");
      }

      onStarted(data.job_id);
    } catch (err) {
      console.error("Remediation submit error:", err);
      setError(err.message || "Failed to launch remediation PR creation.");
      setLoading(false);
    }
  };

  return (
    <div className="remediation-modal-overlay" onClick={onClose}>
      <div
        className="remediation-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="remediation-modal-header">
          <div className="modal-title-group">
            <GitPullRequest size={22} className="modal-icon" />
            <div>
              <h3>Automated PQC Pull Request Creation</h3>
              <p>Migrate selected findings to NIST FIPS 203/204/205 Standards</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="remediation-modal-body">
          {error && (
            <div className="modal-error-banner">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* TARGET REPO SUMMARY */}
          <div className="modal-section">
            <label className="section-label">TARGET REPOSITORY</label>
            <div className="repo-info-box">
              <Code size={16} color="#0284c7" />
              <span className="repo-path">
                {repoUrl || targetPath || "Active Local Workspace"}
              </span>
            </div>
          </div>

          {/* SELECTED FINDINGS TABLE */}
          <div className="modal-section">
            <div className="section-header-flex">
              <label className="section-label">
                SELECTED FINDINGS ({selectedFindings.length})
              </label>
              <button
                type="button"
                className="toggle-diff-btn"
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? "Hide Fix Code" : "Preview Fix Code"}
              </button>
            </div>

            <div className="modal-findings-list">
              {selectedFindings.map((f) => (
                <div key={f.id} className="modal-finding-item">
                  <div className="item-header">
                    <span className={`severity-tag severity-${(f.severity || "medium").toLowerCase()}`}>
                      {f.severity}
                    </span>
                    <span className="item-algo">{f.algorithm}</span>
                    <span className="item-file">{f.file}:{f.line || 1}</span>
                    <span className="item-arrow">→</span>
                    <span className="item-fix">
                      <ShieldCheck size={13} style={{ display: "inline", marginRight: 3, color: "#059669" }} />
                      {f.recommendation?.algorithm || "NIST PQC Standard"}
                    </span>
                  </div>

                  {showDiff && (f.original_snippet || f.replacement_code) && (
                    <div className="modal-diff-preview">
                      {f.original_snippet && (
                        <div className="diff-block diff-removed">
                          <div className="diff-label">- Original</div>
                          <pre><code>{f.original_snippet}</code></pre>
                        </div>
                      )}
                      {f.replacement_code && (
                        <div className="diff-block diff-added">
                          <div className="diff-label">+ Quantum-Safe Replacement</div>
                          <pre><code>{f.replacement_code}</code></pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* GROUPING STRATEGY */}
          <div className="modal-section">
            <label className="section-label">PULL REQUEST STRATEGY</label>
            <div className="grouping-options">
              <label className={`radio-card ${grouping === "per_file" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="grouping"
                  value="per_file"
                  checked={grouping === "per_file"}
                  onChange={() => setGrouping("per_file")}
                />
                <div>
                  <strong>One PR Per Target File (Recommended)</strong>
                  <p>Creates isolated PRs per modified file for modular code review and testing.</p>
                </div>
              </label>

              <label className={`radio-card ${grouping === "per_repo" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="grouping"
                  value="per_repo"
                  checked={grouping === "per_repo"}
                  onChange={() => setGrouping("per_repo")}
                />
                <div>
                  <strong>One Combined PR for All Selected Findings</strong>
                  <p>Bundles all selected cryptographic replacements into a single atomic Pull Request.</p>
                </div>
              </label>
            </div>
          </div>

          {/* GITHUB TOKEN */}
          <div className="modal-section">
            <label className="section-label">GITHUB AUTHENTICATION</label>
            <input
              type="password"
              className="github-token-input"
              placeholder="ghp_... (GitHub Personal Access Token)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <p className="field-hint">
              <strong>Demo Mode Notice:</strong> If no token is provided, ECDAT will run in simulated mode and return a demonstration PR URL.
            </p>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="remediation-modal-footer">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="modal-submit-btn"
              disabled={loading || selectedFindings.length === 0}
            >
              {loading ? (
                <>Launching PR Creation...</>
              ) : (
                <>
                  <GitPullRequest size={15} />
                  Open Pull Request ({selectedFindings.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
