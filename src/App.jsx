/* Разрабочик: Прокопьев Артём Олегович @OnlyByte*/

import React, { useEffect, useState } from "react";
import { useLibrary } from "./hooks/useLibrary";
import { useToast } from "./hooks/useToast";
import { fetchIssuedBooksApi } from "./api/books";
import { reserveBookApi } from "./api/users";
import { createPortal } from "react-dom";
import Toast from "./components/Toast/Toast.jsx";
import ReturnPage from "./pages/ReturnPage/ReturnPage.jsx";
import BookSkeleton from "./components/BookSkeleton/BookSkeleton.jsx";
import AdminPanel from "./pages/AdminPanel/AdminPanel";
import BookCard from "./components/BookCard/BookCard.jsx";
import LoginForm from "./components/LoginAndRegistration/LoginForm/LoginForm.jsx";
import UserProfile from "./pages/UserProfile/UserProfile.jsx";
import UserMenu from "./components/UserMenu/UserMenu.jsx";
import IssuePage from "./pages/IssuePage/IssuePage.jsx";
import FilterBar from "./components/FilterBar/FilterBar.jsx";
import ReadersManagement from "./pages/ReadersManagement/ReadersManagement.jsx";
import ReportsPage from "./pages/ReportsPage/ReportsPage.jsx";

import "./App.css";

function App() {
  const {
    users,
    books,
    loading,
    issueBook,
    returnBook,
    searchTerm,
    setSearchTerm,
    addBook,
    deleteBook,
    toggleStatus,
    updateBook,
    currentUser,
    isAdmin,
    login,
    register,
    logout,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    fetchBooks,
  } = useLibrary();

  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    coverUrl: "",
    description: "",
    quantity: 1,
  });
  const [editId, setEditId] = useState(null);
  const { toasts, showToast } = useToast();
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("library_active_tab") || "catalog";
  });
  const [returnKey, setReturnKey] = useState(0);
  const [issuedBooks, setIssuedBooks] = useState([]);

  const fetchIssuedBooks = async () => {
    try {
      const data = await fetchIssuedBooksApi();
      setIssuedBooks(data);
    } catch (e) {
      console.error("Ошибка загрузки выдач:", e);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "return") setReturnKey((prev) => prev + 1);
    if (tab === "issue") fetchIssuedBooks();
    setActiveTab(tab);
  };

  useEffect(() => {
    localStorage.setItem("library_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const handleReserveBook = async (book) => {
    if (!currentUser) {
      showToast("Пожалуйста, войдите в систему", "error");
      return;
    }
    try {
      const res = await reserveBookApi(book.id, currentUser.id);
      if (res.success) {
        showToast(`✅ Книга "${book.title}" забронирована`, "success");
        fetchBooks();
      } else {
        showToast(res.error || "Ошибка бронирования", "error");
      }
    } catch (error) {
      showToast("Ошибка бронирования", "error");
    }
  };

  const handleIssueBook = async (...args) => {
    const res = await issueBook(...args);
    if (res?.success) {
      fetchIssuedBooks();
      fetchBooks();
    }
    return res;
  };

  const startEdit = (e, book) => {
    e.stopPropagation();
    setEditId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      description: book.description || "",
      quantity: book.quantity ?? 1,
    });
    handleTabChange("admin_panel");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateHome = () => {
    handleTabChange("catalog");
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

  const handleLogout = () => {
    logout();
    handleTabChange("catalog");
    localStorage.removeItem("library_active_tab");
  };

  return (
    <div className="app-container">
      {showAuth && (
        <LoginForm
          login={login}
          register={register}
          onClose={() => setShowAuth(false)}
        />
      )}

      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedBook(null)}
            >
              ×
            </button>

            <div className="modal-grid">
              <div className="modal-image">
                {selectedBook.coverUrl ? (
                  <img
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="modal-no-cover"
                  style={{ display: selectedBook.coverUrl ? "none" : "flex" }}
                >
                  📖
                </div>
              </div>

              <div className="modal-info">
                <h2>{selectedBook.title}</h2>
                <div className="info-item">
                  <b>Автор:</b> {selectedBook.author}
                </div>
                <div className="info-item">
                  <b>ISBN:</b> {selectedBook.isbn}
                </div>
                <div className="info-item">
                  <b>В наличии:</b> {selectedBook.quantity ?? 1} экз.
                </div>
                <div className="modal-description">
                  {selectedBook.description ||
                    "Описание этой книги пока не добавлено."}
                </div>
                <div
                  className={`status-label ${selectedBook.status === "Доступна" ? "free" : "busy"}`}
                >
                  {selectedBook.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title" onClick={handleNavigateHome}>
              📚 ИС «Библиотека»
            </h1>
          </div>

          <div className="header-center">
            {activeTab === "catalog" && (
              <input
                className="search-input"
                placeholder="Поиск по библиотечному фонду..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          </div>

          <div className="header-right">
            {currentUser ? (
              <UserMenu
                currentUser={currentUser}
                isAdmin={isAdmin}
                onNavigate={handleTabChange}
                onLogout={handleLogout}
              />
            ) : (
              <button
                className="btn-login-trigger"
                onClick={() => setShowAuth(true)}
              >
                Вход
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="library-content">
        <div key={activeTab} className="page-transition">
          {activeTab === "profile" && currentUser && (
            <UserProfile
              currentUser={currentUser}
              onNavigate={handleTabChange}
              onBooksUpdate={fetchBooks}
            />
          )}

          {activeTab === "issue" && isAdmin && (
            <IssuePage
              users={users}
              books={books}
              issuedBooks={issuedBooks}
              issueBook={handleIssueBook}
              showToast={showToast}
            />
          )}

          {activeTab === "admin_panel" && isAdmin && (
            <AdminPanel
              books={books}
              editId={editId}
              setEditId={setEditId}
              form={form}
              setForm={setForm}
              addBook={addBook}
              updateBook={updateBook}
              showToast={showToast}
            />
          )}

          {activeTab === "return" && isAdmin && (
            <ReturnPage
              key={returnKey}
              showToast={showToast}
              fetchBooks={fetchBooks}
            />
          )}

          {activeTab === "readers_management" && isAdmin && (
            <ReadersManagement
              showToast={showToast}
            />
          )}

          {activeTab === "reports" && isAdmin && <ReportsPage />}

          {activeTab === "catalog" && (
            <>
              <FilterBar
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                count={books.length}
              />
              <main className="book-grid">
                {loading ? (
                  Array(8)
                    .fill(0)
                    .map((_, i) => <BookSkeleton key={i} />)
                ) : books.length > 0 ? (
                  books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isAdmin={isAdmin}
                      deleteBook={deleteBook}
                      startEdit={startEdit}
                      toggleStatus={toggleStatus}
                      returnBook={returnBook}
                      onSelect={setSelectedBook}
                      onIssueClick={() => handleTabChange("issue")}
                      onReserveClick={handleReserveBook}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <h2>Книг не найдено</h2>
                  </div>
                )}
              </main>
            </>
          )}
        </div>
      </div>

      {createPortal(<Toast toasts={toasts} />, document.body)}

      <footer className="main-footer">
        <div className="footer-content">
          <p>
            © 2026 ИС «Библиотечный фонд» | Пользователь:{" "}
            <b>{currentUser?.username || "Гость"}</b>
          </p>
          {activeTab === "catalog" && (
            <p>
              Найдено книг: <b>{books.length}</b>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
