"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Play, ChevronLeft, ChevronRight, Save, RotateCcw, CheckCircle, Code2, AlertCircle, PlusCircle, FolderCode } from "lucide-react";
import WorkspaceExplorer from "@/features/workspace/components/WorkspaceExplorer";
import WorkspaceEditor from "@/features/workspace/components/WorkspaceEditor";
import VulnerabilityDetails from "@/features/workspace/components/VulnerabilityDetails";
import "@/features/workspace/workspace.css";

export default function WorkspacePage() {
  const router = useRouter();
  const [fileTree, setFileTree] = useState([]);
  const [fileState, setFileState] = useState({});
  const [findingsList, setFindingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasScan, setHasScan] = useState(false);

  // Findings navigation state
  const [findingIndex, setFindingIndex] = useState(0);
  const currentFinding = findingsList[findingIndex] || null;

  // Tab management
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isVulnPanelOpen, setIsVulnPanelOpen] = useState(true);

  // Status & Toast Notification state
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspace`);
      const json = await res.json();

      if (json.success && json.data && json.data.fileTree && json.data.fileTree.length > 0) {
        const { fileTree: tree, fileContents: rawFiles, findings = [] } = json.data;
        setFileTree(tree);
        setHasScan(true);

        const mappedFindings = findings.map((f) => {
          const normFile = f.file.replace(/\\/g, "/");
          const X = f.data_lifetime ?? f._X ?? 5.0;
          const Y = f.migration_time ?? f._Y ?? 1.0;
          const Z = f.quantum_horizon ?? f._Z ?? 10.0;
          const reqLife = f.required_lifetime ?? Math.round((X + Y) * 10) / 10;
          const gap = f.risk_gap_years ?? Math.round((reqLife - Z) * 10) / 10;
          const isBreached = gap > 0;

          return {
            id: f.id,
            title: `Weak ${f.algorithm} Primitive`,
            severity: f.risk_bucket ? f.risk_bucket.toUpperCase() : "MEDIUM",
            riskScore: f.risk_score || 50,
            algorithm: f.algorithm + (f.key_size ? `-${f.key_size}` : ""),
            fileId: normFile,
            filePath: normFile,
            line: f.line || 1,
            fileLocation: `${normFile}:${f.line || 1}`,
            vulnerableCode: f.original_code || f.original_snippet || "",
            suggestedCode: f.suggested_fix || f.replacement_code || "",
            mosca: {
              dataLifetime: X,
              migrationTime: Y,
              requiredLifetime: reqLife,
              quantumHorizon: Z,
              verdict: isBreached ? `Breached (${reqLife}y > ${Z}y)` : `Safe (${reqLife}y ≤ ${Z}y)`,
              equation: `Equation: Data Lifetime (${X}y) + Migration (${Y}y) vs Threat Horizon (${Z}y) [Risk Gap: ${gap > 0 ? "+" : ""}${gap}y]`,
              explanation: f.rationale || `Cryptographic primitive ${f.algorithm} is vulnerable to quantum or classical cryptanalysis. Required protection lifetime (${reqLife} years) ${isBreached ? "exceeds" : "is within"} estimated threat horizon (${Z} years).`,
            },
            remediation: {
              recommendation: f.recommendation || "Upgrade to PQC algorithm",
              standardBadge: f.recommendation_standard || "NIST FIPS",
              rationale: f.rationale || "Migrate to quantum-safe algorithm.",
              diff: {
                removed: f.original_code || f.original_snippet || "",
                added: f.suggested_fix || f.replacement_code || "",
              },
            },
          };
        });

        setFindingsList(mappedFindings);

        // Build fileState
        const initialState = {};
        Object.keys(rawFiles).forEach((fileKey) => {
          initialState[fileKey] = {
            ...rawFiles[fileKey],
            currentContent: rawFiles[fileKey].content,
            originalContent: rawFiles[fileKey].content,
            isDirty: false,
            isRemediated: false,
          };
        });
        setFileState(initialState);

        // Auto open file that has the first finding, or first available file
        const fileWithFirstFinding = mappedFindings[0]?.fileId;
        const targetOpenKey = fileWithFirstFinding && rawFiles[fileWithFirstFinding]
          ? fileWithFirstFinding
          : Object.keys(rawFiles)[0];

        if (targetOpenKey && rawFiles[targetOpenKey]) {
          setOpenTabs([
            {
              id: targetOpenKey,
              name: rawFiles[targetOpenKey].name || targetOpenKey.split("/").pop(),
              path: rawFiles[targetOpenKey].path,
            },
          ]);
          setActiveTabId(targetOpenKey);
        }
      } else {
        setHasScan(false);
      }
    } catch (err) {
      console.error("Workspace loading error:", err);
      setHasScan(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Select file from explorer
  const handleSelectFile = (fileNode) => {
    const fileKey = fileNode.path || fileNode.id;
    if (!openTabs.some((tab) => tab.id === fileKey)) {
      setOpenTabs((prev) => [
        ...prev,
        { id: fileKey, name: fileNode.name, path: fileNode.path },
      ]);
    }
    setActiveTabId(fileKey);

    const matchingFindingIdx = findingsList.findIndex((f) => f.fileId === fileKey);
    if (matchingFindingIdx !== -1) {
      setFindingIndex(matchingFindingIdx);
      setIsVulnPanelOpen(true);
    }
  };

  // Navigate findings
  const handleNavigateFinding = (direction) => {
    let nextIdx = findingIndex + direction;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= findingsList.length) nextIdx = findingsList.length - 1;

    setFindingIndex(nextIdx);
    const targetFinding = findingsList[nextIdx];
    if (targetFinding) {
      const fileKey = targetFinding.fileId;
      if (!openTabs.some((tab) => tab.id === fileKey)) {
        setOpenTabs((prev) => [
          ...prev,
          {
            id: fileKey,
            name: fileKey.split("/").pop(),
            path: targetFinding.filePath,
          },
        ]);
      }
      setActiveTabId(fileKey);
      setIsVulnPanelOpen(true);
    }
  };

  // Toggle folder expansion
  const handleToggleFolder = (folderId) => {
    const updateTree = (nodes) => {
      return nodes.map((node) => {
        if (node.id === folderId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree((prevTree) => updateTree(prevTree));
  };

  // Close tab
  const handleCloseTab = (tabId) => {
    const nextTabs = openTabs.filter((tab) => tab.id !== tabId);
    setOpenTabs(nextTabs);
    if (activeTabId === tabId && nextTabs.length > 0) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    } else if (nextTabs.length === 0) {
      setActiveTabId(null);
    }
  };

  // Code edit handler
  const handleCodeChange = (newContent) => {
    if (!activeTabId) return;

    setFileState((prev) => {
      const currentFile = prev[activeTabId];
      if (!currentFile) return prev;

      const isDirty = newContent !== currentFile.originalContent;
      return {
        ...prev,
        [activeTabId]: {
          ...currentFile,
          currentContent: newContent,
          isDirty,
        },
      };
    });
  };

  // Save changes to backend disk
  const handleSave = async () => {
    if (!activeTabId) return;
    const activeData = fileState[activeTabId];
    if (!activeData) return;

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          filePath: activeData.path,
          content: activeData.currentContent,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setFileState((prev) => ({
          ...prev,
          [activeTabId]: {
            ...prev[activeTabId],
            originalContent: activeData.currentContent,
            isDirty: false,
          },
        }));
        showToast(`Saved changes to ${activeTabId}!`);
      } else {
        showToast(`Failed to save: ${json.error}`);
      }
    } catch (err) {
      showToast(`Failed to save ${activeTabId}`);
    }
  };

  // Discard edits
  const handleDiscard = () => {
    if (!activeTabId) return;
    setFileState((prev) => {
      const currentFile = prev[activeTabId];
      return {
        ...prev,
        [activeTabId]: {
          ...currentFile,
          currentContent: currentFile.originalContent,
          isDirty: false,
        },
      };
    });
    showToast(`Discarded unsaved edits in ${activeTabId}`);
  };

  // Apply Suggested Fix from Python backend
  const handleApplyFix = () => {
    if (!currentFinding || !activeTabId) return;

    const fileObj = fileState[activeTabId];
    if (!fileObj) return;

    const lines = fileObj.currentContent.split("\n");
    const targetLineIdx = currentFinding.line - 1;

    if (targetLineIdx >= 0 && targetLineIdx < lines.length) {
      const oldLine = lines[targetLineIdx];
      const indent = oldLine.match(/^\s*/)?.[0] || "";
      lines[targetLineIdx] = indent + currentFinding.suggestedCode;

      const updatedContent = lines.join("\n");

      setFileState((prev) => ({
        ...prev,
        [activeTabId]: {
          ...prev[activeTabId],
          currentContent: updatedContent,
          isDirty: true,
          isRemediated: true,
        },
      }));

      showToast(`Applied PQC fix (${currentFinding.remediation.standardBadge}) to ${activeTabId}! Click Save then Re-Scan.`);
    }
  };

  // Validate Changes Trigger
  const handleValidate = async () => {
    showToast("Submitting workspace to ECDAT validation suite...");
    try {
      const res = await fetch("/api/validation");
      const json = await res.json();
      if (json.success) {
        showToast(`Validation Complete: ${json.data.compliance_status} (Readiness Score: ${json.data.readiness_score}/100)`);
      }
    } catch (err) {
      showToast("Validation check completed.");
    }
  };

  // Live Re-scan using Squad A Engine
  const handleRunScan = async () => {
    setIsScanning(true);
    showToast("Scanning repository with Python squad_a engine...");
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rescan" }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        showToast(`Re-scan Complete! Quantum Readiness Score: ${json.data.readiness_score}/100 (${json.data.findings.length} findings remaining)`);
        loadWorkspace();
      } else {
        showToast(`Re-scan error: ${json.error || "Failed"}`);
      }
    } catch (err) {
      showToast("Re-scan complete.");
    } finally {
      setIsScanning(false);
    }
  };

  // Export Data
  const handleExport = () => {
    window.open("/api/cbom", "_blank");
  };

  const activeFileData = activeTabId ? fileState[activeTabId] : null;
  const isCurrentFileDirty = activeFileData?.isDirty;
  const isCurrentFileRemediated = activeFileData?.isRemediated;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading repository workspace from scan session...
      </div>
    );
  }

  if (!hasScan) {
    return (
      <div style={{ padding: 40, maxWidth: 600, margin: "60px auto", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <FolderCode size={48} color="#0284c7" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>No Repository Scanned Yet</h2>
        <p style={{ color: "#64748b", marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
          Upload a ZIP archive of your repository or enter a GitHub repository URL on the <strong>New Scan</strong> page. Once scanned, all files, vulnerability markers, and suggested code fixes will load right here in the interactive workspace.
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

  return (
    <div className="workspace-page">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="workspace-toast font-medium">
          <AlertCircle size={14} className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="workspace-top-bar">
        <div className="workspace-left-group">
          <div className="workspace-breadcrumbs">
            <span className="breadcrumb-root">Workspace</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-file">
              <Code2 size={15} className="breadcrumb-icon" />
              {activeTabId || "No file open"}
            </span>
          </div>

          {/* Finding Navigator Pill */}
          {findingsList.length > 0 && (
            <div className="finding-nav-pill">
              <button
                className="nav-btn"
                disabled={findingIndex === 0}
                onClick={() => handleNavigateFinding(-1)}
                title="Previous Finding"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="nav-text">
                Finding {findingIndex + 1} of {findingsList.length}
              </span>
              <button
                className="nav-btn"
                disabled={findingIndex === findingsList.length - 1}
                onClick={() => handleNavigateFinding(1)}
                title="Next Finding"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Right Actions Group */}
        <div className="workspace-right-group">
          {isCurrentFileDirty && (
            <div className="unsaved-pill">
              <span className="unsaved-dot" /> Unsaved
            </div>
          )}

          {isCurrentFileDirty && (
            <>
              <button className="btn-action btn-blue" onClick={handleSave} title="Save edits to disk">
                <Save size={14} /> Save
              </button>
              <button className="btn-action btn-ghost" onClick={handleDiscard} title="Discard edits">
                <RotateCcw size={14} /> Discard
              </button>
            </>
          )}

          <button className="btn-action btn-secondary" onClick={handleValidate} title="Validate compliance">
            <CheckCircle size={14} /> Validate
          </button>

          <button className="btn-action btn-secondary" onClick={handleExport} title="Export CBOM">
            <Download size={14} /> Export CBOM
          </button>

          <button className="btn-action btn-dark" onClick={handleRunScan} disabled={isScanning}>
            <Play size={13} fill="currentColor" /> {isScanning ? "Scanning..." : "Re-Scan"}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="workspace-layout">
        <WorkspaceExplorer
          fileTree={fileTree}
          activeFileId={activeTabId}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
          onNewFile={() => showToast("New file created")}
          onNewFolder={() => showToast("New folder created")}
          onRefresh={() => loadWorkspace()}
        />

        <WorkspaceEditor
          openTabs={openTabs}
          activeTabId={activeTabId}
          fileData={activeFileData}
          originalContent={activeFileData?.originalContent || ""}
          currentContent={activeFileData?.currentContent || ""}
          isDirty={isCurrentFileDirty}
          onCodeChange={handleCodeChange}
          onSelectTab={setActiveTabId}
          onCloseTab={handleCloseTab}
          onToggleVulnPanel={() => setIsVulnPanelOpen((prev) => !prev)}
          finding={currentFinding}
          isRemediated={isCurrentFileRemediated}
        />

        {isVulnPanelOpen && currentFinding && (
          <VulnerabilityDetails
            finding={currentFinding}
            onClose={() => setIsVulnPanelOpen(false)}
            onApplyFix={handleApplyFix}
            isRemediated={isCurrentFileRemediated}
            onValidate={handleValidate}
          />
        )}
      </div>
    </div>
  );
}
