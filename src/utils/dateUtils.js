/* Разрабочик: Прокопьев Артём Олегович @OnlyByte */

/**
 * Форматирует дату в локальный формат ru-RU
 * @param {string|null} d
 * @returns {string}
 */
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : '—';

/**
 * Проверяет, просрочена ли дата возврата
 * @param {string|null} returnDate
 * @returns {boolean}
 */
export const isOverdue = (returnDate) =>
  returnDate && new Date(returnDate + 'T23:59:59') < new Date();

/**
 * Возвращает количество дней до даты возврата (отрицательное — просрочено)
 * @param {string|null} returnDate
 * @returns {number|null}
 */
export const daysLeft = (returnDate) =>
  returnDate
    ? Math.ceil((new Date(returnDate) - new Date()) / 86400000)
    : null;
