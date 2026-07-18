const express = require("express");
const cors = require("cors");
const db = require("./db");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/books", (req, res) => {
  const query = `
    SELECT
      b.*,
      (SELECT r.user_id FROM rentals r WHERE r.book_id = b.id AND r.actual_return_date IS NULL AND r.type = 'выдача' LIMIT 1) as current_reader_id,
      (SELECT r.issue_date FROM rentals r WHERE r.book_id = b.id AND r.actual_return_date IS NULL AND r.type = 'выдача' LIMIT 1) as issue_date,
      (SELECT r.return_date FROM rentals r WHERE r.book_id = b.id AND r.actual_return_date IS NULL AND r.type = 'выдача' LIMIT 1) as return_date
    FROM books b
    ORDER BY b.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/books", (req, res) => {
  const { title, author, isbn, coverUrl, description, quantity } = req.body;
  const qty = parseInt(quantity) || 1;
  const query = `INSERT INTO books (title, author, isbn, coverUrl, description, status, quantity) VALUES (?, ?, ?, ?, ?, 'Доступна', ?)`;

  db.run(
    query,
    [title, author, isbn, coverUrl, description, qty],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        "INSERT INTO rentals (book_id, type, issue_date) VALUES (?, 'поступление', ?)",
        [this.lastID, new Date().toISOString().split("T")[0]],
      );
      res.json({
        id: this.lastID,
        ...req.body,
        quantity: qty,
        status: "Доступна",
      });
    },
  );
});

app.put("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, coverUrl, description, status, quantity } =
    req.body;

  let setParts = [
    "title = ?",
    "author = ?",
    "isbn = ?",
    "coverUrl = ?",
    "description = ?",
  ];
  let params = [title, author, isbn, coverUrl, description];

  if (status !== undefined) {
    setParts.push("status = ?");
    params.push(status);
  }
  if (quantity !== undefined) {
    setParts.push("quantity = ?");
    params.push(parseInt(quantity) || 1);
  }

  params.push(id);
  db.run(
    `UPDATE books SET ${setParts.join(", ")} WHERE id = ?`,
    params,
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Книга не найдена" });
      res.json({ success: true });
    },
  );
});

app.delete("/api/books/:id", (req, res) => {
  db.run("DELETE FROM books WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/api/return-book", (req, res) => {
  const { bookId } = req.body;
  db.get(
    "SELECT id FROM rentals WHERE book_id = ? AND actual_return_date IS NULL AND type = 'выдача' LIMIT 1",
    [bookId],
    (err, rental) => {
      if (err || !rental)
        return res.status(404).json({ error: "Запись выдачи не найдена" });
      db.run(
        "UPDATE rentals SET actual_return_date = ? WHERE id = ?",
        [new Date().toISOString().split("T")[0], rental.id],
        function (err) {
          if (err)
            return res.status(500).json({ error: "Ошибка обновления rentals" });
          db.run(
            "UPDATE books SET quantity = quantity + 1, status = 'Доступна' WHERE id = ?",
            [bookId],
            function (err) {
              if (err)
                return res
                  .status(500)
                  .json({ error: "Ошибка обновления статуса" });
              res.json({ success: true });
            },
          );
        },
      );
    },
  );
});

app.get("/api/issued-books", (req, res) => {
  const query = `
    SELECT
      r.id as rental_id,
      b.id as book_id,
      b.title,
      b.author,
      b.coverUrl,
      b.quantity,
      r.issue_date,
      r.return_date,
      u.id as user_id,
      u.full_name as reader_name,
      u.username as reader_username
    FROM rentals r
    JOIN books b ON r.book_id = b.id
    JOIN users u ON r.user_id = u.id
    WHERE r.actual_return_date IS NULL AND r.type = 'выдача'
    ORDER BY r.return_date ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/issue-book", (req, res) => {
  const { bookId, userId, issueDate, returnDate, quantity } = req.body;
  const qty = parseInt(quantity) || 1;

  db.get(
    "SELECT quantity, status FROM books WHERE id = ?",
    [bookId],
    (err, book) => {
      if (err || !book)
        return res
          .status(404)
          .json({ success: false, error: "Книга не найдена" });
      if (book.quantity < qty)
        return res
          .status(400)
          .json({ success: false, error: "Нет доступных экземпляров" });

      let inserted = 0;
      let hasError = false;

      const insertNext = () => {
        if (inserted >= qty) {
          const newQty = book.quantity - qty;
          const newStatus = newQty === 0 ? "Выдана" : "Доступна";
          db.run(
            "UPDATE books SET quantity = ?, status = ? WHERE id = ?",
            [newQty, newStatus, bookId],
            function (err) {
              if (err)
                return res
                  .status(500)
                  .json({ success: false, error: "Ошибка обновления статуса" });
              res.json({ success: true, quantity: newQty, status: newStatus });
            },
          );
          return;
        }
        db.run(
          "INSERT INTO rentals (book_id, user_id, issue_date, return_date, type) VALUES (?, ?, ?, ?, 'выдача')",
          [bookId, userId, issueDate, returnDate],
          function (err) {
            if (err) {
              if (!hasError) {
                hasError = true;
                return res
                  .status(500)
                  .json({ success: false, error: "Ошибка записи выдачи" });
              }
              return;
            }
            inserted++;
            insertNext();
          },
        );
      };
      insertNext();
    },
  );
});

