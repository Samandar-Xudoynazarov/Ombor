'use client';

import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { TopBar, Empty, ErrorBox, ListSkeleton, Sheet, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { ROLE_KEYS } from '@/lib/format';

export default function Foydalanuvchilar() {
  const { user: me, can } = useAuth();
  const { data, loading, error, reload } = useApi('/users', null, { skip: !can('admin') });
  const toast = useToast();
  const t = useT();
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);

  const ROLES = { admin: t('Administrator'), omborchi: t('Omborchi'), kuzatuvchi: t('Kuzatuvchi') };
  const ROLE_HINT = {
    admin: t("Hamma narsa: foydalanuvchilar, o'chirish, bekor qilish"),
    omborchi: t("Kirim, chiqim, mahsulot va kategoriya qo'shish"),
    kuzatuvchi: t("Faqat ko'rish va hisobotlar"),
  };

  function openForm(u) {
    setEdit(u || {});
    setF(
      u
        ? { name: u.name, username: u.username, role: u.role, active: u.active, password: '' }
        : { name: '', username: '', role: 'omborchi', active: true, password: '' }
    );
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
      toast(t('Saqlandi'));
      setEdit(null);
      reload();
    } catch (err) {
      toast(t(err.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(t("{name} o'chirilsinmi?", { name: edit.name }))) return;
    try {
      await api.del(`/users/${edit._id}`);
      toast(t("O'chirildi"));
      setEdit(null);
      reload();
    } catch (err) {
      toast(t(err.message), 'error');
    }
  }

  if (!can('admin')) {
    return (
      <>
        <TopBar title={t('Foydalanuvchilar')} back="/sozlamalar" />
        <div className="page">
          <Empty icon={Users} title={t("Ruxsat yo'q")} text={t("Bu bo'lim faqat administrator uchun")} />
        </div>
      </>
    );
  }

  const isSelf = edit?._id && edit._id === me.id;

  return (
    <>
      <TopBar
        title={t('Foydalanuvchilar')}
        back="/sozlamalar"
        right={
          <button className="icon-btn" onClick={() => openForm(null)} aria-label={t("Qo'shish")}>
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
                    {u.name} {u._id === me.id && <span className="faint small">({t('siz')})</span>}
                  </div>
                  <div className="meta">@{u.username}</div>
                </div>
                <span className={`badge ${u.active ? 'b-neutral' : 'b-empty'}`}>
                  {u.active ? ROLES[u.role] : t('Bloklangan')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? t('Foydalanuvchi') : t('Yangi foydalanuvchi')}>
        <form className="stack" onSubmit={save}>
          <div className="field">
            <label>{t('F.I.Sh.')}</label>
            <input
              className="input"
              value={f.name || ''}
              onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}
              placeholder={t('Aliyev Vali')}
            />
          </div>
          <div className="field">
            <label>{t('Login')}</label>
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
            <label>{edit?._id ? t("Yangi parol (o'zgartirish uchun)") : t('Parol')}</label>
            <input
              className="input"
              type="text"
              autoComplete="new-password"
              value={f.password || ''}
              onChange={(e) => setF((x) => ({ ...x, password: e.target.value }))}
              placeholder={t('Kamida 6 belgi')}
            />
          </div>
          {!isSelf && (
            <>
              <div className="field">
                <span className="field-label">{t('Rol')}</span>
                <div className="stack" style={{ gap: 8 }}>
                  {ROLE_KEYS.map((k) => (
                    <button
                      type="button"
                      key={k}
                      className="action-tile"
                      style={f.role === k ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
                      onClick={() => setF((x) => ({ ...x, role: k }))}
                    >
                      <div className="grow">
                        <div className="bold">{ROLES[k]}</div>
                        <div className="small muted">{ROLE_HINT[k]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {edit?._id && (
                <label className="row card card-pad" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!f.active}
                    onChange={(e) => setF((x) => ({ ...x, active: !e.target.checked }))}
                    style={{ width: 20, height: 20 }}
                  />
                  <span className="grow">{t('Bloklash (tizimga kira olmaydi)')}</span>
                </label>
              )}
            </>
          )}
          <button className="btn btn-primary btn-block" disabled={saving}>
            {t('Saqlash')}
          </button>
          {edit?._id && !isSelf && (
            <button type="button" className="btn btn-danger btn-block" onClick={remove}>
              <Trash2 /> {t("O'chirish")}
            </button>
          )}
        </form>
      </Sheet>
    </>
  );
}
