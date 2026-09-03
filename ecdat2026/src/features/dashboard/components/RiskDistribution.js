"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { History } from "lucide-react";

export default function RiskDistribution({ distribution, latestScan }) {
  const total =
    distribution.critical +
    distribution.high +
    distribution.medium +
    distribution.low;

  const criticalPct = (distribution.critical / total) * 100;
  const highPct = (distribution.high / total) * 100;
  const mediumPct = (distribution.medium / total) * 100;
  const lowPct = (distribution.low / total) * 100;

  return (
    <div className="middle-section-grid">
      {/* Risk Distribution Card */}
      <Card className="risk-distribution-card">
        <h2 className="section-card-title">Risk Distribution</h2>
        
        {/* Multi-segment Progress Bar */}
        <div className="distribution-bar-container">
          <div
            className="bar-segment bar-critical"
            style={{ width: `${criticalPct}%` }}
          />
          <div
            className="bar-segment bar-high"
            style={{ width: `${highPct}%` }}
          />
          <div
            className="bar-segment bar-medium"
            style={{ width: `${mediumPct}%` }}
          />
          <div
            className="bar-segment bar-low"
            style={{ width: `${lowPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="distribution-legend">
          <div className="legend-item">
            <span className="legend-dot dot-critical" />
            <span className="legend-text">
              Critical ({distribution.critical})
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-high" />
            <span className="legend-text">High ({distribution.high})</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-medium" />
            <span className="legend-text">
              Medium ({distribution.medium})
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-low" />
            <span className="legend-text">Low ({distribution.low})</span>
          </div>
        </div>
      </Card>

      {/* Latest Scan Card */}
      <Card className="latest-scan-card">
        <div className="latest-scan-header">
          <History className="latest-scan-icon" />
          <h2 className="section-card-title">Latest Scan</h2>
        </div>

        <div className="latest-scan-details">
          <div className="scan-detail-row">
            <span className="detail-label">Repository</span>
            <span className="detail-value repo-value">
              {latestScan.repository}
            </span>
          </div>
          <div className="scan-detail-row">
            <span className="detail-label">Files Scanned</span>
            <span className="detail-value">{latestScan.filesScanned}</span>
          </div>
          <div className="scan-detail-row">
            <span className="detail-label">New Findings</span>
            <span className="detail-value new-findings-value">
              {latestScan.newFindings}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
