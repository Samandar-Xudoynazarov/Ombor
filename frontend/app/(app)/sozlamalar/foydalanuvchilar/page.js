'use client';

import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { TopBar, Empty, ErrorBox, ListSkeleton, Sheet, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ROLES } from '@/lib/format';

const ROLE_HINT = {
  admin: "Hamma narsa: foydalanuvchilar, o'chirish, bekor qilish",
  omborchi: 'Kirim, chiqim, mahsulot va kategoriya qo\'shish',
  kuzatuvchi: "Faqat ko'rish va hisobotlar",
};

export default function Foydalanuvchilar() {
  const { user: me, can } = useAuth();
  const { data, loading, error, reload } = useApi('/users', null, { skip: !can('admin') });
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);

  function openForm(u) {
    setEdit(u || {});
    setF(u ? { name: u.name, username: u.username, role: u.role, active: u.active, password: '' } : { name: '', username: '', role: 'omborchi', active: true, password: '' });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit._id) {
        const body = { name: f.name, role: f.role, active: f.active };
        if (f.password) body.password = f.password;
        await api.put(`/users/${edit._id}`, body);
      } else {
        await api.post('/users', f);
      }
      toast('Saqlandi');
      setEdit(null);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`${edit.name} o'chirilsinmi?`)) return;
    try {
      await api.del(`/users/${edit._id}`);
      toast("O'chirildi");
      setEdit(null);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (!can('admin')) {
    return (
      <>
        <TopBar title="Foydalanuvchilar" back="/sozlamalar" />
        <div className="page">
          <Empty icon={Users} title="Ruxsat yo'q" text="Bu bo'lim faqat administrator uchun" />
        </div>
      </>
    );
  }

  const isSelf = edit?._id && edit._id === me.id;

  return (
    <>
      <TopBar
        title="Foydalanuvchilar"
        back="/sozlamalar"
        right={
          <button className="icon-btn" onClick={() => openForm(null)} aria-label="Qo'shish">
            <Plus />
          </button>
        }
      />
      <div className="page">
        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <ListSkeleton />
        ) : (
          <div className="list">
            {data.map((u) => (
              <button key={u._id} className="list-item" onClick={() => openForm(u)} style={{ opacity: u.active ? 1 : 0.55 }}>
                <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 700 }}>
                  {u.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="grow">
                  <div className="title ellipsis">
                    {u.name} {u._id === me.id && <span className="faint small">(siz)</span>}
                  </div>
                  <div className="meta">@{u.username}</div>
                </div>
                <span className={`badge ${u.active ? 'b-neutral' : 'b-empty'}`}>{u.active ? ROLES[u.role] : 'Bloklangan'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Foydalanuvchi' : 'Yangi foydalanuvchi'}>
        <form className="stack" onSubmit={save}>
          <div className="field">
            <label>F.I.Sh.</label>
            <input className="input" value={f.name || ''} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} placeholder="Aliyev Vali" />
          </div>
          <div className="field">
            <label>Login</label>
            <input
              className="input"
              autoCapitalize="none"
              disabled={!!edit?._id}
              value={f.username || ''}
              onChange={(e) => setF((x) => ({ ...x, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
              placeholder="vali"
            />
          </div>
          <div className="field">
            <label>{edit?._id ? 'Yangi parol (o\'zgartirish uchun)' : 'Parol'}</label>
            <input className="input" type="text" autoComplete="new-password" value={f.password || ''} onChange={(e) => setF((x) => ({ ...x, password: e.target.value }))} placeholder="Kamida 6 belgi" />
          </div>
          {!isSelf && (
            <>
              <div className="field">
                <span className="field-label">Rol</span>
                <div className="stack" style={{ gap: 8 }}>
                  {Object.entries(ROLES).map(([k, l]) => (
                    <button
                      type="button"
                      key={k}
                      className="action-tile"
                      style={f.role === k ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
                      onClick={() => setF((x) => ({ ...x, role: k }))}
                    >
                      <div className="grow">
                        <div className="bold">{l}</div>
                        <div className="small muted">{ROLE_HINT[k]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {edit?._id && (
                <label className="row card card-pad" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={!f.active} onChange={(e) => setF((x) => ({ ...x, active: !e.target.checked }))} style={{ width: 20, height: 20 }} />
                  <span className="grow">Bloklash (tizimga kira olmaydi)</span>
                </label>
              )}
            </>
          )}
          <button className="btn btn-primary btn-block" disabled={saving}>
            Saqlash
          </button>
          {edit?._id && !isSelf && (
            <button type="button" className="btn btn-danger btn-block" onClick={remove}>
              <Trash2 /> O'chirish
            </button>
          )}
        </form>
      </Sheet>
    </>
  );
}
