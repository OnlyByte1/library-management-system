import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  fetchUserBooksApi,
  fetchUserHistoryApi,
  extendRentalApi,
  fetchUserReservationsApi,
  cancelReservationApi,
} from "../../api/users";
import { isOverdue, formatDate, daysLeft } from "../../utils/dateUtils";
import "./UserProfile.css";

const UserProfile = ({ currentUser, onNavigate, onBooksUpdate }) => {
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const [userBooks, setUserBooks] = useState([]);
  const [history, setHistory] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [extending, setExtending] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    loadUserBooks();
    loadUserHistory();
    loadUserReservations();
  }, [currentUser]);

  const loadUserBooks = () => {
    setLoadingCurrent(true);
    fetchUserBooksApi(currentUser.id)
      .then((data) => {
        setUserBooks(Array.isArray(data) ? data : []);
        setLoadingCurrent(false);
      })
      .catch(() => setLoadingCurrent(false));
  };

  const loadUserHistory = () => {
    setLoadingHistory(true);
    fetchUserHistoryApi(currentUser.id)
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  };

  const loadUserReservations = () => {
    setLoadingReservations(true);
    fetchUserReservationsApi(currentUser.id)
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
        setLoadingReservations(false);
      })
      .catch(() => setLoadingReservations(false));
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const canExtendRental = (returnDate) => {
    if (!returnDate) return false;
    const days = daysLeft(returnDate);
    return days !== null && days >= -7;
  };

  const handleExtendClick = (book) => {
    if (!book.rental_id) return;
    const base = new Date(book.return_date);
    const today = new Date();
    const fromDate = base < today ? today : base;
    const newDate = new Date(fromDate);
    newDate.setDate(newDate.getDate() + 14);
    setShowConfirmModal({
      book,
      newDate: newDate.toISOString().split("T")[0],
    });
  };

  const handleCancelReservation = async (id) => {
    setConfirmCancelId(id);
  };

  const handleCancelConfirm = async () => {
    const data = await cancelReservationApi(confirmCancelId);
    setConfirmCancelId(null);
    if (data.success) {
      showToast("Бронирование отменено");
      loadUserReservations();
      onBooksUpdate && onBooksUpdate();
    }
  };

  const handleExtendConfirm = async () => {
    if (!showConfirmModal || extending) return;
    const { book } = showConfirmModal;
    setExtending(book.rental_id);
    try {
      const data = await extendRentalApi(book.rental_id);
      if (data.success) {
        showToast(
          `Срок возврата «${book.title}» продлён до ${formatDate(data.newReturnDate)}`,
        );
        setShowConfirmModal(null);
        loadUserBooks();
        loadUserHistory();
      } else {
        showToast(data.error || "Ошибка при продлении", "error");
      }
    } catch {
      showToast("Ошибка при продлении", "error");
    } finally {
      setExtending(null);
    }
  };

  if (!currentUser) {
    return <div className="profile-error">Пожалуйста, войдите в систему.</div>;
  }

  return (
    <>
      <div className="profile-container">
        {showConfirmModal && (
          <div
            className="extend-modal-overlay"
            onClick={() => setShowConfirmModal(null)}
          >
            <div className="extend-modal" onClick={(e) => e.stopPropagation()}>
              <h4>Продлить срок возврата?</h4>
              <p>
                Книга: <strong>«{showConfirmModal.book.title}»</strong>
                <br />
                Новая дата возврата:{" "}
                <strong>{formatDate(showConfirmModal.newDate)}</strong>
              </p>
              <div className="extend-modal-actions">
                <button
                  className="btn-confirm-extend"
                  onClick={handleExtendConfirm}
                  disabled={!!extending}
                >
                  {extending ? "Продление..." : "✓ Продлить"}
                </button>
                <button
                  className="btn-cancel-extend"
                  onClick={() => setShowConfirmModal(null)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmCancelId && (
          <div
            className="extend-modal-overlay"
            onClick={() => setConfirmCancelId(null)}
          >
            <div className="extend-modal" onClick={(e) => e.stopPropagation()}>
              <h4>Отменить бронирование?</h4>
              <p>Книга вернётся в каталог.</p>
              <div className="extend-modal-actions">
                <button
                  className="btn-confirm-extend"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    borderColor: "rgba(239,68,68,0.4)",
                    color: "#f87171",
                  }}
                  onClick={handleCancelConfirm}
                >
                  ✕ Отменить бронь
                </button>
                <button
                  className="btn-cancel-extend"
                  onClick={() => setConfirmCancelId(null)}
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="profile-header">
          <div className="user-info-card">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h2>{currentUser.full_name}</h2>
              <p className="user-login">@{currentUser.username}</p>
              <span className="user-badge">
                {currentUser.role === "admin"
                  ? "⚙️ Администратор"
                  : "📖 Читатель"}
              </span>
            </div>
          </div>

          <div className="profile-counters">
            <div className="counter-chip">
              <span className="counter-num">{userBooks.length}</span>
              <span className="counter-label">На руках</span>
            </div>
            <div className="counter-chip">
              <span className="counter-num">{history.length}</span>
              <span className="counter-label">В истории</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
          >
            📚 На руках
            {userBooks.length > 0 && (
              <span className="tab-count">{userBooks.length}</span>
            )}
          </button>
          <button
            className={`profile-tab ${activeTab === "reservations" ? "active" : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            📅 Бронирования
            {reservations.length > 0 && (
              <span className="tab-count">{reservations.length}</span>
            )}
          </button>
          <button
            className={`profile-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            🕓 История выдач
            {history.length > 0 && (
              <span className="tab-count">{history.length}</span>
            )}
          </button>
        </div>

        {/* ── На руках ── */}
        {activeTab === "current" && (
          <section className="profile-section">
            {loadingCurrent ? (
              <div className="profile-skeletons">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="profile-skeleton" />
                ))}
              </div>
            ) : userBooks.length > 0 ? (
              <div className="books-table-wrapper">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Книга</th>
                      <th>Выдана</th>
                      <th>Вернуть до</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBooks.map((item, i) => {
                      const overdue = isOverdue(item.return_date);
                      const canExtend = canExtendRental(item.return_date);
                      return (
                        <tr key={i} className={overdue ? "row-overdue" : ""}>
                          <td className="td-title">{item.title}</td>
                          <td data-label="Выдана">{formatDate(item.issue_date)}</td>
                          <td data-label="Вернуть до" className={overdue ? "overdue-date" : ""}>
                            {formatDate(item.return_date)}
                          </td>
                          <td data-label="Статус">
                            <span className={`status-pill ${overdue ? "pill-late" : "pill-active"}`}>
                              {overdue ? "⚠ Просрочено" : "✓ На руках"}
                            </span>
                          </td>
                          <td data-label="Действие">
                            {canExtend && item.rental_id ? (
                              <button
                                className="btn-extend"
                                onClick={() => handleExtendClick(item)}
                                disabled={extending === item.rental_id}
                              >
                                {extending === item.rental_id ? "..." : "📅 Продлить"}
                              </button>
                            ) : (
                              <span className="extend-unavail">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-profile-state">
                <div className="empty-icon">📭</div>
                <p>У вас пока нет взятых книг</p>
                <button
                  className="go-to-catalog"
                  onClick={() => onNavigate("catalog")}
                >
                  Перейти в каталог
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Бронирования ── */}
        {activeTab === "reservations" && (
          <section className="profile-section">
            {loadingReservations ? (
              <div className="profile-skeletons">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="profile-skeleton" />
                ))}
              </div>
            ) : reservations.length > 0 ? (
              <div className="books-table-wrapper">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Книга</th>
                      <th>Забронирована</th>
                      <th>Статус</th>
                      <th>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((item, i) => (
                      <tr key={i}>
                        <td className="td-title">{item.title}</td>
                        <td data-label="Забронирована">{formatDate(item.reserved_at)}</td>
                        <td data-label="Статус">
                          <span className="status-pill pill-active">
                            {item.status === "active" ? "Активна" : item.status}
                          </span>
                        </td>
                        <td data-label="Действие">
                          {item.status === "active" && (
                            <button
                              className="btn-extend"
                              style={{
                                color: "#f87171",
                                borderColor: "rgba(239,68,68,0.3)",
                                background: "rgba(239,68,68,0.1)",
                              }}
                              onClick={() => handleCancelReservation(item.id)}
                            >
                              ✕ Отменить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-profile-state">
                <div className="empty-icon">📅</div>
                <p>Нет активных бронирований</p>
                <button
                  className="btn-browse-books"
                  onClick={() => onNavigate && onNavigate("catalog")}
                >
                  📚 Просмотреть книги
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── История выдач ── */}
        {activeTab === "history" && (
          <section className="profile-section">
            {loadingHistory ? (
              <div className="profile-skeletons">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="profile-skeleton" />
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="books-table-wrapper">
                <table className="books-table">
                  <thead>
                    <tr>
                      <th>Книга</th>
                      <th>Выдана</th>
                      <th>Срок возврата</th>
                      <th>Возвращена</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, i) => {
                      const returned = !!item.actual_return_date;
                      const overdue = !returned && isOverdue(item.return_date);
                      return (
                        <tr key={i}>
                          <td className="td-title">{item.title}</td>
                          <td data-label="Выдана">{formatDate(item.issue_date)}</td>
                          <td data-label="Срок возврата" className={overdue ? "overdue-date" : ""}>
                            {formatDate(item.return_date)}
                          </td>
                          <td data-label="Возвращена">{formatDate(item.actual_return_date)}</td>
                          <td data-label="Статус">
                            {returned ? (
                              <span className="status-pill pill-returned">
                                ✓ Возвращена
                              </span>
                            ) : overdue ? (
                              <span className="status-pill pill-late">
                                ⚠ Просрочено
                              </span>
                            ) : (
                              <span className="status-pill pill-active">
                                На руках
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-profile-state">
                <div className="empty-icon">🕓</div>
                <p>История выдач пуста</p>
              </div>
            )}
          </section>
        )}
      </div>

      {toast && createPortal(
        <div className={`profile-toast ${toast.type}`}>{toast.message}</div>,
        document.body
      )}
    </>
  );
};

export default UserProfile;