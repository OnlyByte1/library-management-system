import React, { useState, useEffect, useRef } from "react";
import "./UserMenu.css";

const UserMenu = ({ currentUser, isAdmin, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="btn-user-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="user-avatar-icon">👤</span>
        <span>{currentUser.full_name || currentUser.username}</span>
        <span className={`menu-arrow ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="dropdown-info">
            <strong>{currentUser.full_name}</strong>
            <span>{isAdmin ? "Администратор" : "Читатель"}</span>
          </div>

          <hr className="dropdown-divider" />

          {isAdmin ? (
            <>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("catalog");
                  setIsOpen(false);
                }}
              >
                🖼️ Каталог
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("admin_panel");
                  setIsOpen(false);
                }}
              >
                ⚙️ Книжный фонд (Управление)
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("issue");
                  setIsOpen(false);
                }}
              >
                📋 Выдача книг
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("return");
                  setIsOpen(false);
                }}
              >
                ↩️ Возврат книг
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("readers_management");
                  setIsOpen(false);
                }}
              >
                👥 Управление читателями
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigate("reports");
                  setIsOpen(false);
                }}
              >
                📊 Отчёты и аналитика
              </button>
            </>
          ) : (
            <button
              className="dropdown-item"
              onClick={() => {
                onNavigate("profile");
                setIsOpen(false);
              }}
            >
              📖 Мои книги
            </button>
          )}

          <hr className="dropdown-divider" />

          <button className="dropdown-item logout-action" onClick={onLogout}>
            <span className="exit-icon">🚪</span> Подтвердить выход
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
