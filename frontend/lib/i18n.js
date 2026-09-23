'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setLang as setFormatLang } from './format';
import { DICT } from './dictionary';

export const LANGS = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'kr', label: 'Ўзбекча', short: 'КР' },
  { code: 'ru', label: 'Русский', short: 'RU' },
];

const STORAGE_KEY = 'ombor_lang';
const I18nContext = createContext({ lang: 'uz', setLang: () => {}, t: (s) => s });

// Kalit sifatida o'zbekcha (lotin) matn ishlatiladi.
// {n} kabi o'rinbosarlar vars orqali almashtiriladi.
function translate(lang, key, vars) {
  let out = (lang !== 'uz' && DICT[lang] && DICT[lang][key]) || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('uz');

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!saved) {
      const nav = (navigator.language || '').toLowerCase();
      saved = nav.startsWith('ru') ? 'ru' : 'uz';
    }
    setLangState(saved);
    setFormatLang(saved);
    document.documentElement.lang = saved === 'ru' ? 'ru' : 'uz';
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    setFormatLang(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    document.documentElement.lang = l === 'ru' ? 'ru' : 'uz';
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Qisqa yozuv: const t = useT();  t('Kirim')
export function useT() {
  return useContext(I18nContext).t;
}
