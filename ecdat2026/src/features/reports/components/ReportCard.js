export default function ReportCard({
    name,
    date,
    findings,
    severity,
    onClick,
  }) {
    return (
      <div
        onClick={onClick}
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: "8px",
          padding: "18px",
          background: "#ffffff",
          marginBottom: "12px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#222",
              }}
            >
              {name}
            </h3>
  
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#777",
              }}
            >
              {date}
            </p>
          </div>
  
          <span
            style={{
              padding: "4px 9px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              background:
                severity === "High" ? "#fdecec" : "#e9f7ef",
              color:
                severity === "High" ? "#c62828" : "#27824b",
            }}
          >
            {severity}
          </span>
        </div>
  
        <div
          style={{
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid #eeeeee",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
          }}
        >
          <span style={{ color: "#666" }}>Findings</span>
  
          <strong style={{ color: "#222" }}>
            {findings}
          </strong>
        </div>
      </div>
    );
  }