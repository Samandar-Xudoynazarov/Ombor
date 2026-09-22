'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, History, SlidersHorizontal, Trash2 } from 'lucide-react';
import { TopBar, ListSkeleton, Empty, ErrorBox, Sheet, useToast } from '@/components/ui';
import MovementItem, { MovementDetail } from '@/components/MovementItem';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { PERIODS, periodRange } from '@/lib/period';
import { dayKey, dayLabel, toDateInput } from '@/lib/format';

const PAGE = 50;

function TarixInner() {
  const params = useSearchParams();
  const toast = useToast();
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
  const [exporting, setExporting] = useState(false);

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
    setItems((prev) => (data.page === 1 ? data.items : [...prev, ...data.items.filter((m) => !prev.some((p) => p._id === m._id))]));
  }, [data]);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  const groups = [];
  for (const m of items) {
    const k = dayKey(m.date);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, date: m.date, items: [] });
    groups[groups.length - 1].items.push(m);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await api.get('/movements', { type, ...range, ...filters, limit: 5000 });
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const head = ['Sana', 'Turi', 'Mahsulot', 'Kategoriya', 'Miqdor', 'Birlik', 'Narx', 'Summa', "Bo'lim", 'Texnika', "Mas'ul", 'Yetkazib beruvchi', 'Nakladnoy', 'Izoh', 'Kiritdi'];
      const rows = all.items.map((m) => [
        new Date(m.date).toLocaleString('ru-RU'),
        m.type === 'in' ? 'Kirim' : 'Chiqim',
        m.product?.name,
        m.product?.category?.name,
        String(m.quantity).replace('.', ','),
        m.product?.unit,
        Math.round(m.price || 0),
        Math.round(m.total || 0),
        m.department?.name,
        m.vehicle ? `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}` : '',
        m.person,
        m.supplier,
        m.docNumber,
        m.note,
        m.createdBy?.name,
      ]);
      const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ombor-tarix-${toDateInput()}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast(`${all.items.length} ta yozuv yuklab olindi`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setExporting(false);
    }
  }

  async function cancelMove(m) {
    if (!confirm('Bu harakat bekor qilinsinmi? Qoldiq qayta hisoblanadi.')) return;
    try {
      await api.del(`/movements/${m._id}`);
      toast('Harakat bekor qilindi');
      setSelected(null);
      setItems((x) => x.filter((i) => i._id !== m._id));
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  return (
    <>
      <TopBar
        title="Tarix"
        sub={data ? `${data.total} ta yozuv` : ' '}
        right={
          <>
            <button className="icon-btn" onClick={exportCsv} disabled={exporting} aria-label="Excelga yuklab olish">
              <Download />
            </button>
            <button className="icon-btn" onClick={() => setFilterOpen(true)} aria-label="Filtr" style={{ position: 'relative' }}>
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
              {l}
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
              {p.v === 'custom' && period === 'custom' ? `${custom.from} — ${custom.to}` : p.l}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && items.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : items.length === 0 ? (
          <div className="card">
            <Empty icon={History} title="Yozuv topilmadi" text="Tanlangan davr yoki filtr bo'yicha harakat yo'q" />
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
                      {inSum > 0 && <span className="c-in">{inSum} kirim</span>}
                      {inSum > 0 && outSum > 0 && ' · '}
                      {outSum > 0 && <span className="c-out">{outSum} chiqim</span>}
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
                {loading ? 'Yuklanmoqda…' : "Ko'proq ko'rsatish"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filtr */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtr">
        <div className="stack">
          <div className="field">
            <label>Kategoriya</label>
            <select className="select" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">Barchasi</option>
              {(cats.data || []).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Bo'lim / sex</label>
            <select className="select" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
              <option value="">Barchasi</option>
              {(deps.data || []).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Texnika</label>
            <select className="select" value={filters.vehicle} onChange={(e) => setFilters((f) => ({ ...f, vehicle: e.target.value }))}>
              <option value="">Barchasi</option>
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
              Tozalash
            </button>
            <button className="btn btn-primary" onClick={() => setFilterOpen(false)}>
              Ko'rsatish
            </button>
          </div>
        </div>
      </Sheet>

      {/* Ixtiyoriy davr */}
      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title="Davrni tanlang">
        <div className="stack">
          <div className="grid-2">
            <div className="field">
              <label>Dan</label>
              <input className="input" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            </div>
            <div className="field">
              <label>Gacha</label>
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
            Qo'llash
          </button>
        </div>
      </Sheet>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title="Harakat tafsilotlari">
        {selected && (
          <>
            <MovementDetail m={selected} />
            {can('admin') && (
              <button className="btn btn-danger btn-block mt-16" onClick={() => cancelMove(selected)}>
                <Trash2 /> Harakatni bekor qilish
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
