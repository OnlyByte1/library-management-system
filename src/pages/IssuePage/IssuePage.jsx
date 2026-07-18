import React, { useState } from 'react';
import { isOverdue, formatDate } from '../../utils/dateUtils.js';
import './issuePage.css';

const IssuePage = ({ users, books, issuedBooks = [], issueBook, showToast }) => {
    const [issueForm, setIssueForm] = useState({
        userId: '',
        bookId: '',
        issueDate: new Date().toISOString().split('T')[0],
        returnDate: '',
        quantity: 1,
    });
    const [readerSearch, setReaderSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleIssue = async (e) => {
        e.preventDefault();

        const foundUser = users.find(u => u.username === issueForm.userId);
        const foundBook = books.find(b => b.title === issueForm.bookId);
        const qty = parseInt(issueForm.quantity) || 1;

        if (!foundUser || !foundBook) {
            showToast('⚠️ Выберите пользователя и книгу из списка', 'error');
            return;
        }

        if (foundBook.quantity < qty) {
            showToast(`❌ Доступно только ${foundBook.quantity} экз.`, 'error');
            return;
        }

        setIsSubmitting(true);

        const res = await issueBook(
            foundBook.id,
            foundUser.id,
            issueForm.issueDate,
            issueForm.returnDate,
            qty
        );

        setIsSubmitting(false);

        if (res.success) {
            showToast(`✅ ${qty > 1 ? `${qty} экз. книги` : 'Книга'} «${foundBook.title}» выдана ${foundUser.username}`);
            setIssueForm({ ...issueForm, userId: '', bookId: '', returnDate: '', quantity: 1 });
        } else {
            showToast('❌ Ошибка при выдаче книги', 'error');
        }
    };

    const filteredUsers = Array.isArray(users)
        ? users.filter(u =>
            u.full_name.toLowerCase().includes(readerSearch.toLowerCase()) ||
            u.username.toLowerCase().includes(readerSearch.toLowerCase())
        )
        : [];

    const selectedBook = books.find(b => b.title === issueForm.bookId);
    const qty = parseInt(issueForm.quantity) || 1;
    const availableQty = selectedBook?.quantity ?? 0;
    const qtyExceeds = selectedBook && qty > availableQty;

    return (
        <div className="issue-page-container">
            <div className="issue-left-panel">
                <h3>📖 Выдача книги</h3>
                <form onSubmit={handleIssue}>
                    <div className="form-group">
                        <label>Выберите пользователя</label>
                        <input
                            type="text"
                            placeholder="Начните вводить никнейм..."
                            value={issueForm.userId}
                            list="readers-list"
                            autoComplete="off"
                            onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
                        />
                        <datalist id="readers-list">
                            {users.map((u) => (
                                <option key={u.id} value={u.username}>
                                    {u.full_name} (ID: {u.id})
                                </option>
                            ))}
                        </datalist>
                    </div>

                    <div className="form-group">
                        <label>Выберите книгу</label>
                        <input
                            type="text"
                            placeholder="Начните вводить название книги..."
                            value={issueForm.bookId}
                            list="books-list"
                            autoComplete="off"
                            onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                        />
                        <datalist id="books-list">
                            {books.filter(b => b.quantity > 0).map((b) => (
                                <option key={b.id} value={b.title}>
                                    {b.author} — доступно: {b.quantity} экз.
                                </option>
                            ))}
                        </datalist>
                        {selectedBook && (
                            <div className={`book-qty-hint ${qtyExceeds ? 'hint-error' : 'hint-ok'}`}>
                                {qtyExceeds
                                    ? `❌ Превышено: доступно ${availableQty} экз.`
                                    : `✓ В наличии: ${availableQty} экз.`}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Количество экземпляров</label>
                        <div className="issue-qty-control">
                            <button
                                type="button"
                                className="issue-qty-btn"
                                onClick={() => setIssueForm({ ...issueForm, quantity: Math.max(1, qty - 1) })}
                            >−</button>
                            <input
                                type="number"
                                className="issue-qty-input"
                                min="1"
                                max={availableQty || 99}
                                value={qty}
                                onChange={e => setIssueForm({ ...issueForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            />
                            <button
                                type="button"
                                className="issue-qty-btn"
                                onClick={() => setIssueForm({ ...issueForm, quantity: qty + 1 })}
                            >+</button>
                        </div>
                    </div>

                    <div className="date-row">
                        <div className="form-group">
                            <label>Дата выдачи</label>
                            <input
                                type="date"
                                value={issueForm.issueDate}
                                onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Дата возврата</label>
                            <input
                                type="date"
                                value={issueForm.returnDate}
                                min={issueForm.issueDate}
                                onChange={(e) => setIssueForm({ ...issueForm, returnDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-issue-confirm"
                        disabled={isSubmitting || qtyExceeds}
                        style={{ opacity: (isSubmitting || qtyExceeds) ? 0.6 : 1 }}
                    >
                        {isSubmitting
                            ? 'Выдача...'
                            : qty > 1
                                ? `Выдать ${qty} экз.`
                                : 'Зафиксировать выдачу'}
                    </button>
                </form>
            </div>

            <div className="issue-right-panel">
                <h3>👥 Активные читатели</h3>

                <div className="readers-search">
                    <input
                        type="text"
                        placeholder="🔍 Поиск по имени или никнейму..."
                        value={readerSearch}
                        onChange={(e) => setReaderSearch(e.target.value)}
                    />
                </div>

                <div className="readers-list">
                    {filteredUsers.length === 0 ? (
                        <p className="empty-list">Читатели не найдены</p>
                    ) : filteredUsers.map(user => {
                        const userRentals = issuedBooks.filter(i => i.user_id === user.id);

                        const grouped = userRentals.reduce((acc, i) => {
                            const key = `${i.book_id}_${i.return_date}`;
                            if (!acc[key]) acc[key] = { ...i, count: 0 };
                            acc[key].count++;
                            return acc;
                        }, {});
                        const groupedBooks = Object.values(grouped);
                        const totalCount = userRentals.length;

                        return (
                            <div key={user.id} className="reader-card">
                                <div className="reader-info">
                                    <strong>{user.full_name}</strong>
                                    <span>@{user.username}</span>
                                    {totalCount > 0 && (
                                        <span className="reader-book-count">{totalCount} кн.</span>
                                    )}
                                </div>
                                <div className="reader-books">
                                    <ul>
                                        {groupedBooks.length > 0
                                            ? groupedBooks.map(b => {
                                                const overdue = isOverdue(b.return_date);
                                                return (
                                                    <li key={`${b.book_id}_${b.return_date}`} style={{ borderColor: overdue ? 'rgba(239, 68, 68, 0.5)' : 'rgba(37, 99, 235, 0.2)' }}>
                                                        <span className="book-title">
                                                            📙 {b.title}
                                                            {b.count > 1 && (
                                                                <span className="book-count-badge">{b.count} экз.</span>
                                                            )}
                                                        </span>
                                                        <div className="book-dates">
                                                            <span>Выдана: {formatDate(b.issue_date)}</span>
                                                            <span style={{ color: overdue ? '#ef4444' : '#f97316' }}>
                                                                {overdue ? '⚠️ Просрочена!' : `Вернуть до: ${formatDate(b.return_date)}`}
                                                            </span>
                                                        </div>
                                                    </li>
                                                );
                                            })
                                            : <li className="empty-list">Нет книг на руках</li>
                                        }
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default IssuePage;