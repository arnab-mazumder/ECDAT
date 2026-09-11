export default function FindingsFilters() {
  return (
    <div className="findings-filters">

      <div className="findings-search">
        <span className="search-icon">⌕</span>

        <input
          type="text"
          placeholder="Search findings..."
        />
      </div>

      <div className="filter-spacer" />

      <button className="filter-button">
        ☰ Severity
      </button>

      <button className="filter-button">
        Type
      </button>

      <button className="filter-button">
        Algorithm
      </button>

      <button className="risk-score-filter">
        ☰ Risk Score
      </button>

    </div>
  );
}