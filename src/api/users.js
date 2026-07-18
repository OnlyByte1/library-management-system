/* Разрабочик: Прокопьев Артём Олегович @OnlyByte */

import { BASE_URL } from "../constants";

export const loginApi = async (username, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const registerApi = async (full_name, username, password) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, username, password }),
  });
  return res.json();
};

export const fetchReadersApi = async () => {
  const res = await fetch(`${BASE_URL}/readers`);
  return res.json();
};

export const fetchReadersFullApi = async () => {
  const res = await fetch(`${BASE_URL}/readers-full`);
  return res.json();
};

export const fetchUserBooksApi = async (userId) => {
  const res = await fetch(`${BASE_URL}/user-books/${userId}`);
  return res.json();
};

export const fetchUserHistoryApi = async (userId) => {
  const res = await fetch(`${BASE_URL}/user-history/${userId}`);
  return res.json();
};

export const extendRentalApi = async (rentalId) => {
  const res = await fetch(`${BASE_URL}/rentals/${rentalId}/extend`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const reserveBookApi = async (bookId, userId) => {
  const res = await fetch(`${BASE_URL}/reserve-book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, userId }),
  });
  return res.json();
};

export const fetchUserReservationsApi = async (userId) => {
  const res = await fetch(`${BASE_URL}/user-reservations/${userId}`);
  return res.json();
};

export const cancelReservationApi = async (reservationId) => {
  const res = await fetch(`${BASE_URL}/reservations/${reservationId}/cancel`, {
    method: "PUT",
  });
  return res.json();
};

export const deleteUserApi = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, { method: "DELETE" });
  return res.json();
};

export const blockUserApi = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/block`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
};

export const updateUserApi = async (userId, data) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const changePasswordApi = async (userId, newPassword) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  return res.json();
};

export const fetchReportsApi = async (start, end) => {
  const url =
    start && end
      ? `${BASE_URL}/reports?start=${start}&end=${end}`
      : `${BASE_URL}/reports-all`;
  const res = await fetch(url);
  return res.json();
};
