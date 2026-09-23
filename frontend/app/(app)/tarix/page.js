'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { History, SlidersHorizontal, Trash2 } from 'lucide-react';
import { TopBar, ListSkeleton, Empty, ErrorBox, Sheet, useToast } from '@/components/ui';
import MovementItem, { MovementDetail } from '@/components/MovementItem';
import ExportButton from '@/components/ExportSheet';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { PERIODS, periodRange } from '@/lib/period';
import { dayKey, dayLabelKey, toDateInput, unitLabel, currency } from '@/lib/format';

const PAGE = 50;

function TarixInner() {
  const params = useSearchParams();
  const toast = useToast();
  const t = useT();
  const { can } = useAuth();
  const [type, setType] = useState(params.get('type') || '');
  const [period, setPeriod] = useState(params.get('type') ? 'today' : '30d');
  const [custom, setCustom] = useState({ from: toDateInput(), to: toDateInput() });
  const [filters, setFilters] = useState({ category: '', department: '', vehicle: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  const range = useMemo(() => periodRange(period, custom), [period, custom]);
  const query = { type, ...range, ...filters, limit: PAGE, page };
  const { data, loading, error, reload } = useApi('/movements', query);

  const cats = useApi('/categories');
  const deps = useApi('/targets', { kind: 'department', all: 1 });
  const vehs = useApi('/targets', { kind: 'vehicle', all: 1 });

  // Filtr o'zgarsa birinchi sahifaga qaytish
  const filterKey = JSON.stringify({ type, range, filters });
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [filterKey]);

  useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      data.page === 1 ? data.items : [...prev, ...data.items.filter((m) => !prev.some((p) => p._id === m._id))]
    );
  }, [data]);

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const dayLabel = (d) => {
    const r = dayLabelKey(d);
    return r.key ? t(r.key) : r.text;
  };

  const groups = [];
  for (const m of items) {
    const k = dayKey(m.date);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, date: m.date, items: [] });
    groups[groups.length - 1].items.push(m);
  }

  // Excel: harakatlar tarixi (kim, qayerga, qancha)
  async function buildExport() {
    const all = await api.get('/movements', { type, ...range, ...filters, limit: 5000 });
    const list = all.items;
    const rows = list.map((m) => [
      new Date(m.date),
      m.type === 'in' ? t('Kirim') : t('Chiqim'),
      m.product?.name || '',
      m.product?.category?.name || '',
      m.type === 'in' ? m.quantity : '',
      m.type === 'out' ? m.quantity : '',
      unitLabel(m.product?.unit),
      m.price || '',
      m.total || '',
      m.department?.name || '',
      m.vehicle ? `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}` : '',
      m.person || '',
      m.supplier || '',
      m.docNumber || '',
      m.note || '',
      m.createdBy?.name || '',
    ]);
    const sumIn = list.filter((m) => m.type === 'in').reduce((s, m) => s + (m.total || 0), 0);
    const sumOut = list.filter((m) => m.type === 'out').reduce((s, m) => s + (m.total || 0), 0);
    if (rows.length) {
      const total = ['', t('JAMI'), '', '', '', '', '', '', sumIn + sumOut, '', '', '', '', '', '', ''];
      total.__bold = true;
      rows.push(total);
    }
    const periodText = `${range.from ? new Date(range.from).toLocaleDateString('ru-RU') : '…'} — ${
      range.to ? new Date(range.to).toLocaleDateString('ru-RU') : '…'
    }`;
    return {
      filename: `ombor-tarix-${toDateInput()}.xlsx`,
      rowCount: list.length,
      sheets: [
        {
          name: t('Tarix'),
          title: t('Kirim-chiqim tarixi'),
          subtitle: `${t('Davr')}: ${periodText}`,
          columns: [
            { header: t('Sana'), width: 18, type: 'datetime' },
            { header: t('Turi'), width: 10 },
            { header: t('Mahsulot'), width: 30 },
            { header: t('Kategoriya'), width: 18 },
            { header: t('Kirim'), width: 12, type: 'num' },
            { header: t('Chiqim'), width: 12, type: 'num' },
            { header: t('Birlik'), width: 10 },
            { header: `${t('Narx')}, ${currency()}`, width: 14, type: 'money' },
            { header: `${t('Summa')}, ${currency()}`, width: 16, type: 'money' },
            { header: t("Bo'lim / sex"), width: 20 },
            { header: t('Texnika'), width: 22 },
            { header: t("Mas'ul shaxs"), width: 22 },
            { header: t('Yetkazib beruvchi'), width: 22 },
            { header: t('Nakladnoy №'), width: 14 },
            { header: t('Izoh'), width: 24 },
            { header: t('Kiritdi'), width: 18 },
          ],
          rows,
        },
      ],
    };
  }

  async function cancelMove(m) {
    if (!confirm(t('Bu harakat bekor qilinsinmi? Qoldiq qayta hisoblanadi.'))) return;
    try {
      await api.del(`/movements/${m._id}`);
      toast(t('Harakat bekor qilindi'));
      setSelected(null);
      setItems((x) => x.filter((i) => i._id !== m._id));
    } catch (e) {
      toast(t(e.message), 'error');
    }
  }

  return (
    <>
      <TopBar
        title={t('Tarix')}
        sub={data ? t('{n} ta yozuv', { n: data.total }) : ' '}
        right={
          <>
            <ExportButton build={buildExport} title={t('Kirim-chiqim tarixi')} />
            <button className="icon-btn" onClick={() => setFilterOpen(true)} aria-label={t('Filtr')} style={{ position: 'relative' }}>
              <SlidersHorizontal />
              {activeFilters > 0 && (
                <span
                  style={{
                    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
                    background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center',
                  }}
                >
                  {activeFilters}
                </span>
              )}
            </button>
          </>
        }
      />
      <div className="page stack" style={{ gap: 10 }}>
        <div className="segmented">
          {[
            ['', 'Hammasi'],
            ['in', 'Kirim'],
            ['out', 'Chiqim'],
          ].map(([v, l]) => (
            <button key={v} className={type === v ? 'active' : ''} onClick={() => setType(v)}>
              {t(l)}
            </button>
          ))}
        </div>
        <div className="chips">
          {PERIODS.map((p) => (
            <button
              key={p.v}
              className={`chip ${period === p.v ? 'active' : ''}`}
              onClick={() => (p.v === 'custom' ? setCustomOpen(true) : setPeriod(p.v))}
            >
              {p.v === 'custom' && period === 'custom' ? `${custom.from} — ${custom.to}` : t(p.l)}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && items.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : items.length === 0 ? (
          <div className="card">
            <Empty icon={History} title={t('Yozuv topilmadi')} text={t("Tanlangan davr yoki filtr bo'yicha harakat yo'q")} />
          </div>
        ) : (
          <div>
            {groups.map((g) => {
              const inSum = g.items.filter((m) => m.type === 'in').length;
              const outSum = g.items.length - inSum;
              return (
                <div key={g.key}>
                  <div className="day-head row between">
                    <span>{dayLabel(g.date)}</span>
                    <span className="xs faint">
                      {inSum > 0 && <span className="c-in">{t('{n} kirim', { n: inSum })}</span>}
                      {inSum > 0 && outSum > 0 && ' · '}
                      {outSum > 0 && <span className="c-out">{t('{n} chiqim', { n: outSum })}</span>}
                    </span>
                  </div>
                  <div className="list">
                    {g.items.map((m) => (
                      <MovementItem key={m._id} m={m} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              );
            })}
            {data && data.page < data.pages && (
              <button className="btn btn-ghost btn-block mt-16" disabled={loading} onClick={() => setPage((p) => p + 1)}>
                {loading ? t('Yuklanmoqda…') : t("Ko'proq ko'rsatish")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filtr */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t('Filtr')}>
        <div className="stack">
          <div className="field">
            <label>{t('Kategoriya')}</label>
            <select className="select" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">{t('Barchasi')}</option>
              {(cats.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t("Bo'lim / sex")}</label>
            <select className="select" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
              <option value="">{t('Barchasi')}</option>
              {(deps.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('Texnika')}</label>
            <select className="select" value={filters.vehicle} onChange={(e) => setFilters((f) => ({ ...f, vehicle: e.target.value }))}>
              <option value="">{t('Barchasi')}</option>
              {(vehs.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid-2">
            <button className="btn btn-ghost" onClick={() => setFilters({ category: '', department: '', vehicle: '' })}>
              {t('Tozalash')}
            </button>
            <button className="btn btn-primary" onClick={() => setFilterOpen(false)}>
              {t("Ko'rsatish")}
            </button>
          </div>
        </div>
      </Sheet>

      {/* Ixtiyoriy davr */}
      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title={t('Davrni tanlang')}>
        <div className="stack">
          <div className="grid-2">
            <div className="field">
              <label>{t('Dan')}</label>
              <input className="input" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            </div>
            <div className="field">
              <label>{t('Gacha')}</label>
              <input className="input" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
            </div>
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              setPeriod('custom');
              setCustomOpen(false);
            }}
          >
            {t("Qo'llash")}
          </button>
        </div>
      </Sheet>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={t('Harakat tafsilotlari')}>
        {selected && (
          <>
            <MovementDetail m={selected} />
            {can('admin') && (
              <button className="btn btn-danger btn-block mt-16" onClick={() => cancelMove(selected)}>
                <Trash2 /> {t('Harakatni bekor qilish')}
              </button>
            )}
          </>
        )}
      </Sheet>
    </>
  );
}

export default function TarixPage() {
  return (
    <Suspense fallback={null}>
      <TarixInner />
    </Suspense>
  );
}
