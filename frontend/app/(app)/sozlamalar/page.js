'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, KeyRound, LogOut, Tags, Tractor, Users } from 'lucide-react';
import { TopBar, Sheet, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ROLES } from '@/lib/format';

function MenuItem({ href, icon: Icon, color, title, sub, onClick }) {
  const inner = (
    <>
      <div className="avatar" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
        <Icon />
      </div>
      <div className="grow">
        <div className="title">{title}</div>
        {sub && <div className="meta">{sub}</div>}
      </div>
      <ChevronRight size={20} style={{ color: 'var(--text-3)' }} />
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
  const router = useRouter();
  const toast = useToast();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  async function changePw(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/password', pw);
      toast("Parol o'zgartirildi");
      setPwOpen(false);
      setPw({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Sozlamalar" back="/" />
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

        <div className="section-title">Ma'lumotnomalar</div>
        <div className="list">
          <MenuItem href="/sozlamalar/kategoriyalar" icon={Tags} color="#8b5cf6" title="Kategoriyalar" sub="Yoqilg'i, metall, moylar…" />
          <MenuItem href="/sozlamalar/bolimlar" icon={Building2} color="#0ea5e9" title="Bo'limlar va sexlar" sub="Chiqim qayerga ketadi" />
          <MenuItem href="/sozlamalar/texnika" icon={Tractor} color="#f59e0b" title="Texnika va mashinalar" sub="Yoqilg'i va ehtiyot qism uchun" />
        </div>

        {can('admin') && (
          <>
            <div className="section-title">Boshqaruv</div>
            <div className="list">
              <MenuItem href="/sozlamalar/foydalanuvchilar" icon={Users} color="#10b981" title="Foydalanuvchilar" sub="Omborchilar va ruxsatlar" />
            </div>
          </>
        )}

        <div className="section-title">Hisob</div>
        <div className="list">
          <MenuItem icon={KeyRound} color="#64748b" title="Parolni o'zgartirish" onClick={() => setPwOpen(true)} />
          <MenuItem
            icon={LogOut}
            color="#ef4444"
            title="Chiqish"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
          />
        </div>
        <p className="xs faint mt-24" style={{ textAlign: 'center' }}>
          Zavod ombori · v1.0
        </p>
      </div>

      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="Parolni o'zgartirish">
        <form className="stack" onSubmit={changePw}>
          <div className="field">
            <label>Joriy parol</label>
            <input className="input" type="password" value={pw.oldPassword} onChange={(e) => setPw((x) => ({ ...x, oldPassword: e.target.value }))} />
          </div>
          <div className="field">
            <label>Yangi parol</label>
            <input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw((x) => ({ ...x, newPassword: e.target.value }))} />
            <span className="hint">Kamida 6 belgi</span>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving}>
            Saqlash
          </button>
        </form>
      </Sheet>
    </>
  );
}
