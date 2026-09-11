"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  PlusCircle,
  Download,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";

import RiskCard from "@/features/findings/components/RiskCard";
import SeverityBreakdown from "@/features/findings/components/SeverityBreakdown";
import ScanDetails from "@/features/findings/components/ScanDetails";
import FindingsFilters from "@/features/findings/components/FindingsFilters";
import FindingsTable from "@/features/findings/components/FindingsTable";
import RemediationModal from "@/features/findings/components/RemediationModal";

import "@/features/findings/findings.css";

export default function FindingsPage() {
  const router = useRouter();
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const [algorithm, setAlgorithm] = useState("");
  const [riskScore, setRiskScore] = useState("");

  // Remediation State
  const [selectedFindingIds, setSelectedFindingIds] = useState([]);
  const [showRemediationModal, setShowRemediationModal] = useState(false);
  const [remediationJobId, setRemediationJobId] = useState(null);
  const [remediationJobData, setRemediationJobData] = useState(null);
  const [remediationMap, setRemediationMap] = useState({});

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/findings");
      const json = await res.json();
      if (json.success && json.data) {
        setScanData(json.data);
      } else {
        setScanData(null);
      }
    } catch (err) {
      console.error("Failed to fetch findings:", err);
      setScanData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  // Poll remediation status while job is running
  useEffect(() => {
    if (!remediationJobId) return;

    let timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/remediate/status/${remediationJobId}`);
        const json = await res.json();
        const data = json.data || json;
        setRemediationJobData(data);

        // Update finding level remediationMap status
        if (data.results && data.results.length > 0) {
          setRemediationMap((prev) => {
            const next = { ...prev };
            data.results.forEach((r) => {
              next[r.finding_id] = {
                status: r.status === "fixed" ? "done" : r.status,
                pr_url: r.pr_url || data.pr_url,
                branch: r.branch || data.branch,
                error: r.error,
              };
            });
            return next;
          });
        } else if (data.status) {
          // While running, update all target finding_ids
          const fids = data.finding_ids || [];
          setRemediationMap((prev) => {
            const next = { ...prev };
            fids.forEach((id) => {
              if (data.status === "done") {
                next[id] = { status: "done", pr_url: data.pr_url, branch: data.branch };
              } else if (data.status === "failed") {
                next[id] = { status: "failed", error: data.error };
              } else {
                next[id] = { status: data.status };
              }
            });
            return next;
          });
        }

        if (data.status === "done" || data.status === "failed") {
          clearInterval(timer);
        }
      } catch (err) {
        console.error("Failed to poll remediation status:", err);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [remediationJobId]);

  const handleExportCBOM = () => {
    window.open("/api/cbom", "_blank");
  };

  const handleRunScan = () => {
    router.push("/scan");
  };

  const handleFixSelected = () => {
    if (selectedFindingIds.length > 0) {
      setShowRemediationModal(true);
    }
  };

  const handleFixAllCritical = () => {
    const rawFindings = scanData?.findings || [];
    const criticalIds = rawFindings
      .filter((f) => (f.risk_bucket || "Medium").toLowerCase() === "critical")
      .map((f) => f.id);

    if (criticalIds.length > 0) {
      setSelectedFindingIds(criticalIds);
      setShowRemediationModal(true);
    }
  };

  const handleJobStarted = (jobId) => {
    setRemediationJobId(jobId);
    setShowRemediationModal(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading scan findings from engine...
      </div>
    );
  }

  if (!scanData) {
    return (
      <div
        style={{
          padding: 40,
          maxWidth: 600,
          margin: "60px auto",
          textAlign: "center",
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <ShieldAlert size={48} color="#0284c7" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>No Active Scan Found</h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          Upload your repository ZIP file or enter a GitHub repository URL to initiate an automated cryptographic and post-quantum analysis.
        </p>
        <button
          onClick={handleRunScan}
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
    );
  }

  // Raw findings list mapped for UI
  const rawFindings = scanData.findings || [];
  const findingsList = rawFindings.map((f) => ({
    id: f.id,
    algorithm: f.algorithm + (f.key_size ? `-${f.key_size}` : ""),
    severity: f.risk_bucket || "Medium",
    file: f.file,
    line: f.line,
    artifactType: f.artifact_type === "certificate" ? "Certificate" : "Source Code",
    keySize: f.key_size ? `${f.key_size}-bit` : "-",
    riskScore: f.risk_score || 50,
    original_snippet: f.original_snippet,
    replacement_code: f.replacement_code,
    recommendation: {
      algorithm: f.recommendation,
      standard: f.recommendation_standard,
      rationale: f.rationale,
    },
    status: f.resolved ? "Resolved" : "Open",
  }));

  const filteredFindings = findingsList.filter((finding) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      finding.algorithm?.toLowerCase().includes(searchText) ||
      finding.severity?.toLowerCase().includes(searchText) ||
      finding.file?.toLowerCase().includes(searchText) ||
      finding.artifactType?.toLowerCase().includes(searchText) ||
      finding.recommendation?.algorithm?.toLowerCase().includes(searchText);

    const matchesSeverity = severity === "" || finding.severity === severity;
    const matchesType = type === "" || finding.artifactType === type;
    const matchesAlgorithm =
      algorithm === "" || finding.algorithm?.toLowerCase() === algorithm.toLowerCase();

    const matchesRiskScore = (() => {
      if (riskScore === "") return true;
      const [min, max] = riskScore.split("-").map(Number);
      return finding.riskScore >= min && finding.riskScore <= max;
    })();

    return (
      matchesSearch &&
      matchesSeverity &&
      matchesType &&
      matchesAlgorithm &&
      matchesRiskScore
    );
  });

  // Selected findings objects for modal
  const selectedFindingsObjects = findingsList.filter((f) =>
    selectedFindingIds.includes(f.id)
  );

  const readinessScore = scanData.readiness_score ?? 0;
  const totalFindings = findingsList.length;
  const filesCount = Object.keys(scanData.fileContents || {}).length;

  const severityCounts = {
    critical: findingsList.filter((f) => f.severity === "Critical").length,
    high: findingsList.filter((f) => f.severity === "High").length,
    medium: findingsList.filter((f) => f.severity === "Medium").length,
    low: findingsList.filter((f) => f.severity === "Low").length,
  };

  const riskLevel =
    readinessScore >= 80
      ? "Low Risk"
      : readinessScore >= 60
      ? "Medium Risk"
      : "Critical Risk";

  return (
    <div className="findings-page">
      {/* TOP HEADER */}
      <div className="findings-topbar">
        <h1>Omnicipher Findings</h1>

        <div className="header-actions">
          <button className="export-button" onClick={handleExportCBOM}>
            <Download size={14} style={{ display: "inline", marginRight: 6 }} />
            Export CycloneDX 1.6 CBOM
          </button>

          <button className="run-scan-button" onClick={handleRunScan}>
            ▷ New Scan
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="findings-content">
        {/* Scan Results Header */}
        <div className="scan-results-header">
          <h2>Scan Results</h2>
          <p>
            Target:{" "}
            <span className="scan-target">
              {scanData.target || "Uploaded Repository"}
            </span>
            {" • "}Live Engine Scan
          </p>
        </div>

        {/* REMEDIATION LIVE PROGRESS BANNER */}
        {remediationJobData && (
          <div
            className={`remediation-progress-banner ${
              remediationJobData.status === "done"
                ? "banner-done"
                : remediationJobData.status === "failed"
                ? "banner-failed"
                : "banner-running"
            }`}
          >
            <div className="banner-left">
              {remediationJobData.status === "done" ? (
                <CheckCircle2 size={20} className="banner-icon icon-success" />
              ) : remediationJobData.status === "failed" ? (
                <AlertTriangle size={20} className="banner-icon icon-error" />
              ) : (
                <Loader2 size={20} className="banner-icon spin-icon" />
              )}
              <div>
                <strong>
                  {remediationJobData.status === "done"
                    ? "PQC Auto-Remediation Completed!"
                    : remediationJobData.status === "failed"
                    ? "Remediation Failed"
                    : `Remediating: Stage [${remediationJobData.status || "processing"}]`}
                </strong>
                <p className="banner-subtext">
                  {remediationJobData.status === "done"
                    ? `Successfully opened Pull Request with NIST FIPS 203/204/205 fixes.`
                    : remediationJobData.status === "failed"
                    ? (remediationJobData.error || "Failed to process pull request.")
                    : `Applying quantum-safe code patches and running patch validation checks...`}
                </p>
              </div>
            </div>

            {remediationJobData.pr_url && (
              <a
                href={remediationJobData.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="view-pr-banner-btn"
              >
                <GitPullRequest size={15} />
                View Pull Request
                <ExternalLink size={12} style={{ marginLeft: 4 }} />
              </a>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="findings-summary-grid">
          <RiskCard overallRisk={readinessScore} riskLevel={riskLevel} />
          <SeverityBreakdown severity={severityCounts} />
          <ScanDetails
            filesScanned={filesCount || 1}
            totalFindings={totalFindings}
            duration={0.05}
          />
        </div>

        {/* Findings Table */}
        <div className="findings-list-section">
          <FindingsFilters
            search={search}
            setSearch={setSearch}
            severity={severity}
            setSeverity={setSeverity}
            type={type}
            setType={setType}
            algorithm={algorithm}
            setAlgorithm={setAlgorithm}
            riskScore={riskScore}
            setRiskScore={setRiskScore}
          />
          <FindingsTable
            findings={filteredFindings}
            selectedFindingIds={selectedFindingIds}
            onSelectionChange={setSelectedFindingIds}
            onFixSelected={handleFixSelected}
            onFixAllCritical={handleFixAllCritical}
            remediationMap={remediationMap}
          />
        </div>
      </div>

      {/* REMEDIATION MODAL */}
      {showRemediationModal && (
        <RemediationModal
          selectedFindings={selectedFindingsObjects}
          activeScan={scanData}
          onClose={() => setShowRemediationModal(false)}
          onStarted={handleJobStarted}
        />
      )}
    </div>
  );
}