// Sana, son va birliklarni formatlash. Til i18n.js orqali o'rnatiladi.

let LANG = 'uz';
export function setLang(l) {
  LANG = l || 'uz';
}
export function getLang() {
  return LANG;
}

const MONTHS_SHORT = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  kr: ['ян', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};

const MONTHS_FULL = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  kr: ['Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн', 'Июл', 'Август', 'Сентабр', 'Октабр', 'Ноябр', 'Декабр'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

const MONTHS_GEN = {
  uz: MONTHS_FULL.uz,
  kr: MONTHS_FULL.kr,
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

const WEEKDAYS = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  kr: ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const CURRENCY = { uz: "so'm", kr: 'сўм', ru: 'сум' };

// O'lchov birliklari faqat ko'rsatish uchun tarjima qilinadi (bazada asl holicha saqlanadi)
const UNIT_LABELS = {
  kr: { litr: 'литр', kg: 'кг', tonna: 'тонна', dona: 'дона', metr: 'метр', quti: 'қути', qop: 'қоп', rulon: 'рулон', komplekt: 'комплект', juft: 'жуфт', list: 'лист' },
  ru: { litr: 'литр', kg: 'кг', tonna: 'тонна', dona: 'шт', metr: 'метр', quti: 'коробка', qop: 'мешок', rulon: 'рулон', komplekt: 'комплект', juft: 'пара', list: 'лист' },
};

export function unitLabel(unit) {
  if (!unit) return '';
  const map = UNIT_LABELS[LANG];
  return (map && map[unit]) || unit;
}

export const UNITS = ['litr', 'kg', 'tonna', 'dona', 'metr', 'm²', 'm³', 'quti', 'qop', 'rulon', 'komplekt', 'juft', 'list'];

export const ROLE_KEYS = ['admin', 'omborchi', 'kuzatuvchi'];

// 12500.5 -> "12 500,5"
export function num(n, digits = 3) {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU', { maximumFractionDigits: digits }).replace(/ /g, ' ');
}

export function currency() {
  return CURRENCY[LANG] || CURRENCY.uz;
}

export function money(n) {
  return `${num(Math.round(Number(n) || 0), 0)} ${currency()}`;
}

// Qisqa: 1,2 mln
export function moneyShort(n) {
  const v = Number(n) || 0;
  const u = LANG === 'uz' ? ['mlrd', 'mln', 'ming'] : ['млрд', 'млн', 'минг'];
  if (LANG === 'ru') u[2] = 'тыс';
  if (Math.abs(v) >= 1e9) return `${num(v / 1e9, 1)} ${u[0]}`;
  if (Math.abs(v) >= 1e6) return `${num(v / 1e6, 1)} ${u[1]}`;
  if (Math.abs(v) >= 1e3) return `${num(v / 1e3, 0)} ${u[2]}`;
  return num(v, 0);
}

const pad = (n) => String(n).padStart(2, '0');

export function time(d) {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function dateShort(d) {
  const x = new Date(d);
  return `${x.getDate()}-${(MONTHS_SHORT[LANG] || MONTHS_SHORT.uz)[x.getMonth()]}`;
}

export function dateFull(d) {
  const x = new Date(d);
  const m = (MONTHS_GEN[LANG] || MONTHS_GEN.uz)[x.getMonth()];
  return LANG === 'ru' ? `${x.getDate()} ${m} ${x.getFullYear()}` : `${x.getDate()}-${m.toLowerCase()} ${x.getFullYear()}`;
}

export function dateTime(d) {
  return `${dateShort(d)}, ${time(d)}`;
}

// "Seshanba, 22-sentabr"
export function longDate(d = new Date()) {
  const x = new Date(d);
  const w = (WEEKDAYS[LANG] || WEEKDAYS.uz)[x.getDay()];
  const m = (MONTHS_GEN[LANG] || MONTHS_GEN.uz)[x.getMonth()];
  return LANG === 'ru' ? `${w}, ${x.getDate()} ${m}` : `${w}, ${x.getDate()}-${m.toLowerCase()}`;
}

// Guruh sarlavhasi uchun: Bugun / Kecha / sana. Tarjima qilinadigan kalit qaytaradi.
export function dayLabelKey(d) {
  const x = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(x);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return { key: 'Bugun' };
  if (diff === 1) return { key: 'Kecha' };
  return { text: dateFull(x) };
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

export function stockStatus(p) {
  if ((p.quantity || 0) <= 0) return 'empty';
  if (p.minQty > 0 && p.quantity <= p.minQty) return 'low';
  return 'ok';
}
