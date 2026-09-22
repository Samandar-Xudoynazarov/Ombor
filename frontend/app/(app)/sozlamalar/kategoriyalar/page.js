'use client';

import { useState } from 'react';
import { Plus, Tags, Trash2 } from 'lucide-react';
import { TopBar, CategoryAvatar, CATEGORY_COLORS, CATEGORY_ICONS, Empty, ErrorBox, ListSkeleton, Sheet, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Kategoriyalar() {
  const { data, loading, error, reload } = useApi('/categories');
  const { can } = useAuth();
  const toast = useToast();
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
    if (!confirm(`"${edit.name}" kategoriyasi o'chirilsinmi?`)) return;
    try {
      await api.del(`/categories/${edit._id}`);
      toast("O'chirildi");
      setEdit(null);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <TopBar
        title="Kategoriyalar"
        back="/sozlamalar"
        right={
          can('write') && (
            <button className="icon-btn" onClick={() => openForm(null)} aria-label="Qo'shish">
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
              title="Kategoriya yo'q"
              text="Mahsulotlarni guruhlash uchun kategoriya qo'shing"
              action={
                can('write') && (
                  <button className="btn btn-primary btn-sm" onClick={() => openForm(null)}>
                    <Plus /> Qo'shish
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
                  <div className="meta">{c.productCount} ta mahsulot</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}>
        <form className="stack" onSubmit={save}>
          <div className="row" style={{ justifyContent: 'center', padding: '4px 0' }}>
            <CategoryAvatar category={f} />
          </div>
          <div className="field">
            <label>Nomi</label>
            <input className="input" autoFocus value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} placeholder="Masalan: Yoqilg'i" />
          </div>
          <div className="field">
            <span className="field-label">Rang</span>
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
            <span className="field-label">Belgi</span>
            <div className="icon-choices">
              {Object.entries(CATEGORY_ICONS).map(([k, Icon]) => (
                <button type="button" key={k} className={`icon-choice ${f.icon === k ? 'active' : ''}`} onClick={() => setF((x) => ({ ...x, icon: k }))}>
                  <Icon />
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving || !f.name.trim()}>
            Saqlash
          </button>
          {edit?._id && can('admin') && (
            <button type="button" className="btn btn-danger btn-block" onClick={remove}>
              <Trash2 /> O'chirish
            </button>
          )}
        </form>
      </Sheet>
    </>
  );
}
