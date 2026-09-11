"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import { Calculator } from "lucide-react";

export default function MoscaSandbox() {
  const [dataLifetimeX, setDataLifetimeX] = useState(10);
  const [migrationTimeY, setMigrationTimeY] = useState(2);
  const [quantumHorizonZ, setQuantumHorizonZ] = useState(10);

  const isBreached = dataLifetimeX + migrationTimeY > quantumHorizonZ;

  return (
    <Card className="mosca-sandbox-card">
      <div className="mosca-widget">
        <div>
          <div className="mosca-widget-title">
            <Calculator size={20} className="mosca-widget-icon" />
            Mosca's Theorem Risk Inequality Sandbox
          </div>
          <p className="mosca-widget-desc">
            If (X + Y) &gt; Z, your encryption will be broken before migration completes. Adjust parameters to simulate risk exposure windows.
          </p>

          <div className="mosca-sliders-list">
            <div className="mosca-slider-item">
              <div className="mosca-slider-header">
                <span className="mosca-slider-label">Data Security Lifetime (X)</span>
                <span className="mosca-slider-badge">{dataLifetimeX} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={dataLifetimeX}
                onChange={(e) => setDataLifetimeX(Number(e.target.value))}
                className="mosca-range-input"
              />
            </div>

            <div className="mosca-slider-item">
              <div className="mosca-slider-header">
                <span className="mosca-slider-label">Migration System Time (Y)</span>
                <span className="mosca-slider-badge">{migrationTimeY} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={migrationTimeY}
                onChange={(e) => setMigrationTimeY(Number(e.target.value))}
                className="mosca-range-input"
              />
            </div>

            <div className="mosca-slider-item">
              <div className="mosca-slider-header">
                <span className="mosca-slider-label">Quantum Threat Horizon (Z)</span>
                <span className="mosca-slider-badge">{quantumHorizonZ} Years</span>
              </div>
              <input
                type="range"
                min="3"
                max="20"
                value={quantumHorizonZ}
                onChange={(e) => setQuantumHorizonZ(Number(e.target.value))}
                className="mosca-range-input"
              />
            </div>
          </div>
        </div>

        <div className="mosca-widget-right">
          <div className="mosca-formula-box">
            <div className="mosca-equation">
              {dataLifetimeX}y + {migrationTimeY}y = {dataLifetimeX + migrationTimeY}y
              {isBreached ? " > " : " ≤ "}
              {quantumHorizonZ}y
            </div>
            <div
              className={`mosca-status-badge ${isBreached ? "status-breached" : "status-safe"}`}
            >
              {isBreached
                ? "CRITICAL QUANTUM BREACH EXPOSURE DETECTED"
                : "SAFE QUANTUM MIGRATION WINDOW"}
            </div>
            <div className="mosca-status-desc">
              {isBreached
                ? `Required retention (${dataLifetimeX + migrationTimeY} years) exceeds threat horizon (${quantumHorizonZ} years) by ${dataLifetimeX + migrationTimeY - quantumHorizonZ} year(s). Immediate PQC algorithm migration required!`
                : `Migration time and data retention fit safely within the estimated ${quantumHorizonZ}-year quantum threat window.`}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
