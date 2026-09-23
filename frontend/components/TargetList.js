'use client';

import { useState } from 'react';
import { Building2, Plus, Tractor, Trash2 } from 'lucide-react';
import { TopBar, Empty, ErrorBox, ListSkeleton, Sheet, useToast } from './ui';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

// Bo'limlar yoki texnika ro'yxatini boshqarish. kind: 'department' | 'vehicle'
export default function TargetList({ kind }) {
  const isVeh = kind === 'vehicle';
  const Icon = isVeh ? Tractor : Building2;
  const color = isVeh ? '#f59e0b' : '#0ea5e9';
  const { data, loading, error, reload } = useApi('/targets', { kind });
  const { can } = useAuth();
  const toast = useToast();
  const t = useT();
  const [edit, setEdit] = useState(null);
  const [f, setF] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  function openForm(item) {
    setEdit(item || {});
    setF({ name: item?.name || '', code: item?.code || '' });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit._id) await api.put(`/targets/${edit._id}`, f);
      else await api.post('/targets', { ...f, kind });
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
    if (!confirm(t('"{name}" o\'chirilsinmi?', { name: edit.name }))) return;
    try {
      const r = await api.del(`/targets/${edit._id}`);
      toast(r.archived ? t('Tarixda ishlatilgani uchun arxivlandi') : t("O'chirildi"));
      setEdit(null);
      reload();
    } catch (err) {
      toast(t(err.message), 'error');
    }
  }

  const title = isVeh ? t('Texnika va mashinalar') : t("Bo'limlar va sexlar");

  return (
    <>
      <TopBar
        title={title}
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
              icon={Icon}
              title={t("Ro'yxat bo'sh")}
              text={isVeh ? t("Traktor, KamAZ, ekskavator va boshqalarni qo'shing") : t("Sexlar va bo'limlarni qo'shing")}
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
            {data.map((item) => (
              <button key={item._id} className="list-item" onClick={() => can('write') && openForm(item)}>
                <div className="avatar" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
                  <Icon />
                </div>
                <div className="grow">
                  <div className="title">{item.name}</div>
                  {item.code && <div className="meta">{item.code}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? t('Tahrirlash') : isVeh ? t('Yangi texnika') : t("Yangi bo'lim / sex")}>
        <form className="stack" onSubmit={save}>
          <div className="field">
            <label>{t('Nomi')}</label>
            <input
              className="input"
              autoFocus
              value={f.name}
              onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}
              placeholder={isVeh ? t('Masalan: KamAZ 6520') : t('Masalan: 2-sex')}
            />
          </div>
          <div className="field">
            <label>{isVeh ? t('Davlat raqami') : t('Kod (ixtiyoriy)')}</label>
            <input
              className="input"
              value={f.code}
              onChange={(e) => setF((x) => ({ ...x, code: e.target.value }))}
              placeholder={isVeh ? '01 A 123 BC' : ''}
            />
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
