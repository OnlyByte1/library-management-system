import React, { useState, useEffect } from 'react';
import { fetchIssuedBooksApi, returnBookApi } from '../../api/books';
import { isOverdue, formatDate } from '../../utils/dateUtils';
import './ReturnPage.css';

const isSoon = (returnDate) => {
  if (!returnDate) return false;
  const days = Math.ceil((new Date(returnDate) - new Date()) / 86400000);
  return days >= 0 && days <= 3;
};

const ReturnPage = ({ showToast, fetchBooks }) => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [returningId, setReturningId] = useState(null);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await fetchIssuedBooksApi();
      setIssuedBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки выдач:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filtered = issuedBooks.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.reader_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const overdueCount = issuedBooks.filter(b => isOverdue(b.return_date)).length;

  const handleReturn = async (card) => {
    setReturningId(card.rental_id);
    try {
      const res = await returnBookApi(card.book_id, card.rental_id);
      if (res?.success !== false) {
        setIssuedBooks(prev => prev.filter(b => b.rental_id !== card.rental_id));
        if (fetchBooks) fetchBooks();
        if (showToast) showToast(`✅ Книга "${card.title}" возвращена`, 'success');
      }
    } catch (e) {
      console.error('Ошибка возврата:', e);

      if (showToast) {
        showToast('❌ Не удалось вернуть книгу', 'error');
      }
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="return-page">
      <div className="return-header">
        <div>
          <h1 className="return-title">📋 Возврат книг</h1>
          <p className="return-subtitle">Управление возвратами выданных экземпляров</p>
        </div>
        <div className="return-stats">
          <div className="stat-chip total">
            <span className="stat-num">{issuedBooks.length}</span>
            <span className="stat-label">на руках</span>
          </div>
          <div className="stat-chip overdue">
            <span className="stat-num">{overdueCount}</span>
            <span className="stat-label">просрочено</span>
          </div>
        </div>
      </div>

      <div className="return-search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="return-search-input"
          placeholder="Поиск по названию книги или читателю..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="return-loading">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="return-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="return-empty">
          <div className="empty-icon">📭</div>
          <h3>{search ? 'Ничего не найдено' : 'Нет книг на руках'}</h3>
          <p>{search ? 'Попробуйте изменить запрос' : 'Все книги возвращены'}</p>
        </div>
      ) : (
        <div className="return-list">
          {filtered.map(card => {
            const overdue = isOverdue(card.return_date);
            const soon = !overdue && isSoon(card.return_date);
            const isLoading = returningId === card.rental_id;

            return (
              <div
                key={card.rental_id}
                className={`return-card${overdue ? ' overdue' : ''}`}
              >
                <div className="return-card-cover">
                  {card.coverUrl
                    ? <img
                      src={card.coverUrl}
                      alt={card.title}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    : null}
                  <div
                    className="cover-placeholder"
                    style={{ display: card.coverUrl ? 'none' : 'flex' }}
                  >
                    📖
                  </div>
                </div>

                <div className="return-card-info">
                  <div className="return-card-top">
                    <h4 className="return-book-title">{card.title}</h4>
                    {overdue && <span className="overdue-badge">⚠ Просрочено</span>}
                    {soon && <span className="soon-badge">⏰ скоро</span>}
                  </div>

                  <p className="return-book-author">{card.author}</p>

                  <div className="return-meta">
                    <span className="meta-item">
                      <span className="meta-icon">👤</span>
                      {card.reader_name}
                      {card.reader_username && (
                        <span className="reader-username">&nbsp;@{card.reader_username}</span>
                      )}
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon">📅</span>
                      Выдана:&nbsp;{formatDate(card.issue_date)}
                    </span>
                    <span className={`meta-item${overdue ? ' text-red' : ''}`}>
                      <span className="meta-icon">🔔</span>
                      Вернуть до:&nbsp;{formatDate(card.return_date)}
                    </span>
                  </div>
                </div>

                <div className="return-card-action">
                  <button
                    className={`btn-return${isLoading ? ' loading' : ''}`}
                    disabled={isLoading}
                    onClick={() => handleReturn(card)}
                  >
                    {isLoading
                      ? <span className="btn-spinner" />
                      : 'Принять возврат'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReturnPage;
