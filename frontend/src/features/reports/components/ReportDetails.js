export default function ReportDetails({ report }) {
    if (!report) return null;
  
    const isBanking = report.name === "banking-system";
    const isPayment = report.name === "payment-service";
    
    const handleDownloadCBOM = () => {
        const cbom = {
          report: report.name,
          date: report.date,
          severity: report.severity,
          findings: report.findings,
          version,
        };
      
        const blob = new Blob(
          [JSON.stringify(cbom, null, 2)],
          { type: "application/json" }
        );
      
        const url = URL.createObjectURL(blob);
      
        const link = document.createElement("a");
        link.href = url;
        link.download = `${report.name}-cbom.json`;
      
        document.body.appendChild(link);
        link.click();
        link.remove();
      
        URL.revokeObjectURL(url);
      };
        
      const handleDownloadPDF = () => {
        window.print();
      };
    const version = isBanking ? "v2.4.1" : isPayment ? "v1.8.2" : "v1.8.2";
  
    const summary = isBanking
      ? "The scan of banking-system revealed critical cryptographic vulnerabilities primarily centered around the use of deprecated hashing algorithms (SHA-1) in legacy authentication modules and weak TLS configurations. Immediate remediation is required to maintain compliance."
      : isPayment
        ? "The scan of payment-service identified several cryptographic configuration issues requiring remediation to maintain secure payment processing and compliance."
        : "The scan identified several cryptographic configuration issues requiring remediation to maintain a secure system and compliance.";
  
    const migrationItems = isBanking
      ? [
          "Upgrade 14 instances of SHA-1 to SHA-256 or SHA-3 in auth_service.py.",
          "Enforce TLS 1.3 across all internal microservice communications.",
          "Rotate 3 hardcoded symmetric keys found in configuration files.",
        ]
      : isPayment
        ? [
            "Replace deprecated cryptographic algorithms in payment processing modules.",
            "Enforce TLS 1.3 for payment-service communications.",
            "Review and rotate exposed cryptographic keys.",
          ]
        : [
            "Replace deprecated cryptographic algorithms.",
            "Enforce TLS 1.3 across service communications.",
            "Review and rotate exposed cryptographic keys.",
          ];
  
    return (
      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          background: "#fff",
          padding: "16px",
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
                fontSize: "17px",
                fontWeight: 600,
                color: "#222",
              }}
            >
              {report.name}{" "}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#777",
                }}
              >
                {version}
              </span>
            </h2>
  
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "11px",
                color: "#777",
              }}
            >
              Generated {report.date}, 14:32 UTC
            </p>
          </div>
  
          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleDownloadCBOM}
              style={{
                background: "#fff",
                border: "1px solid #d5d5d5",
                borderRadius: "4px",
                padding: "7px 10px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              {"{ }"} Download CBOM JSON
            </button>
  
            <button
              type="button"
              onClick={handleDownloadPDF}
              style={{
                background: "#10251f",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "7px 10px",
                fontSize: "11px",
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
            margin: "14px 0",
          }}
        />
  
        {/* Executive Summary */}
        <section>
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 600,
              color: "#222",
            }}
          >
            Executive Summary
          </h3>
  
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "11px",
              lineHeight: 1.5,
              color: "#555",
            }}
          >
            {summary}
          </p>
        </section>
  
        {/* Risk Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <div
            style={{
              border:
                report.severity === "High"
                  ? "1px solid #f0d4d0"
                  : "1px solid #d5eadc",
              padding: "12px",
              borderRadius: "3px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                color: report.severity === "High" ? "#c62828" : "#27824b",
                letterSpacing: "0.5px",
              }}
            >
              Overall Risk
            </div>
  
            <div
              style={{
                marginTop: "5px",
                fontSize: "22px",
                fontWeight: 600,
                color: report.severity === "High" ? "#c62828" : "#27824b",
              }}
            >
              {report.severity}
            </div>
          </div>
  
          <div
            style={{
              border: "1px solid #d9d9d9",
              padding: "12px",
              borderRadius: "3px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                color: "#555",
                letterSpacing: "0.5px",
              }}
            >
              Total Findings
            </div>
  
            <div
              style={{
                marginTop: "5px",
                fontSize: "22px",
                fontWeight: 600,
                color: "#222",
              }}
            >
              {report.findings}
            </div>
          </div>
        </div>
  
        {/* Migration Summary */}
        <section style={{ marginTop: "20px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 600,
              color: "#222",
            }}
          >
            Migration Summary
          </h3>
  
          <ul
            style={{
              margin: "8px 0 0",
              paddingLeft: "18px",
              color: "#555",
              fontSize: "11px",
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

