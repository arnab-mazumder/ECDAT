"use client";

import { useCallback, useMemo } from "react";

export default function ReportDetails({ report, activeScan }) {
  if (!report) return null;

  // Normalize findings list from report or activeScan
  const normalizedFindings = useMemo(() => {
    const rawList =
      (report.rawFindings && report.rawFindings.length > 0 ? report.rawFindings : null) ||
      (report.findingsList && report.findingsList.length > 0 ? report.findingsList : null) ||
      (activeScan?.findings && activeScan.findings.length > 0 ? activeScan.findings : null) ||
      (report.activeScan?.findings && report.activeScan.findings.length > 0 ? report.activeScan.findings : null) ||
      [];

    return rawList.map((f, index) => {
      const algoName = f.algorithm || "Unknown";
      const keySizeStr = f.key_size ? `${f.key_size}-bit` : (f.keySize || "-");
      const algoDisplay = f.key_size && !String(algoName).includes(String(f.key_size))
        ? `${algoName}-${f.key_size}`
        : algoName;

      const severity = f.risk_bucket || f.severity || "Medium";
      const file = f.file || (f.location ? String(f.location).split(":")[0] : "unknown");
      const line = f.line || (f.location && String(f.location).includes(":") ? String(f.location).split(":")[1] : null);
      const locationDisplay = line ? `${file}:${line}` : file;

      const artifactType =
        f.artifact_type === "certificate" || f.artifactType === "Certificate"
          ? "Certificate"
          : "Source Code";

      const riskScore = f.risk_score ?? f.riskScore ?? 50;

      const recAlgorithm =
        typeof f.recommendation === "object"
          ? (f.recommendation?.algorithm || f.recommendation?.standard || "")
          : (f.recommendation || "");
      const recStandard =
        f.recommendation_standard ||
        (typeof f.recommendation === "object" ? f.recommendation?.standard : "") ||
        "";
      const rationale =
        (typeof f.recommendation === "object" ? f.recommendation?.rationale : "") ||
        f.rationale ||
        f.description ||
        f.title ||
        "";

      let recommendationDisplay = "";
      if (recAlgorithm && recStandard) {
        recommendationDisplay = `${recAlgorithm} (${recStandard})`;
      } else if (recAlgorithm) {
        recommendationDisplay = recAlgorithm;
      } else if (recStandard) {
        recommendationDisplay = recStandard;
      } else if (rationale) {
        recommendationDisplay = rationale;
      } else {
        recommendationDisplay = "Migrate to Quantum-Safe Standard (NIST PQC)";
      }

      const quantumSafe =
        f.quantum_safe !== undefined
          ? (f.quantum_safe ? "Quantum-Safe" : "Vulnerable")
          : (["Critical", "High"].includes(severity) || (f.risk_gap_years && f.risk_gap_years > 0)
              ? "Vulnerable"
              : "Quantum-Safe");

      return {
        id: f.id || `find-${index + 1}`,
        index: index + 1,
        severity,
        algorithm: algoDisplay,
        location: locationDisplay,
        file,
        line,
        artifactType,
        keySize: keySizeStr,
        riskScore,
        recommendation: recommendationDisplay,
        rationale: rationale || `Identified cryptographic use of ${algoDisplay} in ${locationDisplay}.`,
        quantumSafe,
        suggestedFix: f.suggested_fix || (f.code?.suggested || ""),
        originalCode: f.original_code || (f.code?.vulnerable || ""),
      };
    });
  }, [report, activeScan]);

  const version = report.version || (report.cyclonedxVersion ? "v1.6" : "v1.8.2");
  const targetName = report.name || activeScan?.target || "scanned-repository";

  // Dynamic Executive Summary
  const summary = useMemo(() => {
    if (normalizedFindings.length === 0) {
      return `Cryptographic security scan of ${targetName} completed. No critical cryptographic vulnerabilities or deprecated algorithms were identified. The repository demonstrates compliance with current quantum-readiness guidelines.`;
    }

    const criticalCount = normalizedFindings.filter(f => f.severity === "Critical").length;
    const highCount = normalizedFindings.filter(f => f.severity === "High").length;
    const algos = [...new Set(normalizedFindings.map(f => f.algorithm))].slice(0, 5).join(", ");

    return `The cryptographic scan of ${targetName} identified ${normalizedFindings.length} total cryptographic asset(s), with ${criticalCount} Critical and ${highCount} High risk findings. Detected primitives and algorithms include: ${algos}. Cryptographic migration is required to achieve post-quantum readiness (NIST PQC) and resolve classical vulnerabilities before deprecation deadlines.`;
  }, [targetName, normalizedFindings]);

  // Dynamic Migration Recommendations
  const migrationItems = useMemo(() => {
    if (normalizedFindings.length === 0) {
      return [
        "Maintain continuous cryptographic posture monitoring in CI/CD pipeline.",
        "Enforce TLS 1.3 across all service communications.",
        "Schedule periodic audits for future Post-Quantum Cryptography (PQC) standards.",
      ];
    }

    const items = [];
    const hasRsa = normalizedFindings.some(f => f.algorithm.toUpperCase().includes("RSA"));
    const hasSha1 = normalizedFindings.some(f => f.algorithm.toUpperCase().includes("SHA-1") || f.algorithm.toUpperCase().includes("SHA1") || f.algorithm.toUpperCase().includes("MD5"));
    const hasDes = normalizedFindings.some(f => f.algorithm.toUpperCase().includes("DES") || f.algorithm.toUpperCase().includes("RC4"));
    const hasCert = normalizedFindings.some(f => f.artifactType === "Certificate");

    if (hasRsa) {
      items.push("Transition asymmetric key encapsulation mechanisms to NIST FIPS 203 (ML-KEM) and signatures to FIPS 204 (ML-DSA).");
    }
    if (hasSha1) {
      items.push("Upgrade deprecated collision-vulnerable hash algorithms (SHA-1, MD5) to SHA-256 or SHA-3 (FIPS 202).");
    }
    if (hasDes) {
      items.push("Replace legacy symmetric ciphers (DES, 3DES, RC4) with AES-256-GCM (NIST SP 800-38D).");
    }
    if (hasCert) {
      items.push("Rotate certificates signed with deprecated public keys and enforce modern root certificates.");
    }
    items.push("Enforce TLS 1.3 across all internal and external communication protocols.");

    return items;
  }, [normalizedFindings]);

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "#dc2626";
      case "high": return "#ea580c";
      case "medium": return "#d97706";
      case "low": return "#16a34a";
      default: return "#6b7280";
    }
  };

  const getSeverityBorderColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "#fecaca";
      case "high": return "#fed7aa";
      case "medium": return "#fde68a";
      case "low": return "#bbf7d0";
      default: return "#d9d9d9";
    }
  };

  const handleDownloadCBOM = () => {
    const cbom = {
      bomFormat: "CycloneDX",
      specVersion: "1.6",
      serialNumber: `urn:uuid:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "ecdat-cbom-export"}`,
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: {
          components: [
            {
              type: "application",
              name: "Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)",
              version: "1.0.0",
            },
          ],
        },
        component: {
          type: "application",
          name: targetName,
          version: version,
        },
        properties: [
          { name: "ecdat:overall_risk", value: String(report.severity || "Unknown") },
          { name: "ecdat:readiness_score", value: String(report.readinessScore ?? 50) },
          { name: "ecdat:total_findings", value: String(normalizedFindings.length) },
        ],
      },
      components: normalizedFindings.map((f) => ({
        type: f.artifactType === "Certificate" ? "cryptographic-asset" : "source-code",
        name: f.algorithm,
        description: f.rationale,
        properties: [
          { name: "ecdat:location", value: f.location },
          { name: "ecdat:severity", value: f.severity },
          { name: "ecdat:risk_score", value: String(f.riskScore) },
          { name: "ecdat:recommendation", value: f.recommendation },
          { name: "ecdat:quantum_safe", value: f.quantumSafe },
        ],
      })),
    };

    const blob = new Blob([JSON.stringify(cbom, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${targetName.replace(/[^a-zA-Z0-9_-]/g, "_")}-cbom.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const loadFaviconDataUrl = async () => {
    try {
      const res = await fetch("/favicon.png");
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownloadPDF = useCallback(async () => {
    // Dynamic import of jsPDF and jspdf-autotable
    const jspdfModule = await import("jspdf");
    const JsPdfClass =
      jspdfModule.jsPDF || (jspdfModule.default && jspdfModule.default.jsPDF) || jspdfModule.default;

    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new JsPdfClass("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;

    // Load favicon image without background for branding
    const faviconDataUrl = await loadFaviconDataUrl();
    const hasFavicon = !!faviconDataUrl;

    // Helper: Add Running Page Footers (Zero-Collision Guarantee)
    const applyPageFooters = () => {
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(210, 214, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

        doc.setFontSize(7.5);
        doc.setTextColor(130, 131, 133); // #828385
        doc.setFont("helvetica", "normal");
        // Left footer: short and distinct
        doc.text("CONFIDENTIAL — Cryptographic Bill of Materials (CBOM)", margin, pageHeight - 6);
        // Right footer: separated by 80mm+ whitespace
        doc.text(
          `Page ${i} of ${totalPages}   •   ${new Date().toLocaleDateString()}`,
          pageWidth - margin,
          pageHeight - 6,
          { align: "right" }
        );
      }
    };

    // Helper: Check Page Overflow
    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - 22) {
        doc.addPage();
        y = margin;
      }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // 1. TOP HEADER BANNER (Secondary Color #828385 with embedded Favicon)
    // ──────────────────────────────────────────────────────────────────────────
    doc.setFillColor(130, 131, 133); // #828385
    doc.rect(0, 0, pageWidth, 28, "F");

    const textStartX = hasFavicon ? margin + 17 : margin;

    if (hasFavicon) {
      try {
        doc.addImage(faviconDataUrl, "PNG", margin, 7, 14, 14);
      } catch (err) {
        console.warn("Favicon PDF embed error:", err);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CRYPTOGRAPHIC BILL OF MATERIALS (CBOM)", textStartX, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(240, 240, 240);
    doc.text("OWASP CycloneDX 1.6 • NIST Post-Quantum Cryptography Security Audit", textStartX, 17);

    // Safely truncate targetName so it never overlaps right-side text
    const displayTarget = targetName.length > 42 ? targetName.slice(0, 39) + "..." : targetName;
    doc.text(`Target: ${displayTarget}`, textStartX, 23);

    const rightMargin = pageWidth - margin;
    doc.setFontSize(8);
    doc.text(`Generated: ${report.date || new Date().toLocaleDateString()}`, rightMargin, 11, { align: "right" });
    doc.text(`Specification: CycloneDX 1.6 CBOM`, rightMargin, 17, { align: "right" });
    doc.text(`Tool: ECDAT Enterprise v1.0`, rightMargin, 23, { align: "right" });

    y = 35;

    // ──────────────────────────────────────────────────────────────────────────
    // 2. EXECUTIVE POST-QUANTUM RISK SUMMARY
    // ──────────────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Executive Summary & Risk Posture", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 4;

    // ──────────────────────────────────────────────────────────────────────────
    // 3. RISK OVERVIEW STATISTICS (Rendered via autoTable to guarantee ZERO overflow)
    // ──────────────────────────────────────────────────────────────────────────
    const readinessScore = report.readinessScore ?? activeScan?.readiness_score ?? 50;
    const criticalCount = normalizedFindings.filter((f) => f.severity === "Critical").length;
    const highCount = normalizedFindings.filter((f) => f.severity === "High").length;
    const mediumCount = normalizedFindings.filter((f) => f.severity === "Medium").length;
    const lowCount = normalizedFindings.filter((f) => f.severity === "Low").length;

    const sevCol = getSeverityColor(report.severity);
    const r = parseInt(sevCol.slice(1, 3), 16);
    const g = parseInt(sevCol.slice(3, 5), 16);
    const b = parseInt(sevCol.slice(5, 7), 16);

    autoTable(doc, {
      startY: y,
      head: [["OVERALL RISK", "READINESS SCORE", "TOTAL ASSETS", "SEVERITY BREAKDOWN"]],
      body: [
        [
          {
            content: String(report.severity || "Critical").toUpperCase(),
            styles: {
              textColor: [r, g, b],
              fontStyle: "bold",
              fontSize: 10.5,
              halign: "center",
            },
          },
          {
            content: `${readinessScore} / 100`,
            styles: {
              fontStyle: "bold",
              fontSize: 10.5,
              halign: "center",
            },
          },
          {
            content: `${normalizedFindings.length} Assets`,
            styles: {
              fontStyle: "bold",
              fontSize: 10.5,
              halign: "center",
            },
          },
          {
            content: `Critical: ${criticalCount}    High: ${highCount}\nMedium: ${mediumCount}    Low: ${lowCount}`,
            styles: {
              fontSize: 7.5,
              halign: "center",
              lineHeightFactor: 1.35,
            },
          },
        ],
      ],
      theme: "plain",
      styles: {
        cellPadding: 3,
        valign: "middle",
        lineColor: [220, 224, 230],
        lineWidth: 0.3,
        fillColor: [248, 249, 250],
      },
      headStyles: {
        fillColor: [240, 242, 245],
        textColor: [100, 105, 115],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: 44 },
        2: { cellWidth: 44 },
        3: { cellWidth: 46 },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 25) + 9;

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TABLE 1: CBOM CRYPTOGRAPHIC ASSET INVENTORY (FROM FINDINGS PAGE)
    // ──────────────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Cryptographic Bill of Materials (CBOM) Inventory", margin, y);
    y += 4;

    const tableHead = [["#", "Severity", "Algorithm", "Location", "Type", "Key Size", "Risk", "Target PQC Recommendation"]];

    const tableBody = normalizedFindings.map((f) => [
      String(f.index),
      f.severity.toUpperCase(),
      f.algorithm,
      f.location,
      f.artifactType,
      f.keySize,
      String(f.riskScore),
      f.recommendation,
    ]);

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableBody.length > 0 ? tableBody : [["-", "NONE", "No Cryptographic Assets", "-", "-", "-", "-", "Compliant"]],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.3,
        textColor: [40, 44, 52],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [130, 131, 133], // Secondary theme #828385
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 18, fontStyle: "bold", halign: "center" },
        2: { cellWidth: 24, fontStyle: "bold" },
        3: { cellWidth: 44 },
        4: { cellWidth: 20 },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 14, halign: "center", fontStyle: "bold" },
        7: { cellWidth: 34 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const sev = String(data.cell.raw || "").toLowerCase();
          if (sev.includes("critical")) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fillColor = [254, 242, 242];
          } else if (sev.includes("high")) {
            data.cell.styles.textColor = [234, 88, 12];
            data.cell.styles.fillColor = [255, 247, 237];
          } else if (sev.includes("medium")) {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fillColor = [255, 251, 235];
          } else if (sev.includes("low")) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fillColor = [240, 253, 244];
          }
        }
      },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 9;

    // ──────────────────────────────────────────────────────────────────────────
    // 5. DETAILED FINDINGS & QUANTUM VULNERABILITY CATALOG (COMPLETE DETAIL)
    // ──────────────────────────────────────────────────────────────────────────
    checkPageBreak(35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Detailed Vulnerability & Remediation Catalog", margin, y);
    y += 4;

    const detailsTableBody = normalizedFindings.map((f) => {
      let profileText = `${f.algorithm}  •  ${f.severity} Risk (Risk Score: ${f.riskScore}/100)\nLocation: ${f.location}  [${f.artifactType}, Key Size: ${f.keySize}]\n\nRationale:\n${f.rationale}`;
      if (f.originalCode) {
        profileText += `\n\nDetected Code:\n${f.originalCode}`;
      }

      let remediationText = `Target: ${f.recommendation}\nQuantum Status: ${f.quantumSafe}`;
      if (f.suggestedFix) {
        remediationText += `\n\nSuggested Fix:\n${f.suggestedFix}`;
      }

      return [
        { content: String(f.index), styles: { halign: "center", fontStyle: "bold" } },
        { content: profileText, styles: { fontSize: 7.5 } },
        { content: remediationText, styles: { fontSize: 7.5 } },
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Finding Profile & Cryptographic Risk Analysis", "Post-Quantum Remediation & Standards"]],
      body: detailsTableBody,
      theme: "grid",
      styles: {
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [130, 131, 133],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 104 },
        2: { cellWidth: 66 },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y + 40) + 9;

    // ──────────────────────────────────────────────────────────────────────────
    // 6. POST-QUANTUM MIGRATION STRATEGY & ROADMAP
    // ──────────────────────────────────────────────────────────────────────────
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Actionable Post-Quantum Migration Strategy", margin, y);
    y += 4;

    const migrationTableBody = migrationItems.map((item, idx) => [
      String(idx + 1),
      item,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Priority", "Actionable Post-Quantum Migration Recommendation"]],
      body: migrationTableBody,
      theme: "striped",
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [130, 131, 133],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 16, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 162 },
      },
      margin: { left: margin, right: margin },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 7. APPLY RUNNING FOOTERS ACROSS ALL PAGES (ZERO COLLISION)
    // ──────────────────────────────────────────────────────────────────────────
    applyPageFooters();

    // Download PDF
    const safeFilename = targetName.replace(/[^a-zA-Z0-9_-]/g, "_");
    doc.save(`CBOM-Report-${safeFilename}.pdf`);
  }, [report, targetName, summary, migrationItems, normalizedFindings, activeScan]);

  const severityColor = getSeverityColor(report.severity);
  const severityBorder = getSeverityBorderColor(report.severity);

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        background: "#fff",
        padding: "20px",
      }}
    >
      {/* Report Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#111614",
            }}
          >
            {targetName}{" "}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 400,
                color: "#68716d",
              }}
            >
              {version}
            </span>
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "12px",
              color: "#68716d",
            }}
          >
            Generated {report.date || new Date().toLocaleDateString()}, 14:32 UTC • CycloneDX 1.6 CBOM
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleDownloadCBOM}
            style={{
              background: "#fff",
              border: "1px solid #d5d5d5",
              borderRadius: "4px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            {"{ }"} Download CBOM JSON
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            style={{
              background: "#828385",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Download PDF
          </button>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #eeeeee",
          margin: "16px 0",
        }}
      />

      {/* Executive Summary */}
      <section>
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "#111614",
          }}
        >
          Executive Summary
        </h3>

        <p
          style={{
            margin: "8px 0 0",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#4b5563",
          }}
        >
          {summary}
        </p>
      </section>

      {/* Risk Summary Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "18px",
        }}
      >
        <div
          style={{
            border: `1px solid ${severityBorder}`,
            padding: "14px",
            borderRadius: "6px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: severityColor,
              letterSpacing: "0.5px",
            }}
          >
            Overall Risk
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "24px",
              fontWeight: 800,
              color: severityColor,
            }}
          >
            {report.severity || "Critical"}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #d9d9d9",
            padding: "14px",
            borderRadius: "6px",
            background: "#fafafa",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#6b7280",
              letterSpacing: "0.5px",
            }}
          >
            Total Findings
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "24px",
              fontWeight: 800,
              color: "#111614",
            }}
          >
            {normalizedFindings.length || report.findings || 0}
          </div>
        </div>
      </div>

      {/* Findings Preview Table */}
      {normalizedFindings.length > 0 && (
        <section style={{ marginTop: "22px" }}>
          <h3
            style={{
              margin: "0 0 10px 0",
              fontSize: "14px",
              fontWeight: 700,
              color: "#111614",
            }}
          >
            CBOM Findings Overview ({normalizedFindings.length} Assets)
          </h3>

          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                <tr>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>#</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>SEVERITY</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>ALGORITHM</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>LOCATION</th>
                  <th style={{ padding: "8px 10px", fontWeight: 700, color: "#475569" }}>PQC RECOMMENDATION</th>
                </tr>
              </thead>
              <tbody>
                {normalizedFindings.slice(0, 8).map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "7px 10px", color: "#64748b" }}>{f.index}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: getSeverityColor(f.severity),
                          background: getSeverityBorderColor(f.severity),
                        }}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td style={{ padding: "7px 10px", fontWeight: 600, color: "#0f172a" }}>{f.algorithm}</td>
                    <td style={{ padding: "7px 10px", fontFamily: "monospace", color: "#475569" }}>{f.location}</td>
                    <td style={{ padding: "7px 10px", color: "#334155" }}>{f.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Migration Summary */}
      <section style={{ marginTop: "22px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "#111614",
          }}
        >
          Migration Roadmap
        </h3>

        <ul
          style={{
            margin: "8px 0 0",
            paddingLeft: "18px",
            color: "#4b5563",
            fontSize: "12px",
            lineHeight: 1.8,
          }}
        >
          {migrationItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
