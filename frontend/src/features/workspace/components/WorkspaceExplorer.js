"use client";

import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FilePlus,
  FolderPlus,
  RotateCw,
} from "lucide-react";

export default function WorkspaceExplorer({
  fileTree,
  activeFileId,
  onSelectFile,
  onToggleFolder,
  onNewFile,
  onNewFolder,
  onRefresh,
}) {
  const renderTreeNodes = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const paddingLeft = depth * 14 + 12;

      if (node.type === "folder") {
        const isExpanded = node.expanded;
        return (
          <React.Fragment key={node.id}>
            <div
              className="tree-item"
              title={node.name}
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={() => onToggleFolder(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="tree-chevron" />
              ) : (
                <ChevronRight className="tree-chevron" />
              )}
              {isExpanded ? (
                <FolderOpen className="tree-icon tree-icon-folder" />
              ) : (
                <Folder className="tree-icon tree-icon-folder" />
              )}
              <span className="tree-label">{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTreeNodes(node.children, depth + 1)}</div>
            )}
          </React.Fragment>
        );
      }

      const isActive = node.id === activeFileId || node.name === activeFileId;
      const isPython = node.name.endsWith(".py");
      const hasIssue = node.hasIssue;

      return (
        <div
          key={node.id}
          className={`tree-item ${isActive ? "active" : ""}`}
          title={node.name}
          style={{ paddingLeft: `${paddingLeft + 16}px` }}
          onClick={() => onSelectFile(node)}
        >
          {isPython ? (
            <FileCode className="tree-icon tree-icon-file" />
          ) : (
            <FileText className="tree-icon tree-icon-file" />
          )}
          <span className="tree-label">{node.name}</span>
          {hasIssue && <span className="finding-dot-indicator" title="Vulnerability detected" />}
        </div>
      );
    });
  };

  return (
    <div className="workspace-explorer">
      {/* Explorer Header */}
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button
            className="explorer-action-btn"
            title="New File"
            onClick={onNewFile}
          >
            <FilePlus size={15} />
          </button>
          <button
            className="explorer-action-btn"
            title="New Folder"
            onClick={onNewFolder}
          >
            <FolderPlus size={15} />
          </button>
          <button
            className="explorer-action-btn"
            title="Refresh Explorer"
            onClick={onRefresh}
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Explorer Tree */}
      <div className="explorer-tree">{renderTreeNodes(fileTree)}</div>
    </div>
  );
}
