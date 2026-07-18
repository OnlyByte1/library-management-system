/* Разрабочик: Прокопьев Артём Олегович @OnlyByte */

import { BASE_URL } from "../constants";

export const fetchBooksApi = async () => {
  const res = await fetch(`${BASE_URL}/books`);
  return res.json();
};

export const addBookApi = async (bookData) => {
  const res = await fetch(`${BASE_URL}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData),
  });
  return res.json();
};

export const updateBookApi = async (id, bookData) => {
  const res = await fetch(`${BASE_URL}/books/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData),
  });
  return res.json();
};

export const deleteBookApi = async (id) => {
  const res = await fetch(`${BASE_URL}/books/${id}`, { method: "DELETE" });
  return res.json();
};

export const issueBookApi = async (
  bookId,
  userId,
  issueDate,
  returnDate,
  quantity = 1,
) => {
  const res = await fetch(`${BASE_URL}/issue-book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, userId, issueDate, returnDate, quantity }),
  });
  return res.json();
};

export const returnBookApi = async (bookId) => {
  const res = await fetch(`${BASE_URL}/return-book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId }),
  });
  return res.json();
};

export const fetchIssuedBooksApi = async () => {
  const res = await fetch(`${BASE_URL}/issued-books`);
  return res.json();
};
