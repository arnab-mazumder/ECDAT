"use client";

import React, { useState } from "react";
import { FileCode, FileText, X, AlertCircle, CheckCircle2, GitCompare, Code2 } from "lucide-react";

export default function WorkspaceEditor({
  openTabs,
  activeTabId,
  fileData,
  originalContent,
  currentContent,
  isDirty,
  onCodeChange,
  onSelectTab,
  onCloseTab,
  onToggleVulnPanel,
  finding,
  isRemediated,
}) {
  const [viewMode, setViewMode] = useState("code"); // "code" | "diff"

  if (!fileData) {
    return (
      <div className="workspace-editor-container">
        <div className="editor-tabs-bar" />
        <div className="editor-body" style={{ alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          Select a file from the explorer to view its content.
        </div>
      </div>
    );
  }

  const { language = "Python", encoding = "UTF-8" } = fileData;
  const issueLine = finding && finding.fileId === activeTabId ? finding.line : null;

  // Split string into lines array
  const lines = currentContent ? currentContent.split("\n") : [];
  const originalLines = originalContent ? originalContent.split("\n") : [];

  // Render Diff View
  const renderDiffView = () => {
    // Basic line-by-line diff between original and current content
    const maxLines = Math.max(originalLines.length, lines.length);
    const diffRows = [];

    for (let i = 0; i < maxLines; i++) {
      const orig = originalLines[i];
      const curr = lines[i];

      if (orig === curr) {
        diffRows.push(
          <div key={i} className="diff-row diff-row-unchanged">
            <span className="diff-sign">&nbsp;</span>
            <span>{curr ?? ""}</span>
          </div>
        );
      } else {
        if (orig !== undefined) {
          diffRows.push(
            <div key={`orig-${i}`} className="diff-row diff-row-removed">
              <span className="diff-sign">-</span>
              <span>{orig}</span>
            </div>
          );
        }
        if (curr !== undefined) {
          diffRows.push(
            <div key={`curr-${i}`} className="diff-row diff-row-added">
              <span className="diff-sign">+</span>
              <span>{curr}</span>
            </div>
          );
        }
      }
    }

    return <div className="diff-view-container">{diffRows}</div>;
  };

  return (
    <div className="workspace-editor-container">
      {/* Editor Tab Bar */}
      <div className="editor-tabs-bar">
        <div className="tabs-left-scroll">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isPython = tab.name.endsWith(".py");
            return (
              <div
                key={tab.id}
                className={`editor-tab ${isActive ? "active" : ""}`}
                onClick={() => onSelectTab(tab.id)}
              >
                {isPython ? (
                  <FileCode className="editor-tab-icon" />
                ) : (
                  <FileText className="editor-tab-icon" />
                )}
                <span>{tab.name}</span>
                {isDirty && isActive && <span className="tab-unsaved-dot">●</span>}
                <span
                  className="editor-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                >
                  <X size={12} />
                </span>
              </div>
            );
          })}
        </div>

        {/* View Mode Toggle: Code vs Diff */}
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === "code" ? "active" : ""}`}
            onClick={() => setViewMode("code")}
            title="Standard Code View"
          >
            <Code2 size={13} className="toggle-btn-icon" />
            <span>Code</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === "diff" ? "active" : ""}`}
            onClick={() => setViewMode("diff")}
            title="Git-style Diff View"
          >
            <GitCompare size={13} className="toggle-btn-icon" />
            <span>Diff View</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {viewMode === "diff" ? (
        renderDiffView()
      ) : (
        <div className="editor-body">
          {/* Line Numbers Column */}
          <div className="editor-line-numbers">
            {lines.map((_, index) => {
              const lineNum = index + 1;
              const hasIssue = lineNum === issueLine && !isRemediated;
              return (
                <div
                  key={lineNum}
                  className={`line-number-cell ${hasIssue ? "has-issue" : ""}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* Live Editable Textarea */}
          <textarea
            className="live-editor-textarea"
            value={currentContent}
            onChange={(e) => onCodeChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      {/* Editor Status Bar */}
      <div className="editor-status-bar">
        <div className="status-left">
          {isRemediated ? (
            <button className="status-remediated-btn" onClick={onToggleVulnPanel}>
              <CheckCircle2 size={14} />
              <span>Fix Applied (Pending Validation)</span>
            </button>
          ) : finding ? (
            <button className="status-issue-btn" onClick={onToggleVulnPanel}>
              <AlertCircle size={14} />
              <span>1 Vulnerability Detected</span>
            </button>
          ) : (
            <span>0 Issues</span>
          )}
        </div>
        <div className="status-meta">
          {isDirty && <span style={{ color: "#d97706", fontWeight: 700 }}>Unsaved Edits</span>}
          <span>Ln {issueLine || 1}, Col 1</span>
          <span>{language}</span>
          <span>{encoding}</span>
        </div>
      </div>
    </div>
  );
}
