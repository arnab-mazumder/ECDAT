"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleStop,
  Check,
  Search,
  RotateCw,
  Terminal as TerminalIcon,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

const PIPELINE_STEPS = [
  { id: "upload", title: "Repository uploaded & extracted" },
  { id: "discovery", title: "Files & directories discovered" },
  { id: "ast", title: "Python AST analysis" },
  { id: "java", title: "Java signature analysis" },
  { id: "cert", title: "X.509 certificate parsing" },
  { id: "mosca", title: "Mosca risk scoring" },
  { id: "pqc", title: "NIST FIPS PQC recommendations" },
];

// Module-level guard — persists across React 18 Strict Mode unmount/remount
// cycles so the scan only fires exactly once per page visit.
let _scanFired = false;

export default function LiveScanMonitor({
  repoName = "repository",
  targetFile = null,
  githubUrl = "",
  onCancel,
}) {
  const router = useRouter();
  const terminalBottomRef = useRef(null);

  const [progress, setProgress] = useState(5);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scanResult, setScanResult] = useState(null);

  const addLog = (type, tag, text, highlight = false) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, time, tag, text, highlight }]);
  };

  const addSeparator = (text) => {
    setLogs((prev) => [...prev, { type: "separator", text }]);
  };

  useEffect(() => {
    if (_scanFired) return;
    _scanFired = true;
    let cancelled = false;

    async function runScan() {
      try {
        addLog("info", "INFO", `Initializing ECDAT Squad A Engine...`);
        addLog("info", "INFO", `Target: ${targetFile ? targetFile.name : githubUrl}`);
        setProgress(10);
        setCurrentStepIndex(0);

        addLog("info", "INFO", "Phase 1: Uploading and extracting repository...");
        setProgress(20);
        setCurrentStepIndex(1);

        // ── Perform the actual upload/scan ──────────────────────────────────
        let res;
        if (targetFile) {
          const formData = new FormData();
          formData.append("file", targetFile);
          res = await fetch("/api/scan", {
            method: "POST",
            body: formData,
          });
        } else if (githubUrl) {
          res = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ githubUrl }),
          });
        } else {
          throw new Error("No file or GitHub URL provided");
        }

        if (cancelled) return;

        setProgress(50);
        setCurrentStepIndex(2);
        addSeparator("─── Cryptographic Detection Engine Running ───");
        addLog("scan", "SCAN", "Executing Python AST parser on source files...");

        const json = await res.json();

        if (cancelled) return;

        if (!json.success) {
          throw new Error(json.error || "Scan failed");
        }

        const { findings = [], readiness_score = 0, fileContents = {} } = json.data;
        setScanResult(json.data);

        setProgress(75);
        setCurrentStepIndex(4);
        addLog("info", "INFO", `Discovered ${Object.keys(fileContents).length} source file(s).`);
        addSeparator("─── Scan Results ───");

        if (findings.length === 0) {
          addLog(
            "success",
            "SUCCESS",
            "No cryptographic vulnerabilities detected. Repository is quantum-ready!"
          );
        } else {
          for (const f of findings) {
            addLog(
              "warn",
              "WARN",
              `[${f.risk_bucket}] ${f.algorithm}${f.key_size ? `-${f.key_size}` : ""} in ${f.file}:${f.line || "?"}  →  ${f.recommendation}`,
              f.risk_bucket === "Critical" || f.risk_bucket === "High"
            );
          }
        }

        setProgress(90);
        setCurrentStepIndex(6);
        addLog(
          "calc",
          "CALC",
          `Mosca inequality evaluated. Quantum Readiness Score: ${readiness_score}/100`
        );

        setProgress(100);
        setCurrentStepIndex(7);
        addLog(
          "success",
          "SUCCESS",
          `Scan complete. ${findings.length} cryptographic finding(s) indexed. Navigate to Findings or Workspace.`
        );
        setIsCompleted(true);
      } catch (err) {
        if (cancelled) return;
        addLog("warn", "ERROR", `Scan failed: ${err.message}`);
        setIsError(true);
        setErrorMessage(err.message);
        setProgress(100);
      }
    }

    runScan();

    return () => {
      cancelled = true;
      // Reset module guard when component unmounts so a fresh
      // navigation back to the scan page can trigger a new scan.
      _scanFired = false;
    };
  }, []);

  // Animate progress bar before backend responds
  useEffect(() => {
    if (isCompleted || isError) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 45) return p; // stop auto-advance; real progress takes over
        return Math.min(p + 5, 45);
      });
    }, 800);
    return () => clearInterval(timer);
  }, [isCompleted, isError]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="live-scan-page">
      {/* Header Bar */}
      <div className="live-scan-header">
        <div className="live-scan-title-group">
          <button className="btn-back-arrow" onClick={onCancel} title="Return to Scan Setup">
            <ArrowLeft size={18} />
          </button>
          <h1 className="live-scan-title">Analyzing {repoName}</h1>
        </div>

        <div className="live-scan-header-actions">
          {isError ? (
            <button className="btn-cancel-scan" onClick={onCancel}>
              <ArrowLeft size={15} /> Try Again
            </button>
          ) : isCompleted ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-view-findings-primary"
                style={{ background: "#0f172a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => router.push("/findings")}
              >
                <span>View Findings</span>
                <ArrowRight size={15} />
              </button>
              <button
                style={{ background: "#1e293b", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}
                onClick={() => router.push("/workspace")}
              >
                Open Workspace
              </button>
            </div>
          ) : (
            <button className="btn-cancel-scan" onClick={onCancel}>
              <CircleStop size={15} className="btn-cancel-icon" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="live-scan-grid">
        {/* Left: Progress & Pipeline Stepper */}
        <div className="live-scan-left-col">
          {/* Overall Progress Card */}
          <div className="scan-card progress-card">
            <div className="progress-header-row">
              <span className="progress-card-title">Overall Progress</span>
              <span className="progress-card-percent">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-estimate-row">
              <RotateCw size={13} className={`estimate-icon ${!isCompleted && !isError ? "animate-spin" : ""}`} />
              <span>
                {isError
                  ? `Error: ${errorMessage}`
                  : isCompleted
                  ? "Scan Complete"
                  : "Running squad_a Python engine..."}
              </span>
            </div>
          </div>

          {/* Pipeline Stepper */}
          <div className="scan-card pipeline-card">
            <div className="pipeline-header-title">SCAN PIPELINE</div>
            <div className="pipeline-stepper">
              {PIPELINE_STEPS.map((step, idx) => {
                const done = idx < currentStepIndex || isCompleted;
                const active = idx === currentStepIndex && !isCompleted && !isError;

                return (
                  <div key={step.id} className="stepper-item">
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`stepper-line ${done ? "line-completed" : ""}`} />
                    )}
                    <div className={`stepper-dot ${done ? "dot-completed" : active ? "dot-current" : "dot-pending"}`}>
                      {done ? <Check size={12} strokeWidth={3} /> : active ? <Search size={11} strokeWidth={2.5} /> : null}
                    </div>
                    <div className="stepper-content">
                      <div className={`stepper-title ${done ? "title-completed" : active ? "title-current" : "title-pending"}`}>
                        {step.title}
                      </div>
                      {active && <div className="stepper-in-progress">Running...</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Terminal Output */}
        <div className="live-scan-right-col">
          <div className="scan-terminal-window">
            <div className="terminal-window-header">
              <div className="terminal-header-title">
                <TerminalIcon size={14} className="terminal-icon" />
                <span>LIVE SCAN OUTPUT</span>
              </div>
              <div className="terminal-window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-gray" />
                <span className="dot dot-gray" />
              </div>
            </div>

            <div className="terminal-body-console">
              {logs.map((log, i) => {
                if (log.type === "separator") {
                  return <div key={i} className="terminal-line separator-line">{log.text}</div>;
                }
                return (
                  <div key={i} className="terminal-line">
                    <span className="log-time">[{log.time}]</span>{" "}
                    <span className={`log-tag log-tag-${log.type}`}>{log.tag}</span>{" "}
                    <span className={log.highlight ? "log-text-highlight" : "log-text"}>
                      {log.text}
                    </span>
                  </div>
                );
              })}

              {!isCompleted && !isError && (
                <div className="terminal-cursor-line">
                  <span className="blinking-cursor">█</span>
                </div>
              )}

              <div ref={terminalBottomRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
