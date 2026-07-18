import { useState, useEffect, useMemo } from "react";

const API_URL = "http://localhost:5000/api";

export const useLibrary = () => {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("library_user_obj");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const fetchBooks = () => {
    return fetch(`${API_URL}/books`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки книг:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();

    fetch(`${API_URL}/readers`)
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Ошибка загрузки пользователей:", err);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("library_user_obj", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("library_user_obj");
    }
  }, [currentUser]);

  const register = async (username, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, full_name: fullName }),
      });
      const data = await response.json();
      return response.ok
        ? { success: true }
        : { success: false, message: data.error };
    } catch (error) {
      return { success: false, message: "Сервер недоступен" };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        const userSession = {
          id: data.userId,
          username,
          full_name: data.fullName,
          role: data.role === 1 ? "admin" : "user",
        };
        setCurrentUser(userSession);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: "Сервер недоступен" };
    }
  };

  const logout = () => setCurrentUser(null);
  const isAdmin = currentUser?.role === "admin";

  const addBook = async (bookData) => {
    if (!isAdmin) return;
    const response = await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    const newBook = await response.json();
    setBooks((prev) => [newBook, ...prev]);
  };

  const issueBook = async (
    bookId,
    userId,
    issueDate,
    returnDate,
    quantity = 1,
  ) => {
    if (!isAdmin) return { success: false, message: "Нет прав" };
    try {
      const response = await fetch(`${API_URL}/issue-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          userId,
          issueDate,
          returnDate,
          quantity,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchBooks();
        return { success: true };
      }
      return { success: false, message: data.error };
    } catch (err) {
      console.error("Ошибка при выдаче:", err);
      return { success: false };
    }
  };

  const updateBook = async (id, updatedData) => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (response.ok) {
        setBooks((prev) =>
          prev.map((book) =>
            book.id === id ? { ...book, ...updatedData } : book,
          ),
        );
      }
    } catch (err) {
      console.error("Ошибка обновления:", err);
    }
  };

  const deleteBook = async (id) => {
    if (!isAdmin) return;
    await fetch(`${API_URL}/books/${id}`, { method: "DELETE" });
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleStatus = async (id) => {
    const book = books.find((b) => b.id === id);
    const newStatus = book.status === "Доступна" ? "Выдана" : "Доступна";
    await updateBook(id, { ...book, status: newStatus });
  };

  const filteredBooks = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    let result = books.filter(
      (book) =>
        book.title?.toLowerCase().includes(lowerSearch) ||
        book.author?.toLowerCase().includes(lowerSearch) ||
        book.isbn?.includes(lowerSearch),
    );

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "date_asc":
          return a.id - b.id;
        case "date_desc":
          return b.id - a.id;
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "", "ru");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "", "ru");
        case "author_asc":
          return (a.author || "").localeCompare(b.author || "", "ru");
        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [books, searchTerm, statusFilter, sortOrder]);

  const returnBook = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/return-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchBooks();
      }
      return data;
    } catch (error) {
      console.error("Ошибка возврата книги:", error);
      return { success: false };
    }
  };

  return {
    books: filteredBooks,
    allBooksCount: books.length,
    users,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    currentUser,
    isAdmin,
    login,
    register,
    logout,
    addBook,
    deleteBook,
    toggleStatus,
    updateBook,
    issueBook,
    returnBook,
    loading,
    fetchBooks
  };
};
