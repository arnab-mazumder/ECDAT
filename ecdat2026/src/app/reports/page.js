"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportCard from "../../features/reports/components/ReportCard";
import ReportDetails from "../../features/reports/components/ReportDetails";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success && json.reports) {
        setReports(json.reports);
        setSelectedReport(json.reports[0]);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRunScan = () => {
    router.push("/scan?live=true");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 600,
                color: "#222",
              }}
            >
              Reports
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#777",
                fontSize: "14px",
              }}
            >
              Security assessments and cryptographic risk reports
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunScan}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ▷ Run Scan
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center" }}>Loading report suite...</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: "16px",
              alignItems: "start",
            }}
          >
            <div>
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  name={report.name}
                  date={report.date}
                  findings={report.findings}
                  severity={report.severity}
                  onClick={() => setSelectedReport(report)}
                />
              ))}
            </div>

            <ReportDetails report={selectedReport} />
          </div>
        )}
      </div>
    </main>
  );
}