app.put("/api/rentals/:id/extend", (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT id, return_date FROM rentals WHERE id = ? AND actual_return_date IS NULL AND type = 'выдача'",
    [id],
    (err, rental) => {
      if (err || !rental)
        return res
          .status(404)
          .json({ success: false, error: "Аренда не найдена" });

      const currentDate = new Date(rental.return_date);
      const today = new Date();
      const base = currentDate < today ? today : currentDate;
      base.setDate(base.getDate() + 14);
      const newReturnDate = base.toISOString().split("T")[0];

      db.run(
        "UPDATE rentals SET return_date = ? WHERE id = ?",
        [newReturnDate, id],
        function (err) {
          if (err)
            return res
              .status(500)
              .json({ success: false, error: "Ошибка продления" });
          res.json({ success: true, newReturnDate });
        },
      );
    },
  );
});

app.post("/api/register", (req, res) => {
  const { full_name, username, password } = req.body;
  const today = new Date().toISOString().split("T")[0];
  db.run(
    "INSERT INTO users (full_name, username, password, role_id, created_at) VALUES (?, ?, ?, 2, ?)",
    [full_name, username, password, today],
    function (err) {
      if (err)
        return res
          .status(400)
          .json({ error: "Логин уже занят или данные неверны" });
      res.json({ success: true, id: this.lastID });
    },
  );
});

app.post("/api/login", (req, res) => {
  db.get(
    "SELECT * FROM users WHERE username = ?",
    [req.body.username],
    (err, user) => {
      if (err || !user || user.password !== req.body.password) {
        return res
          .status(401)
          .json({ success: false, message: "Неверные данные" });
      }
      if (user.blocked) {
        return res
          .status(403)
          .json({ success: false, message: "Аккаунт заблокирован" });
      }
      res.json({
        success: true,
        role: user.role_id,
        userId: user.id,
        fullName: user.full_name,
      });
    },
  );
});

