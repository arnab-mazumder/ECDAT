export default function FindingsTable({ findings = [] }) {
  if (!findings || findings.length === 0) {
    return (
      <div className="findings-table-card" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        <h3>No Cryptographic Findings Found</h3>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          Either no scan has been executed yet, or the scanned repository adheres to quantum-safe cryptographic standards.
        </p>
      </div>
    );
  }

  return (
    <div className="findings-table-card">
      <table className="findings-table">
        <thead>
          <tr>
            <th>SEVERITY</th>
            <th>ALGORITHM</th>
            <th>LOCATION</th>
            <th>TYPE</th>
            <th>KEY SIZE</th>
            <th>RISK SCORE</th>
            <th>RECOMMENDATION</th>
          </tr>
        </thead>

        <tbody>
          {findings.map((finding) => (
            <tr key={finding.id}>
              <td>
                <span
                  className={`severity-badge severity-${(finding.severity || "medium").toLowerCase()}`}
                >
                  {finding.severity}
                </span>
              </td>

              <td className="algorithm-cell">
                {finding.algorithm}
              </td>

              <td className="location-cell">
                {finding.file}
                {finding.line ? `:${finding.line}` : ""}
              </td>

              <td>
                {finding.artifactType}
              </td>

              <td>
                {finding.keySize || "-"}
              </td>

              <td
                className={`risk-score-cell ${
                  finding.riskScore >= 90
                    ? "high-risk-score"
                    : ""
                }`}
              >
                {finding.riskScore}
              </td>

              <td className="recommendation-cell">
                {finding.recommendation?.rationale || finding.recommendation?.algorithm || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="findings-table-footer">
        <span>
          Showing {findings.length} {findings.length === 1 ? "finding" : "findings"}
        </span>
      </div>
    </div>
  );
}