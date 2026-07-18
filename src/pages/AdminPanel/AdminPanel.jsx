import React, { useState, useMemo } from 'react';
import { importBooksFromJson } from '../../utils/fileHandlers';
import './AdminPanel.css';

function AdminPanel({
  editId,
  setEditId,
  form,
  setForm,
  addBook,
  updateBook,
  issueBook,
  books = [],
  users = [],
  showToast}) {

  const [issueForm, setIssueForm] = useState({
    userId: "",
    bookId: "",
    issueDate: new Date().toISOString().split("T")[0],
    returnDate: "",
  });

  const foundUser = useMemo(() => {
    const search = issueForm.userId.trim().toLowerCase();
    return users.find(
      (u) => String(u.id) === search || u.username?.toLowerCase() === search,
    );
  }, [users, issueForm.userId]);

  const foundBook = useMemo(() => {
    const search = issueForm.bookId.trim().toLowerCase();
    return books.find(
      (b) => String(b.id) === search || b.title?.toLowerCase() === search,
    );
  }, [books, issueForm.bookId]);

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      if (editId) {
        await updateBook(editId, form);
        setEditId(null);
        showToast(`✅ Книга "${form.title}" успешно обновлена!`);
      } else {
        await addBook(form);
        showToast(`✅ Книга "${form.title}" добавлена в фонд!`);
      }
      setForm({
        title: "",
        author: "",
        isbn: "",
        coverUrl: "",
        description: "",
        quantity: 1,
      });
    } catch (err) {
      showToast("❌ Ошибка при сохранении данных", "error");
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!issueForm.userId || !issueForm.bookId || !issueForm.returnDate) {
      alert("Заполните все поля выдачи");
      return;
    }
    if (!foundUser) {
      alert("Пользователь не найден");
      return;
    }
    if (!foundBook) {
      alert("Книга не найдена");
      return;
    }

    const result = await issueBook(
      foundBook.id,
      foundUser.id,
      issueForm.issueDate,
      issueForm.returnDate,
    );

    if (result?.success) {
      showToast(`✅ Книга "${foundBook.title}" выдана ${foundUser.username}`);
      setIssueForm({
        userId: "",
        bookId: "",
        issueDate: new Date().toISOString().split("T")[0],
        returnDate: "",
      });
    } else {
      showToast("❌ Ошибка при фиксации выдачи", "error");
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await importBooksFromJson(file, async (importedBooks) => {
        for (const book of importedBooks) {
          await addBook(book);
        }
      });
      showToast("✅ Книги успешно импортированы!");
    } catch (err) {
      showToast("❌ Ошибка при импорте", "error");
    }
    e.target.value = "";
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      title: "",
      author: "",
      isbn: "",
      coverUrl: "",
      description: "",
      quantity: 1,
    });
  };

  const qty = parseInt(form.quantity) || 1;

  return (
    <section className="admin-controls-panel">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>{editId ? "📝 Редактировать" : "➕ Добавить в фонд"}</h3>
          <div className="admin-header-buttons">
            {!editId && (
              <label
                className="btn-import-json"
                title="Загрузить книги из JSON"
              >
                📥 Импорт
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>
        </div>

        <form onSubmit={handleAddOrUpdate} className="add-form-vertical">
          <input
            placeholder="Название"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Автор"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <input
            placeholder="ISBN"
            value={form.isbn}
            onChange={(e) => setForm({ ...form, isbn: e.target.value })}
          />
          <input
            placeholder="Ссылка на фото"
            value={form.coverUrl}
            onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
          />
          <textarea
            placeholder="Описание книги..."
            value={form.description}
            className="desc-textarea"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="quantity-row">
            <label className="quantity-label">Количество экземпляров</label>
            <div className="quantity-control">
              <button
                type="button"
                className="qty-btn"
                onClick={() =>
                  setForm({ ...form, quantity: Math.max(1, qty - 1) })
                }
              >
                −
              </button>
              <input
                type="number"
                className="qty-input"
                min="1"
                max="999"
                value={qty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
              />
              <button
                type="button"
                className="qty-btn"
                onClick={() => setForm({ ...form, quantity: qty + 1 })}
              >
                +
              </button>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-add-submit">
              {editId ? "Сохранить" : "Добавить"}
            </button>
            {editId && (
              <button type="button" className="btn-cancel" onClick={cancelEdit}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-preview-section">
        <p className="preview-label">Предпросмотр новой книги:</p>
        <div className="book-card preview-card">
          <div className="card-image">
            {form.coverUrl ? (
              <img src={form.coverUrl} alt="Preview" />
            ) : (
              <div className="image-placeholder">📖</div>
            )}
          </div>
          <div className="card-content-wrapper">
            <div className="card-header-actions">
              <span className="badge green">Доступна</span>
              <span className="qty-badge">{qty} экз.</span>
            </div>
            <div className="card-body">
              <h3 className="book-title">{form.title || "Название книги"}</h3>
              <p className="book-author">от {form.author || "Автор"}</p>
              <p className="isbn-preview">ISBN: {form.isbn || "—"}</p>
              <p className="preview-desc-hint">
                {form.description ? "Описание добавлено ✓" : "Без описания"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
