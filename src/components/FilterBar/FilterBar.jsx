import React from 'react';
import { SORT_OPTIONS, STATUS_FILTERS } from '../../constants';
import './FilterBar.css';

function FilterBar({ statusFilter, setStatusFilter, sortOrder, setSortOrder, count }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-row">
        <span className="filter-label">Статус:</span>
        <div className="filter-chips">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Все" : s}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <span className="filter-label">Сортировка:</span>
        <select
          className="filter-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <span className="filter-count">
          Показано: <b>{count}</b>
        </span>
      </div>
    </div>
  );
}

export default FilterBar;
