'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Warehouse } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LANGS, useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace('/');
  }, [ready, user, router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.replace('/');
    } catch (err) {
      setError(t(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="row between">
        <div className="logo-mark">
          <Warehouse />
        </div>
        <div className="segmented" style={{ width: 'auto' }}>
          {LANGS.map((l) => (
            <button key={l.code} type="button" className={lang === l.code ? 'active' : ''} onClick={() => setLang(l.code)}>
              {l.short}
            </button>
          ))}
        </div>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 20 }}>{t('Zavod ombori')}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {t('Kirim, chiqim va qoldiqlar hisobi. Davom etish uchun tizimga kiring.')}
      </p>

      <form className="stack mt-24" onSubmit={submit}>
        <div className="field">
          <label>{t('Login')}</label>
          <input
            className="input"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('login')}
          />
        </div>
        <div className="field">
          <label>{t('Parol')}</label>
          <div className="input-group">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
            <button
              type="button"
              className="icon-btn plain"
              onClick={() => setShow((s) => !s)}
              aria-label={t('Parolni ko\'rsatish')}
              style={{ position: 'absolute', right: 4, top: 4 }}
            >
              {show ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>
        {error && (
          <div className="badge b-empty" style={{ height: 'auto', padding: '10px 12px', borderRadius: 12, whiteSpace: 'normal' }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block mt-8" disabled={loading || !username || !password}>
          {loading ? t('Kirilmoqda…') : t('Kirish')}
        </button>
      </form>
    </div>
  );
}
