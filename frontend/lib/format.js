const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const MONTHS_FULL = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

// 12500.5 -> "12 500,5"
export function num(n, digits = 3) {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU', { maximumFractionDigits: digits }).replace(/ /g, ' ');
}

export function money(n) {
  return `${num(Math.round(Number(n) || 0), 0)} so'm`;
}

// Qisqa: 1.2 mln, 350 ming
export function moneyShort(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `${num(v / 1e9, 1)} mlrd`;
  if (Math.abs(v) >= 1e6) return `${num(v / 1e6, 1)} mln`;
  if (Math.abs(v) >= 1e3) return `${num(v / 1e3, 0)} ming`;
  return num(v, 0);
}

const pad = (n) => String(n).padStart(2, '0');

export function time(d) {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function dateShort(d) {
  const x = new Date(d);
  return `${x.getDate()}-${MONTHS[x.getMonth()]}`;
}

export function dateTime(d) {
  return `${dateShort(d)}, ${time(d)}`;
}

// Guruh sarlavhasi: Bugun / Kecha / 12-Sentabr 2026
export function dayLabel(d) {
  const x = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(x);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Kecha';
  const y = x.getFullYear() !== today.getFullYear() ? ` ${x.getFullYear()}` : '';
  return `${x.getDate()}-${MONTHS_FULL[x.getMonth()].toLowerCase()}${y}`;
}

export function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

// <input type="datetime-local"> uchun qiymat
export function toLocalInput(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

// <input type="date"> uchun qiymat
export function toDateInput(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function startOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function endOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export const UNITS = ['litr', 'kg', 'tonna', 'dona', 'metr', 'm²', 'm³', 'quti', 'qop', 'rulon', 'komplekt', 'juft', 'list'];

export const ROLES = {
  admin: 'Administrator',
  omborchi: 'Omborchi',
  kuzatuvchi: 'Kuzatuvchi',
};

export function stockStatus(p) {
  if ((p.quantity || 0) <= 0) return 'empty';
  if (p.minQty > 0 && p.quantity <= p.minQty) return 'low';
  return 'ok';
}

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

// "Seshanba, 22-sentabr"
export function longDate(d = new Date()) {
  const x = new Date(d);
  return `${WEEKDAYS[x.getDay()]}, ${x.getDate()}-${MONTHS_FULL[x.getMonth()].toLowerCase()}`;
}
