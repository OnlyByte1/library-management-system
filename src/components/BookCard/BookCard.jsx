import React, { useState, useEffect } from "react";
import "./BookCard.css";

function BookCard({
  book,
  isAdmin,
  deleteBook,
  startEdit,
  toggleStatus,
  returnBook,
  onSelect,
  onIssueClick,
  onReserveClick,
}) {
  const [imgError, setImgError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [book.coverUrl]);

  const handleDeleteRequest = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleFinalDelete = (e) => {
    e.stopPropagation();
    deleteBook(book.id);
    setShowConfirm(false);
  };

  const qty = book.quantity ?? 1;

  return (
    <div className="book-card" onClick={() => onSelect(book)}>
      {showConfirm && (
        <div
          className="delete-confirm-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="confirm-content">
            <h4>Удалить книгу?</h4>
            <div className="confirm-btns">
              <button className="confirm-yes" onClick={handleFinalDelete}>
                Да
              </button>
              <button
                className="confirm-no"
                onClick={() => setShowConfirm(false)}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-image">
        {book.coverUrl && !imgError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="image-placeholder">📖</div>
        )}
      </div>

      <div className="card-content-wrapper">
        <div className="card-header-actions">
          <span
            className={`badge ${book.status === "Доступна" ? "green" : "red"}`}
          >
            {book.status}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className={`qty-badge ${qty === 0 ? "qty-zero" : ""}`}>
              {qty} экз.
            </span>
            {isAdmin && (
              <button className="btn-delete-card" onClick={handleDeleteRequest}>
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">от {book.author}</p>
          <code className="book-isbn">ISBN: {book.isbn || "—"}</code>
        </div>

        <div className="card-footer">
          {isAdmin && (
            <div className="admin-card-btns">
              <button
                className="btn-edit-small"
                onClick={(e) => startEdit(e, book)}
              >
                📝
              </button>
              <button
                className="btn-issue"
                onClick={(e) => {
                  e.stopPropagation();
                  if (book.status === "Доступна") {
                    onIssueClick();
                  } else {
                    returnBook(book.id);
                  }
                }}
              >
                {book.status === "Доступна" ? "Выдать" : "Вернуть"}
              </button>
            </div>
          )}
          {!isAdmin && book.status === "Доступна" && (
            <div className="user-card-btns">
              <button
                className="btn-reserve"
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveClick && onReserveClick(book);
                }}
              >
                📅 Забронировать
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookCard;
