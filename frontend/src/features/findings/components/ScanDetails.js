"use client";

import React from "react";

export default function ScanDetails({
  filesScanned,
  totalFindings,

}) {
  return (
    <div className="scan-details-card">
      <h3 className="card-title">SCAN DETAILS</h3>

      <div className="scan-detail-row">
        <span>Files Scanned</span>
        <strong>{filesScanned.toLocaleString()}</strong>
      </div>

      <div className="scan-detail-row">
        <span>Total Findings</span>
        <strong>{totalFindings}</strong>
      </div>

    
    </div>
  );
}