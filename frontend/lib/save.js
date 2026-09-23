'use client';

import { XLSX_MIME } from './xlsx';

// Faylni telefon/kompyuterga saqlash
export function downloadFile(name, data, mime = XLSX_MIME) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function canShareFiles(name, data, mime = XLSX_MIME) {
  try {
    if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false;
    const file = new File([data], name, { type: mime });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

// Ulashish oynasi (iPhone'da Telegram, pochta, "Fayllarga saqlash" va h.k.)
// Muhim: bu funksiya foydalanuvchi bosgan zahoti chaqirilishi kerak.
export async function shareFile(name, data, mime = XLSX_MIME, title) {
  const file = new File([data], name, { type: mime });
  await navigator.share({ files: [file], title: title || name });
}
