"use client";

export default function FindingsFilters({
  search,
  setSearch,
  severity,
  setSeverity,
  type,
  setType,
  algorithm,
  setAlgorithm,
  riskScore,
  setRiskScore,
}) {
  return (
    <div className="findings-filters">

      <div className="findings-search">
        <span className="search-icon">⌕</span>

        <input
          type="text"
          placeholder="Search findings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-spacer" />

      <select
        className="filter-button"
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
      >
        <option value="">☰ Severity</option>
        <option value="Critical">Critical</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <select
  className="filter-button"
  value={type}
  onChange={(e) => setType(e.target.value)}
>
  <option value="">Type</option>
  <option value="Certificate">Certificate</option>
  <option value="Source Code">Source Code</option>
</select>

<select
  className="filter-button"
  value={algorithm}
  onChange={(e) => setAlgorithm(e.target.value)}
>
  <option value="">Algorithm</option>
  <option value="SHA1">SHA1</option>
  <option value="SHA-1">SHA-1</option>
  <option value="MD5">MD5</option>
  <option value="RSA">RSA</option>
  <option value="DSA">DSA</option>
  <option value="ECDSA">ECDSA</option>
  <option value="DES">DES</option>
  <option value="3DES">3DES</option>
</select>

<select
  className="risk-score-filter"
  value={riskScore}
  onChange={(e) => setRiskScore(e.target.value)}
>
  <option value="">☰ Risk Score</option>
  <option value="0-25">0–25</option>
  <option value="26-50">26–50</option>
  <option value="51-75">51–75</option>
  <option value="76-100">76–100</option>
</select>

    </div>
  );
}