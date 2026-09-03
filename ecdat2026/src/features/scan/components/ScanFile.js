"use client";

import React from "react";
import { FileArchive, X } from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ScanFile({ file, onRemove }) {
  if (!file) {
    return null;
  }

  return (
    <div className="selected-file-card">
      <div className="selected-file-header">
        <div className="selected-file-name">
          <FileArchive className="file-icon" />
          <span>{file.name}</span>
        </div>

        <button
          type="button"
          className="remove-file-button"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <X />
        </button>
      </div>

      <div className="selected-file-details">
        <div>
          <span className="file-detail-label">ARCHIVE SIZE</span>
          <strong>{formatFileSize(file.size)}</strong>
        </div>

        <div>
          <span className="file-detail-label">STATUS</span>
          <div className="language-tags">
            <span style={{ background: "#dbeafe", color: "#1e40af" }}>Ready for scanning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanFile;