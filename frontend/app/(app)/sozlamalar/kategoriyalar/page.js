'use client';

import { useState } from 'react';
import { Plus, Tags, Trash2 } from 'lucide-react';
import { TopBar, CategoryAvatar, CATEGORY_COLORS, CATEGORY_ICONS, Empty, ErrorBox, ListSkeleton, Sheet, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function Kategoriyalar() {
  const { data, loading, error, reload } = useApi('/categories');
  const { can } = useAuth();
  const toast = useToast();
  const t = useT();
  const [edit, setEdit] = useState(null); // null | {} | category
  const [f, setF] = useState({ name: '', color: CATEGORY_COLORS[0], icon: 'box' });
  const [saving, setSaving] = useState(false);

  function openForm(c) {
    setEdit(c || {});
    setF(c ? { name: c.name, color: c.color, icon: c.icon } : { name: '', color: CATEGORY_COLORS[0], icon: 'box' });
  }

  async function save(e) {
    e.preventDefault();
    if (!f.name.trim()) return;
    setSaving(true);
    try {
      if (edit._id) await api.put(`/categories/${edit._id}`, f);
      else await api.post('/categories', f);
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
    if (!confirm(t('"{name}" kategoriyasi o\'chirilsinmi?', { name: edit.name }))) return;
    try {
      await api.del(`/categories/${edit._id}`);
      toast(t("O'chirildi"));
      setEdit(null);
      reload();
    } catch (err) {
      toast(t(err.message), 'error');
    }
  }

  return (
    <>
      <TopBar
        title={t('Kategoriyalar')}
        back="/sozlamalar"
        right={
          can('write') && (
            <button className="icon-btn" onClick={() => openForm(null)} aria-label={t("Qo'shish")}>
              <Plus />
            </button>
          )
        }
      />
      <div className="page">
        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <ListSkeleton />
        ) : data.length === 0 ? (
          <div className="card">
            <Empty
              icon={Tags}
              title={t("Kategoriya yo'q")}
              text={t("Mahsulotlarni guruhlash uchun kategoriya qo'shing")}
              action={
                can('write') && (
                  <button className="btn btn-primary btn-sm" onClick={() => openForm(null)}>
                    <Plus /> {t("Qo'shish")}
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="list">
            {data.map((c) => (
              <button key={c._id} className="list-item" onClick={() => can('write') && openForm(c)}>
                <CategoryAvatar category={c} />
                <div className="grow">
                  <div className="title">{c.name}</div>
                  <div className="meta">{t('{n} ta mahsulot', { n: c.productCount })}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? t('Kategoriyani tahrirlash') : t('Yangi kategoriya')}>
        <form className="stack" onSubmit={save}>
          <div className="row" style={{ justifyContent: 'center', padding: '4px 0' }}>
            <CategoryAvatar category={f} />
          </div>
          <div className="field">
            <label>{t('Nomi')}</label>
            <input className="input" autoFocus value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} placeholder={t("Masalan: Yoqilg'i")} />
          </div>
          <div className="field">
            <span className="field-label">{t('Rang')}</span>
            <div className="color-dots">
              {CATEGORY_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-dot ${f.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setF((x) => ({ ...x, color: c }))}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">{t('Belgi')}</span>
            <div className="icon-choices">
              {Object.entries(CATEGORY_ICONS).map(([k, Icon]) => (
                <button type="button" key={k} className={`icon-choice ${f.icon === k ? 'active' : ''}`} onClick={() => setF((x) => ({ ...x, icon: k }))}>
                  <Icon />
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving || !f.name.trim()}>
            {t('Saqlash')}
          </button>
          {edit?._id && can('admin') && (
            <button type="button" className="btn btn-danger btn-block" onClick={remove}>
              <Trash2 /> {t("O'chirish")}
            </button>
          )}
        </form>
      </Sheet>
    </>
  );
}
