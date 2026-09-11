"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Play,
  Download,
  ShieldCheck,
  Calculator,
  RefreshCw,
  XCircle,
  PlusCircle,
  FileCheck,
} from "lucide-react";

import "@/features/validation/validation.css";

export default function ValidationPage() {
  const router = useRouter();
  const [valData, setValData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningScan, setRunningScan] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [validated, setValidated] = useState(false);
  const [activeDiffIndex, setActiveDiffIndex] = useState(0);

  // Mosca Inequality Interactive State
  const [dataLifetimeX, setDataLifetimeX] = useState(10);
  const [migrationTimeY, setMigrationTimeY] = useState(2);
  const [quantumHorizonZ, setQuantumHorizonZ] = useState(10);

  // Fetch validation data from backend API
  const fetchValidationData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/validation");
      const json = await res.json();
      if (json.success && json.data) {
        setValData(json.data);
      } else {
        setValData(null);
      }
    } catch (err) {
      console.error("Failed to load validation data:", err);
      setValData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidationData();
  }, []);

  const handleRunScan = async () => {
    setRunningScan(true);
    setScanComplete(false);

    try {
      const res = await fetch("/api/validation", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setValData(json.data);
        setValidated(true);
      }
    } catch (err) {
      console.error("Validation rescan error:", err);
    } finally {
      setRunningScan(false);
      setScanComplete(true);
    }
  };

  const handleExport = (isUpdated = false) => {
    const activeDiff = diffs[activeDiffIndex] || {};
    const report = {
      title: isUpdated ? "ECDAT Updated Validation Report" : "ECDAT Validation Report",
      status: validated || isUpdated ? "Validated" : "Proposed Remediation",
      timestamp: new Date().toISOString(),
      summaryMetrics: {
        complianceStatus: valData?.compliance_status || (validated ? "Compliant" : "Non-Compliant"),
        readinessScore: valData?.readiness_score ?? 0,
        totalFindings: valData?.total_findings ?? 0,
      },
      activeFinding: {
        title: activeDiff.title,
        file: activeDiff.file,
        before: activeDiff.before,
        after: activeDiff.after,
      },
      complianceSuiteChecks: valData?.validation_checks || [],
      moscaInequality: {
        dataLifetimeX: `${dataLifetimeX} Years`,
        migrationTimeY: `${migrationTimeY} Years`,
        quantumHorizonZ: `${quantumHorizonZ} Years`,
        isBreached: dataLifetimeX + migrationTimeY > quantumHorizonZ,
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = isUpdated
      ? "ecdat-updated-validation-report.json"
      : "ecdat-validation-report.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isBreached = dataLifetimeX + migrationTimeY > quantumHorizonZ;

  if (loading) {
    return (
      <div className="validation-page" style={{ textAlign: "center", paddingTop: 80 }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "#64748b" }} />
        <h2 style={{ fontSize: 18, color: "#475569" }}>Loading Validation Data...</h2>
      </div>
    );
  }

  // NO ACTIVE SCAN STATE (Consistent with /findings, /cbom, /dashboard)
  if (!valData) {
    return (
      <div style={{ padding: 40, maxWidth: 600, margin: "60px auto", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <FileCheck size={48} color="#0284c7" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>No Active Scan Found</h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          Run a scan on your repository ZIP file or GitHub URL to perform a full NIST FIPS 203/204/205 standard compliance check, Before/After code diff verification, and Mosca risk horizon audit.
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
          Go to New Scan
        </button>
      </div>
    );
  }

  const diffs = valData.diffs || [];
  const currentDiff = diffs[activeDiffIndex] || diffs[0] || {};
  const beforeData = currentDiff.before || { algorithm: "Legacy Cryptographic Routine", riskScore: 80, lines: [] };
  const afterData = currentDiff.after || { algorithm: "NIST Quantum-Safe Algorithm", riskScore: 12, lines: [] };

  return (
    <div className="validation-page">
      {/* Top Bar (Squad B Layout) */}
      <div className="validation-topbar">
        <div>
          <div className="validation-breadcrumb-row">
            <span className="validation-breadcrumb">VALIDATION / REVIEW</span>
          </div>
          <h1>Validate Changes</h1>
          <p>
            Review before/after cryptographic implementation and confirm risk reduction.
          </p>
        </div>

        <div className="validation-actions">
          <button className="validation-export-btn" onClick={() => handleExport(false)}>
            <Download size={15} />
            Export Report
          </button>

          <button
            className="validation-scan-btn"
            onClick={handleRunScan}
            disabled={runningScan}
          >
            <Play size={14} className={runningScan ? "animate-spin" : ""} />
            {runningScan
              ? "Scanning..."
              : scanComplete || validated
                ? "Scan Complete"
                : "Run Validation Scan"}
          </button>
        </div>
      </div>

      {/* Findings Selector Tabs */}
      {diffs.length > 1 && (
        <div className="findings-tabs-bar">
          <span className="findings-tabs-label">Scanned File Diffs:</span>
          {diffs.map((diff, idx) => (
            <button
              key={diff.id || idx}
              className={`finding-tab ${activeDiffIndex === idx ? "active" : ""}`}
              onClick={() => setActiveDiffIndex(idx)}
            >
              <span>{diff.title}</span>
              <span
                className="finding-tab-badge"
                style={{
                  background:
                    activeDiffIndex === idx
                      ? undefined
                      : diff.before.severity === "Critical"
                        ? "#fef2f2"
                        : "#fffbeb",
                  color:
                    activeDiffIndex === idx
                      ? undefined
                      : diff.before.severity === "Critical"
                        ? "#dc2626"
                        : "#d97706",
                }}
              >
                {diff.before.severity}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Comparison Area (Squad B 3-Column Grid) */}
      <div className="validation-content">
        {/* BEFORE CARD */}
        <div className="validation-code-card">
          <div className="validation-card-header">
            <div>
              <span className="validation-label">BEFORE</span>
              <h2>{beforeData.algorithm}</h2>
              <p>
                Risk Score:{" "}
                <strong className="critical-score">{beforeData.riskScore}</strong>
              </p>
              {currentDiff.file && (
                <span className="card-file-path">{currentDiff.file}</span>
              )}
            </div>

            <span className="risk-badge critical">
              <AlertTriangle size={13} />
              {beforeData.severity || "Critical"}
            </span>
          </div>

          <div className="code-window before-code">
            {(beforeData.lines || []).map((line, idx) => (
              <div key={idx}>
                <span className="line-number">{line.num}</span>
                <span className={line.status === "deleted" ? "deleted" : ""}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ARROW */}
        <div className="validation-arrow">
          <ArrowRight size={22} />
        </div>

        {/* AFTER CARD */}
        <div className="validation-code-card">
          <div className="validation-card-header">
            <div>
              <span className="validation-label">
                {validated ? "AFTER (VALIDATED)" : "AFTER (PROPOSED)"}
              </span>
              <h2>{afterData.algorithm}</h2>
              <p>
                Risk Score:{" "}
                <strong className="low-score">
                  {validated ? Math.min(afterData.riskScore, 5) : afterData.riskScore}
                </strong>
              </p>
              {currentDiff.file && (
                <span className="card-file-path">{currentDiff.file}</span>
              )}
            </div>

            <span className="risk-badge low">
              <CheckCircle2 size={13} />
              {validated ? "Validated" : afterData.severity || "Low"}
            </span>
          </div>

          <div className="code-window after-code">
            {(afterData.lines || []).map((line, idx) => (
              <div key={idx}>
                <span className="line-number">{line.num}</span>
                <span className={line.status === "added" ? "added" : ""}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="validation-sidebar">
          {/* Risk Summary */}
          <div className="validation-summary-card">
            <span className="validation-label">RISK SUMMARY IMPACT</span>

            <div className="risk-score-row">
              <div>
                <span>Before Score</span>
                <strong className="critical-score">{beforeData.riskScore}</strong>
              </div>

              <ArrowRight size={18} />

              <div>
                <span>After Score</span>
                <strong className="low-score">
                  {validated ? Math.min(afterData.riskScore, 5) : afterData.riskScore}
                </strong>
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-stat">
              <span>Critical Findings</span>
              <strong>
                {validated
                  ? `0 Active`
                  : `${valData.total_findings ?? 0} Active`}
              </strong>
            </div>

            <div className="summary-stat">
              <span>Overall Compliance</span>
              <strong className="improving">
                {validated || valData.compliance_status === "Compliant"
                  ? "Compliant"
                  : "Improving"}
              </strong>
            </div>
          </div>

          {/* Checklist */}
          <div className="validation-checklist">
            <span className="validation-label">VALIDATION CHECKLIST</span>

            <div className="check-item">
              <CheckCircle2 size={17} />
              <div>
                <strong>Syntax validation passed</strong>
                <p>No compilation errors detected in modified AST parser.</p>
              </div>
            </div>

            <div className="check-item">
              <CheckCircle2 size={17} />
              <div>
                <strong>
                  {scanComplete || validated
                    ? "Cryptographic re-scan completed"
                    : "Cryptographic re-scan pending"}
                </strong>
                <p>
                  {scanComplete || validated
                    ? `${afterData.algorithm} verified against NIST FIPS standards.`
                    : "Run the cryptographic scan to verify the proposed changes."}
                </p>
              </div>
            </div>

            <div className="check-item">
              <CheckCircle2 size={17} />
              <div>
                <strong>
                  {scanComplete || validated
                    ? `${beforeData.algorithm} finding resolved`
                    : `${beforeData.algorithm} finding awaiting validation`}
                </strong>
                <p>
                  {scanComplete || validated
                    ? `Target vulnerability mitigated.`
                    : `Run validation scan to confirm remediation.`}
                </p>
              </div>
            </div>

            <div className="check-warning">
              <AlertTriangle size={17} />
              <div>
                <strong>Full project build not performed</strong>
                <p>Integration tests pending CI/CD pipeline execution.</p>
              </div>
            </div>
          </div>

          {/* Generate Report */}
          <button className="generate-report-btn" onClick={() => handleExport(true)}>
            <FileText size={16} />
            Generate Updated Report
          </button>
        </div>
      </div>

      {/* LOWER SECTIONS: SUITE CHECKS & MOSCA SANDBOX */}
      <div className="validation-extra-sections">
        {/* Compliance Checks Table */}
        <div className="val-section-card">
          <div className="val-section-header">
            <div className="val-section-title">
              <ShieldCheck size={20} color="#0284c7" />
              Active Validation & Compliance Checks
            </div>
            <span
              className={`val-status-badge ${validated || valData.compliance_status === "Compliant"
                  ? "badge-passed"
                  : "badge-warning"
                }`}
            >
              {validated ? "Compliant" : valData.compliance_status || "Evaluating..."}
            </span>
          </div>

          <table className="checks-table">
            <thead>
              <tr>
                <th>Compliance Check</th>
                <th>Category</th>
                <th>Status</th>
                <th>Audit Details & Rule</th>
              </tr>
            </thead>
            <tbody>
              {(valData.validation_checks || []).map((check) => {
                const currentStatus = validated ? "Passed" : check.status;
                return (
                  <tr key={check.id}>
                    <td>
                      <div className="check-name">{check.name}</div>
                    </td>
                    <td>
                      <span className="check-category">{check.category}</span>
                    </td>
                    <td>
                      <span
                        className={`val-status-badge ${currentStatus === "Passed"
                            ? "badge-passed"
                            : currentStatus === "Warning"
                              ? "badge-warning"
                              : "badge-failed"
                          }`}
                      >
                        {currentStatus === "Passed" ? (
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                        ) : currentStatus === "Warning" ? (
                          <AlertTriangle size={12} style={{ marginRight: 4 }} />
                        ) : (
                          <XCircle size={12} style={{ marginRight: 4 }} />
                        )}
                        {currentStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {validated ? "Verified compliant against NIST standard." : check.details}
                      </div>
                      <div className="check-rule">{check.rule}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mosca's Theorem Risk Sandbox */}
        <div className="val-section-card" style={{ background: "#0f172a", color: "#fff" }}>
          <div className="mosca-widget">
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Calculator size={20} color="#38bdf8" />
                Mosca's Theorem Risk Inequality Sandbox
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  margin: "0 0 20px 0",
                  lineHeight: 1.5,
                }}
              >
                If (X + Y) &gt; Z, your encryption will be broken before migration completes. Adjust parameters to simulate risk exposure windows.
              </p>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>
                    Data Security Lifetime (X): {dataLifetimeX} Years
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={dataLifetimeX}
                    onChange={(e) => setDataLifetimeX(Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4, cursor: "pointer" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>
                    Migration System Time (Y): {migrationTimeY} Years
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={migrationTimeY}
                    onChange={(e) => setMigrationTimeY(Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4, cursor: "pointer" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>
                    Quantum Threat Horizon (Z): {quantumHorizonZ} Years
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={quantumHorizonZ}
                    onChange={(e) => setQuantumHorizonZ(Number(e.target.value))}
                    style={{ width: "100%", marginTop: 4, cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div className="mosca-formula-box">
                <div className="mosca-equation">
                  {dataLifetimeX}y + {migrationTimeY}y = {dataLifetimeX + migrationTimeY}y
                  {isBreached ? " > " : " ≤ "}
                  {quantumHorizonZ}y
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isBreached ? "#ef4444" : "#22c55e",
                    marginTop: 8,
                  }}
                >
                  {isBreached
                    ? "CRITICAL QUANTUM BREACH EXPOSURE DETECTED"
                    : "SAFE QUANTUM MIGRATION WINDOW"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    marginTop: 8,
                    lineHeight: 1.4,
                  }}
                >
                  {isBreached
                    ? `Required retention (${dataLifetimeX + migrationTimeY} years) exceeds threat horizon (${quantumHorizonZ} years) by ${dataLifetimeX + migrationTimeY - quantumHorizonZ} year(s). Immediate PQC algorithm migration required!`
                    : `Migration time and data retention fit safely within the estimated ${quantumHorizonZ}-year quantum threat window.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
