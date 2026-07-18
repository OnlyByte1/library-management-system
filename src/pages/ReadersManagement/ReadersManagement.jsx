import React, { useState, useEffect } from 'react';
import {
  fetchReadersFullApi,
  fetchUserReservationsApi,
  cancelReservationApi,
  deleteUserApi,
  blockUserApi,
  updateUserApi,
  changePasswordApi,
} from '../../api/users';
import { formatDate } from '../../utils/dateUtils';
import './ReadersManagement.css';

const ReadersManagement = () => {
  const [readers, setReaders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({ full_name: '', rating: '' });
  const [newPassword, setNewPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingPwd, setSavingPwd]   = useState(false);
  const [blockingId, setBlockingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedReservationUserId, setSelectedReservationUserId] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [cancelingReservationId, setCancelingReservationId] = useState(null);
  const [notification, setNotification] = useState(null);

  /* ── load ── */
  const loadReaders = async () => {
    setLoading(true);
    try {
      const data = await fetchReadersFullApi();
      setReaders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки читателей:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReaders(); }, []);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* ── filter ── */
  const filtered = readers.filter(r =>
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.username?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ── edit ── */
  const openEdit = (reader) => {
    setEditingId(reader.id);
    setEditForm({ full_name: reader.full_name || '', rating: reader.rating ?? '' });
    setNewPassword('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewPassword('');
  };

  const handleSaveEdit = async (readerId) => {
    setSavingEdit(true);
    try {
      await updateUserApi(readerId, {
        full_name: editForm.full_name,
        rating: Number(editForm.rating),
      });
      setReaders(prev =>
        prev.map(r =>
          r.id === readerId
            ? { ...r, full_name: editForm.full_name, rating: Number(editForm.rating) }
            : r,
        ),
      );
      setEditingId(null);
      notify('Данные сохранены');
    } catch (e) {
      console.error(e);
      notify('Ошибка при сохранении', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const loadUserReservations = async (userId) => {
    setLoadingReservations(true);
    try {
      const data = await fetchUserReservationsApi(userId);
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки бронирований:', e);
      setReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Отменить эту бронь?')) return;
    setCancelingReservationId(reservationId);
    try {
      const data = await cancelReservationApi(reservationId);
      if (data.success) {
        notify('Бронь отменена');
        if (selectedReservationUserId) {
          await loadUserReservations(selectedReservationUserId);
        }
        await loadReaders();
      } else {
        notify(data.error || 'Не удалось отменить бронь', 'error');
      }
    } catch (e) {
      console.error('Ошибка отмены брони:', e);
      notify('Ошибка отмены брони', 'error');
    } finally {
      setCancelingReservationId(null);
    }
  };

  const toggleReservations = async (reader) => {
    if (selectedReservationUserId === reader.id) {
      setSelectedReservationUserId(null);
      return;
    }
    setSelectedReservationUserId(reader.id);
    await loadUserReservations(reader.id);
  };

  const handleSavePassword = async (readerId) => {
    if (!newPassword.trim()) return;
    setSavingPwd(true);
    try {
      await changePasswordApi(readerId, newPassword);
      setNewPassword('');
      notify('Пароль изменён');
    } catch (e) {
      console.error(e);
      notify('Ошибка при смене пароля', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  /* ── block ── */
  const handleBlock = async (reader) => {
    setBlockingId(reader.id);
    try {
      const res = await blockUserApi(reader.id);
      if (res && 'blocked' in res) {
        setReaders(prev =>
          prev.map(r => r.id === reader.id ? { ...r, blocked: res.blocked } : r),
        );
        notify(res.blocked === 1 ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      }
    } catch (e) {
      console.error(e);
      notify('Ошибка операции', 'error');
    } finally {
      setBlockingId(null);
    }
  };

  /* ── delete ── */
  const handleDelete = async (reader) => {
    if (!window.confirm(`Удалить пользователя «${reader.full_name}»? Это действие необратимо.`)) return;
    setDeletingId(reader.id);
    try {
      await deleteUserApi(reader.id);
      setReaders(prev => prev.filter(r => r.id !== reader.id));
      if (editingId === reader.id) setEditingId(null);
      notify('Пользователь удалён');
    } catch (e) {
      console.error(e);
      notify('Ошибка при удалении', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── render ── */
  return (
    <div className="readers-mgmt-page">

      {/* Header */}
      <div className="readers-mgmt-header">
        <h1 className="readers-mgmt-title">👥 Управление читателями</h1>
        <span className="readers-count-badge">{readers.length} читателей</span>
      </div>

      {/* Search */}
      <div className="readers-search-bar">
        <span className="readers-search-icon">🔍</span>
        <input
          className="readers-search-input"
          placeholder="Поиск по имени или никнейму..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', fontSize: '0.95rem' }}>
          Загрузка читателей...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-readers">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
          <p>{search ? 'Читатели не найдены' : 'Нет зарегистрированных читателей'}</p>
        </div>
      ) : (
        <div className="readers-list">
          {filtered.map(reader => {
            const isEditing  = editingId === reader.id;
            const isBlocking = blockingId === reader.id;
            const isDeleting = deletingId === reader.id;
            const blocked    = reader.blocked === 1;

            return (
              <div
                key={reader.id}
                className={`reader-mgmt-card${blocked ? ' blocked' : ''}`}
              >
                {/* Top row */}
                <div className="reader-mgmt-top">
                  <div style={{ flex: 1 }}>
                    <p className="reader-mgmt-name">
                      {reader.full_name}
                      {blocked && (
                        <span className="blocked-badge" style={{ marginLeft: '10px' }}>
                          Заблокирован
                        </span>
                      )}
                    </p>
                    <span className="reader-mgmt-username">@{reader.username}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="reader-mgmt-stats">
                  <div className="reader-stat">
                    <span>📅 Зарегистрирован:</span>
                    <span className="reader-stat-value">{formatDate(reader.created_at)}</span>
                  </div>
                  <div className="reader-stat">
                    <span>📚 На руках:</span>
                    <span className="reader-stat-value">{reader.books_count ?? 0}</span>
                  </div>
                  <div className="reader-stat">
                    <span>⚠️ Просрочено:</span>
                    <span className={`reader-stat-value${(reader.overdue_count ?? 0) > 0 ? ' danger' : ''}`}>
                      {reader.overdue_count ?? 0}
                    </span>
                  </div>
                  <div className="reader-stat">
                    <span>📌 Бронирований:</span>
                    <span className="reader-stat-value">{reader.reservation_count ?? 0}</span>
                  </div>
                  <div className="reader-stat">
                    <span>⭐ Рейтинг:</span>
                    <span className="reader-stat-value">{reader.rating ?? '—'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="reader-mgmt-actions">
                  <button
                    className="btn-edit-reader"
                    onClick={() => isEditing ? cancelEdit() : openEdit(reader)}
                  >
                    {isEditing ? 'Свернуть' : 'Редактировать'}
                  </button>

                  <button
                    className="btn-block-reader"
                    disabled={isBlocking}
                    onClick={() => handleBlock(reader)}
                  >
                    {isBlocking ? '...' : blocked ? 'Разблокировать' : 'Заблокировать'}
                  </button>

                  {reader.reservation_count > 0 && (
                    <button
                      className="btn-view-reservations"
                      onClick={() => toggleReservations(reader)}
                    >
                      {selectedReservationUserId === reader.id ? 'Скрыть брони' : `Брони (${reader.reservation_count})`}
                    </button>
                  )}

                  <button
                    className="btn-delete-reader"
                    disabled={isDeleting}
                    onClick={() => handleDelete(reader)}
                  >
                    {isDeleting ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>

                {selectedReservationUserId === reader.id && (
                  <div className="reader-reservation-list">
                    <div className="reservation-list-header">
                      <span>Активные бронирования</span>
                      {loadingReservations ? <span>Загрузка...</span> : null}
                    </div>
                    {loadingReservations ? (
                      <div className="reservation-loading">Загрузка бронирований...</div>
                    ) : reservations.length > 0 ? (
                      <div className="reservation-grid">
                        {reservations.map((item) => (
                          <div key={item.id} className="reservation-row">
                            <div className="reservation-title">{item.title}</div>
                            <div className="reservation-status">
                              {item.status === 'active' || item.status === null ? 'Активна' : item.status}
                            </div>
                            <div>{item.reserved_at ? formatDate(item.reserved_at) : '—'}</div>
                            <button
                              className="btn-cancel-reservation"
                              disabled={cancelingReservationId === item.id}
                              onClick={() => handleCancelReservation(item.id)}
                            >
                              {cancelingReservationId === item.id ? 'Отмена...' : 'Отменить'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="reservation-empty">У этого читателя нет активных бронирований.</div>
                    )}
                  </div>
                )}

                {/* Inline edit form */}
                {isEditing && (
                  <div className="reader-edit-form">
                    {/* Main fields */}
                    <div className="edit-form-row">
                      <div className="edit-form-group">
                        <label className="edit-form-label">Полное имя</label>
                        <input
                          className="edit-form-input"
                          value={editForm.full_name}
                          onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="Имя пользователя"
                        />
                      </div>
                      <div className="edit-form-group" style={{ maxWidth: '160px' }}>
                        <label className="edit-form-label">Рейтинг (0–100)</label>
                        <input
                          className="edit-form-input"
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.rating}
                          onChange={e => setEditForm({ ...editForm, rating: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="edit-form-actions">
                      <button
                        className="btn-save-edit"
                        disabled={savingEdit}
                        onClick={() => handleSaveEdit(reader.id)}
                      >
                        {savingEdit ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button className="btn-cancel-edit" onClick={cancelEdit}>
                        Отмена
                      </button>
                    </div>

                    {/* Password section */}
                    <div className="password-section">
                      <p className="password-section-title">🔑 Сменить пароль (без текущего)</p>
                      <div className="edit-form-row" style={{ alignItems: 'flex-end' }}>
                        <div className="edit-form-group">
                          <input
                            className="edit-form-input"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Новый пароль..."
                          />
                        </div>
                        <button
                          className="btn-save-edit"
                          disabled={savingPwd || !newPassword.trim()}
                          onClick={() => handleSavePassword(reader.id)}
                          style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                        >
                          {savingPwd ? 'Сохранение...' : 'Сменить'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            padding: '12px 20px',
            borderRadius: '0.75rem',
            fontSize: '0.88rem',
            fontWeight: 500,
            zIndex: 9999,
            background: notification.type === 'error' ? '#2f1a1a' : '#1a2f1a',
            border: `1px solid ${notification.type === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`,
            color: notification.type === 'error' ? '#f87171' : '#4ade80',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {notification.msg}
        </div>
      )}
    </div>
  );
};

export default ReadersManagement;
