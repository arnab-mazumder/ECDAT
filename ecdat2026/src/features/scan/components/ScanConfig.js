"use client";

import React from "react";

function ScanConfig({
  sourceCode,
  certificates,
  libraries,
  setSourceCode,
  setCertificates,
  setLibraries,
}) {
  return (
    <div className="scan-config-card">
      <h3 className="scan-config-title">SCAN CONFIGURATION</h3>

      <label className="scan-checkbox">
        <input
          type="checkbox"
          checked={sourceCode}
          onChange={(e) => setSourceCode(e.target.checked)}
        />
        <span>Source Code</span>
      </label>

      <label className="scan-checkbox">
        <input
          type="checkbox"
          checked={certificates}
          onChange={(e) => setCertificates(e.target.checked)}
        />
        <span>Certificates</span>
      </label>

      <label className="scan-checkbox">
        <input
          type="checkbox"
          checked={libraries}
          onChange={(e) => setLibraries(e.target.checked)}
        />
        <span>Libraries</span>
      </label>

      <div className="scan-config-divider" />

      <h4 className="coming-soon-title">COMING SOON</h4>

      <label className="scan-checkbox disabled">
        <input type="checkbox" disabled />
        <span>Binary Scanning</span>
      </label>

      <label className="scan-checkbox disabled">
        <input type="checkbox" disabled />
        <span>Container Scanning</span>
      </label>
    </div>
  );
}

export default ScanConfig;