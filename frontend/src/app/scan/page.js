"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import ScanUpload from "@/features/scan/components/ScanUpload";
import ScanConfig from "@/features/scan/components/ScanConfig";
import ScanFile from "@/features/scan/components/ScanFile";
import LiveScanMonitor from "@/features/scan/components/LiveScanMonitor";
import "@/features/scan/scan.css";

function ScanContent() {
  const searchParams = useSearchParams();
  const initialScanActive = searchParams ? searchParams.get("live") === "true" : false;

  const [isScanning, setIsScanning] = useState(initialScanActive);

  // selectedFile is the actual browser File object (or null)
  const [selectedFile, setSelectedFile] = useState(null);

  // GitHub URL alternative input
  const [githubUrl, setGithubUrl] = useState("");

  const [sourceCode, setSourceCode] = useState(true);
  const [certificates, setCertificates] = useState(true);
  const [libraries, setLibraries] = useState(true);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setGithubUrl(""); // clear URL if file selected
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const canStartScan = selectedFile !== null || githubUrl.trim() !== "";

  const handleStartScan = () => {
    if (!canStartScan) return;
    setIsScanning(true);
  };

  // If scan is active, render the live monitor
  if (isScanning) {
    const repoDisplayName = selectedFile
      ? selectedFile.name.replace(/\.(zip|tar\.gz|tgz)$/, "")
      : githubUrl.split("/").filter(Boolean).pop() || "repository";

    return (
      <LiveScanMonitor
        repoName={repoDisplayName}
        targetFile={selectedFile}
        githubUrl={githubUrl}
        onCancel={() => setIsScanning(false)}
      />
    );
  }

  return (
    <div className="scan-page">
      {/* Page Header */}
      <div className="scan-header">
        <h1 className="scan-title">New Scan</h1>
        <p className="scan-subtitle">
          Upload a ZIP of your repository or enter a GitHub URL to scan for cryptographic vulnerabilities.
        </p>
      </div>

      {/* Main Content */}
      <div className="scan-main-grid">
        {/* Left Side */}
        <div>
          <ScanUpload onFileSelect={handleFileSelect} />

          {/* GitHub URL input */}
          {!selectedFile && (
            <div style={{ margin: "16px 0" }}>
              <div style={{ textAlign: "center", color: "#888", fontSize: 13, marginBottom: 12 }}>
                — or enter a public GitHub URL —
              </div>
              <input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <ScanFile
            file={selectedFile}
            onRemove={handleRemoveFile}
          />

          <div className="scan-actions">
            <button
              type="button"
              className="scan-cancel-button"
              onClick={() => {
                setSelectedFile(null);
                setGithubUrl("");
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="scan-start-button"
              onClick={handleStartScan}
              disabled={!canStartScan}
              style={{ opacity: canStartScan ? 1 : 0.5, cursor: canStartScan ? "pointer" : "not-allowed" }}
            >
              ▷ Start Scan
            </button>
          </div>
        </div>

        {/* Right Side */}
        <ScanConfig
          sourceCode={sourceCode}
          certificates={certificates}
          libraries={libraries}
          setSourceCode={setSourceCode}
          setCertificates={setCertificates}
          setLibraries={setLibraries}
        />
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading scan module...</div>}>
      <ScanContent />
    </Suspense>
  );
}
