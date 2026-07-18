const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./library.db");

db.serialize(() => {
  // 1. Справочник ролей
  db.run(
    "CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, name TEXT)",
  );
  db.run(
    "INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin'), (2, 'reader')",
  );

  // 2. Единая таблица пользователей
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER DEFAULT 2,
    rating INTEGER DEFAULT 100,
    FOREIGN KEY(role_id) REFERENCES roles(id)
  )`);

  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, role_id)
          VALUES ('admin', '123', 'Главный Библиотекарь', 1)`);

  // Добавить тестовых читателей
  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, role_id, rating, blocked)
          VALUES ('reader1', '123', 'Иван Иванов', 2, 95, 0)`);
  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, role_id, rating, blocked)
          VALUES ('reader2', '123', 'Мария Петрова', 2, 100, 0)`);
  db.run(`INSERT OR IGNORE INTO users (username, password, full_name, role_id, rating, blocked)
          VALUES ('reader3', '123', 'Алексей Сидоров', 2, 90, 0)`);

  db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) return;
    const hasBlocked = columns.some((col) => col.name === 'blocked');
    const hasCreatedAt = columns.some((col) => col.name === 'created_at');

    if (!hasBlocked) {
      db.run("ALTER TABLE users ADD COLUMN blocked INTEGER DEFAULT 0", () => {});
    }

    const updateCreatedAt = () => {
      db.run(
        "UPDATE users SET created_at = date('now') WHERE created_at IS NULL OR created_at = ''",
        () => {},
      );
    };

    if (!hasCreatedAt) {
      db.run("ALTER TABLE users ADD COLUMN created_at TEXT", (alterErr) => {
        if (!alterErr) {
          updateCreatedAt();
        }
      });
    } else {
      updateCreatedAt();
    }
  });

  // 3. Таблица книг
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    coverUrl TEXT,
    description TEXT,
    status TEXT DEFAULT 'Доступна',
    quantity INTEGER DEFAULT 1
  )`);

  // 4. Таблица аренды (Движение книг)
  db.run(`CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    user_id INTEGER,
    issue_date TEXT,
    return_date TEXT,
    actual_return_date TEXT,
    type TEXT,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run("ALTER TABLE rentals ADD COLUMN quantity INTEGER DEFAULT 1", () => {});

  // 5. Таблица бронирований
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    reserved_at TEXT DEFAULT (date('now')),
    status TEXT DEFAULT 'active',
    FOREIGN KEY(book_id) REFERENCES books(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

console.log("База данных SQLite успешно инициализирована");
module.exports = db;
