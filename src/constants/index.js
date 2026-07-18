/* Разрабочик: Прокопьев Артём Олегович @OnlyByte */

export const BASE_URL = 'http://localhost:5000/api';

export const BOOK_STATUS = {
  AVAILABLE: 'Доступна',
  ISSUED: 'Выдана',
};

export const USER_ROLE = {
  ADMIN: 1,
  READER: 2,
};

export const SORT_OPTIONS = [
  { value: 'date_desc',  label: 'Сначала новые' },
  { value: 'date_asc',   label: 'Сначала старые' },
  { value: 'title_asc',  label: 'По названию А–Я' },
  { value: 'title_desc', label: 'По названию Я–А' },
  { value: 'author_asc', label: 'По автору А–Я' },
];

export const STATUS_FILTERS = ['all', BOOK_STATUS.AVAILABLE, BOOK_STATUS.ISSUED];