app.get("/api/user-books/:userId", (req, res) => {
  const query = `
    SELECT r.id as rental_id, b.title, b.author, b.coverUrl, r.issue_date, r.return_date
    FROM rentals r
    JOIN books b ON r.book_id = b.id
    WHERE r.user_id = ? AND r.actual_return_date IS NULL AND r.type = 'выдача'
  `;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/user-history/:userId", (req, res) => {
  const query = `
    SELECT
      r.id as rental_id,
      b.title,
      b.author,
      r.issue_date,
      r.return_date,
      r.actual_return_date
    FROM rentals r
    JOIN books b ON r.book_id = b.id
    WHERE r.user_id = ? AND r.type = 'выдача'
    ORDER BY r.issue_date DESC
  `;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/readers", (req, res) => {
  db.all(
    "SELECT id, full_name, username, rating, blocked FROM users WHERE role_id = 2",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.get("/api/readers-full", (req, res) => {
  db.all("PRAGMA table_info(users)", [], (schemaErr, columns) => {
    if (schemaErr) return res.status(500).json({ error: schemaErr.message });
    const hasCreatedAt = Array.isArray(columns) && columns.some((col) => col.name === "created_at");

    const query = `
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.rating,
        u.blocked,
        ${hasCreatedAt ? "u.created_at" : "'' AS created_at"},
        (SELECT COUNT(*) FROM rentals r WHERE r.user_id = u.id AND r.actual_return_date IS NULL AND r.type = 'выдача') as books_count,
        (SELECT COUNT(*) FROM rentals r WHERE r.user_id = u.id AND r.actual_return_date IS NULL AND r.type = 'выдача' AND r.return_date < date('now')) as overdue_count,
        (SELECT COUNT(*) FROM reservations rs WHERE rs.user_id = u.id AND (rs.status = 'active' OR rs.status IS NULL)) as reservation_count
      FROM users u
      WHERE u.role_id = 2
      ORDER BY u.full_name ASC
    `;

    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT role_id FROM users WHERE id = ?", [id], (err, user) => {
    if (err || !user)
      return res.status(404).json({ error: "Пользователь не найден" });
    if (user.role_id === 1)
      return res.status(403).json({ error: "Нельзя удалить администратора" });
    db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.put("/api/users/:id/block", (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT blocked, role_id FROM users WHERE id = ?",
    [id],
    (err, user) => {
      if (err || !user)
        return res.status(404).json({ error: "Пользователь не найден" });
      if (user.role_id === 1)
        return res
          .status(403)
          .json({ error: "Нельзя заблокировать администратора" });
      const newBlocked = user.blocked ? 0 : 1;
      db.run(
        "UPDATE users SET blocked = ? WHERE id = ?",
        [newBlocked, id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, blocked: newBlocked });
        },
      );
    },
  );
});

app.post("/api/reserve-book", (req, res) => {
  const { bookId, userId } = req.body;

  db.get("SELECT quantity FROM books WHERE id = ?", [bookId], (err, book) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!book || book.quantity <= 0) {
      return res.status(400).json({ error: "Нет доступных экземпляров" });
    }

    db.run(
      "INSERT INTO reservations (book_id, user_id, status) VALUES (?, ?, 'active')",
      [bookId, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const reservationId = this.lastID;

        db.run(
          "UPDATE books SET quantity = quantity - 1 WHERE id = ?",
          [bookId],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            db.run(
              "UPDATE books SET status = 'Забронирована' WHERE id = ? AND quantity = 0",
              [bookId]
            );

            res.json({ success: true, id: reservationId });
          }
        );
      }
    );
  });
});

app.get("/api/user-reservations/:userId", (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT r.id, r.reserved_at, b.title, b.author, r.status
    FROM reservations r
    JOIN books b ON r.book_id = b.id
    WHERE r.user_id = ? AND (r.status = 'active' OR r.status IS NULL)
    ORDER BY r.reserved_at DESC
  `;
  db.all(query, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put("/api/reservations/:id/cancel", (req, res) => {
  const { id } = req.params;

  db.get("SELECT book_id FROM reservations WHERE id = ? AND status = 'active'", [id], (err, row) => {
    if (!row) return res.status(404).json({ error: "Активная бронь не найдена" });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.run("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [id]);

      db.run("UPDATE books SET quantity = quantity + 1, status = 'Доступна' WHERE id = ?", [row.book_id]);

      db.run("COMMIT", (err) => {
        if (err) return res.status(500).json({ error: "Ошибка при отмене" });
        res.json({ success: true });
      });
    });
  });
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { full_name, rating } = req.body;
  db.run(
    "UPDATE users SET full_name = ?, rating = ? WHERE id = ?",
    [full_name, parseInt(rating) || 100, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    },
  );
});


app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 3) {
    return res
      .status(400)
      .json({ error: "Пароль должен содержать минимум 3 символа" });
  }
  db.run(
    "UPDATE users SET password = ? WHERE id = ?",
    [newPassword.trim(), id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Пользователь не найден" });
      res.json({ success: true });
    },
  );
});

app.get("/api/reports", (req, res) => {
  const { start, end } = req.query;
  const query = `
    SELECT
      r.id,
      r.type,
      b.title as book_title,
      b.author as book_author,
      u.full_name as reader_name,
      u.username as reader_username,
      r.issue_date,
      r.return_date,
      r.actual_return_date
    FROM rentals r
    LEFT JOIN books b ON r.book_id = b.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.issue_date BETWEEN ? AND ?
    ORDER BY r.issue_date DESC
  `;
  db.all(query, [start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/reports-all", (req, res) => {
  const query = `
    SELECT
      r.id,
      r.type,
      b.title as book_title,
      b.author as book_author,
      u.full_name as reader_name,
      u.username as reader_username,
      r.issue_date,
      r.return_date,
      r.actual_return_date
    FROM rentals r
    LEFT JOIN books b ON r.book_id = b.id
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.issue_date DESC
    LIMIT 200
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
