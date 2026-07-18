import React, { useState, useEffect } from 'react';
import { fetchReportsApi } from '../../api/users';
import { formatDate } from '../../utils/dateUtils';
import './ReportsPage.css';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeSort, setTypeSort] = useState('none');

  const loadReports = async (start, end) => {
    setLoading(true);
    try {
      const data = await fetchReportsApi(start || undefined, end || undefined);
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки отчётов:', e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleApply = () => loadReports(startDate, endDate);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    loadReports();
  };

  const totalCount = reports.length;
  const issuedCount = reports.filter(r => r.type === 'выдача').length;
  const returnsCount = reports.filter(r => r.actual_return_date).length;
  const newBooksCount = reports.filter(r => r.type === 'поступление').length;

  const sortedReports = [...reports];
  if (typeSort === 'asc') {
    sortedReports.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  } else if (typeSort === 'desc') {
    sortedReports.sort((a, b) => (b.type || '').localeCompare(a.type || ''));
  }

  const handleTypeSortToggle = () => {
    setTypeSort((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const getSortIcon = () => {
    if (typeSort === 'asc') return '↑';
    if (typeSort === 'desc') return '↓';
    return '↑↓';
  };

  const getBadgeClass = (type) => {
    if (type === 'выдача') return 'issue';
    if (type === 'поступление') return 'intake';
    return 'return';
  };

  return (
    <div className="reports-page">

      <div className="reports-header">
        <h1 className="reports-title">📊 Отчёты</h1>
        <p className="reports-subtitle">Журнал всех операций библиотеки</p>
      </div>

      <div className="reports-filters">
        <div className="filter-group">
          <label className="filter-label">С даты</label>
          <input
            type="date"
            className="filter-date-input"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">По дату</label>
          <input
            type="date"
            className="filter-date-input"
            value={endDate}
            min={startDate || undefined}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <button className="btn-apply-filter" onClick={handleApply}>
          Применить фильтр
        </button>
        <button className="btn-reset-filter" onClick={handleReset}>
          Сбросить
        </button>
      </div>

      <div className="reports-stats">
        <div className="reports-stat-card">
          <div className="reports-stat-num">{totalCount}</div>
          <div className="reports-stat-label">Всего операций</div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-num">{issuedCount}</div>
          <div className="reports-stat-label">Выдач</div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-num">{returnsCount}</div>
          <div className="reports-stat-label">Возвратов</div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-num">{newBooksCount}</div>
          <div className="reports-stat-label">Поступлений</div>
        </div>
      </div>

      {loading ? (
        <div className="reports-loading">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="reports-skeleton" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="reports-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
          <p>Нет данных за выбранный период</p>
        </div>
      ) : (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={handleTypeSortToggle}>
                  <span className="sortable-column">
                    Тип операции <span className="sort-indicator">{getSortIcon()}</span>
                  </span>
                </th>
                <th>Книга</th>
                <th>Читатель</th>
                <th>Дата выдачи</th>
                <th>Дата возврата (срок)</th>
                <th>Возвращена</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span className={`op-badge ${getBadgeClass(row.type)}`}>
                      {row.type || '—'}
                    </span>
                  </td>
                  <td>{row.book_title || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{row.reader_name || '—'}</td>
                  <td>{formatDate(row.issue_date)}</td>
                  <td>{formatDate(row.return_date)}</td>
                  <td>
                    {row.actual_return_date
                      ? <span style={{ color: '#4ade80' }}>{formatDate(row.actual_return_date)}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
