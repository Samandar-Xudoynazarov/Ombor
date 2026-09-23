'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, KeyRound, Languages, LogOut, Tags, Tractor, Users } from 'lucide-react';
import { TopBar, Sheet, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LANGS, useI18n } from '@/lib/i18n';

function MenuItem({ href, icon: Icon, color, title, sub, onClick, end }) {
  const inner = (
    <>
      <div className="avatar" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
        <Icon />
      </div>
      <div className="grow">
        <div className="title">{title}</div>
        {sub && <div className="meta">{sub}</div>}
      </div>
      {end || <ChevronRight size={20} style={{ color: 'var(--text-3)' }} />}
    </>
  );
  return href ? (
    <Link href={href} className="list-item">
      {inner}
    </Link>
  ) : (
    <button className="list-item" onClick={onClick}>
      {inner}
    </button>
  );
}

export default function Sozlamalar() {
  const { user, logout, can } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [pwOpen, setPwOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const ROLES = { admin: t('Administrator'), omborchi: t('Omborchi'), kuzatuvchi: t('Kuzatuvchi') };

  async function changePw(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/password', pw);
      toast(t("Parol o'zgartirildi"));
      setPwOpen(false);
      setPw({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast(t(err.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title={t('Sozlamalar')} back="/" />
      <div className="page">
        <div className="card card-pad row">
          <div className="avatar" style={{ background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 18 }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="grow">
            <div className="bold">{user.name}</div>
            <div className="small muted">
              @{user.username} · {ROLES[user.role]}
            </div>
          </div>
        </div>

        <div className="section-title">{t("Ma'lumotnomalar")}</div>
        <div className="list">
          <MenuItem
            href="/sozlamalar/kategoriyalar"
            icon={Tags}
            color="#8b5cf6"
            title={t('Kategoriyalar')}
            sub={t("Yoqilg'i, metall, moylar…")}
          />
          <MenuItem
            href="/sozlamalar/bolimlar"
            icon={Building2}
            color="#0ea5e9"
            title={t("Bo'limlar va sexlar")}
            sub={t('Chiqim qayerga ketadi')}
          />
          <MenuItem
            href="/sozlamalar/texnika"
            icon={Tractor}
            color="#f59e0b"
            title={t('Texnika va mashinalar')}
            sub={t("Yoqilg'i va ehtiyot qism uchun")}
          />
        </div>

        {can('admin') && (
          <>
            <div className="section-title">{t('Boshqaruv')}</div>
            <div className="list">
              <MenuItem
                href="/sozlamalar/foydalanuvchilar"
                icon={Users}
                color="#10b981"
                title={t('Foydalanuvchilar')}
                sub={t('Omborchilar va ruxsatlar')}
              />
            </div>
          </>
        )}

        <div className="section-title">{t('Hisob')}</div>
        <div className="list">
          <MenuItem
            icon={Languages}
            color="#2563eb"
            title={t('Til')}
            onClick={() => setLangOpen(true)}
            end={
              <span className="row" style={{ gap: 6, color: 'var(--text-2)' }}>
                {LANGS.find((l) => l.code === lang)?.label}
                <ChevronRight size={20} style={{ color: 'var(--text-3)' }} />
              </span>
            }
          />
          <MenuItem icon={KeyRound} color="#64748b" title={t("Parolni o'zgartirish")} onClick={() => setPwOpen(true)} />
          <MenuItem
            icon={LogOut}
            color="#ef4444"
            title={t('Chiqish')}
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          />
        </div>
        <p className="xs faint mt-24" style={{ textAlign: 'center' }}>
          {t('Zavod ombori')} · v1.1
        </p>
      </div>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title={t('Til')}>
        <div className="stack" style={{ gap: 8 }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              className="action-tile"
              style={lang === l.code ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
              onClick={() => {
                setLang(l.code);
                setLangOpen(false);
              }}
            >
              <div className="avatar" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', fontWeight: 700 }}>
                {l.short}
              </div>
              <div className="grow bold">{l.label}</div>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title={t("Parolni o'zgartirish")}>
        <form className="stack" onSubmit={changePw}>
          <div className="field">
            <label>{t('Joriy parol')}</label>
            <input
              className="input"
              type="password"
              value={pw.oldPassword}
              onChange={(e) => setPw((x) => ({ ...x, oldPassword: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>{t('Yangi parol')}</label>
            <input
              className="input"
              type="password"
              value={pw.newPassword}
              onChange={(e) => setPw((x) => ({ ...x, newPassword: e.target.value }))}
            />
            <span className="hint">{t('Kamida 6 belgi')}</span>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving}>
            {t('Saqlash')}
          </button>
        </form>
      </Sheet>
    </>
  );
}
