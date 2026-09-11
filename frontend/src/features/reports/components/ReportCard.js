export default function ReportCard({
  name,
  date,
  findings,
  severity,
  onClick,
}) {
  const getSeverityStyles = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return { background: '#fef2f2', color: '#dc2626' };
      case 'high':
        return { background: '#fff7ed', color: '#ea580c' };
      case 'medium':
        return { background: '#fffbeb', color: '#d97706' };
      case 'low':
        return { background: '#f0fdf4', color: '#16a34a' };
      default:
        return { background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const badgeStyle = getSeverityStyles(severity);

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
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#222",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
            flexShrink: 0,
            whiteSpace: "nowrap",
            ...badgeStyle,
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