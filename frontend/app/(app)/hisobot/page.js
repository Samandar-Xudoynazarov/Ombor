'use client';

import { useMemo, useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';
import { TopBar, ListSkeleton, Empty, ErrorBox, Sheet } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import { PERIODS, periodRange } from '@/lib/period';
import { money, moneyShort, num, toDateInput } from '@/lib/format';

const TABS = {
  out: [
    ['byProduct', 'Mahsulotlar'],
    ['byDepartment', "Bo'limlar"],
    ['byVehicle', 'Texnika'],
    ['byPerson', 'Shaxslar'],
    ['byCategory', 'Kategoriyalar'],
  ],
  in: [
    ['byProduct', 'Mahsulotlar'],
    ['bySupplier', 'Yetkazib beruvchilar'],
    ['byCategory', 'Kategoriyalar'],
    ['byPerson', 'Qabul qilganlar'],
  ],
};

export default function HisobotPage() {
  const [type, setType] = useState('out');
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: toDateInput(), to: toDateInput() });
  const [customOpen, setCustomOpen] = useState(false);
  const [tab, setTab] = useState('byProduct');
  const [open, setOpen] = useState(null);

  const range = useMemo(() => periodRange(period, custom), [period, custom]);
  const { data, loading, error, reload } = useApi('/stats/report', { type, ...range });

  const tabs = TABS[type];
  const activeTab = tabs.some((t) => t[0] === tab) ? tab : 'byProduct';
  const rows = data?.[activeTab] || [];
  const hasMoney = (data?.total || 0) > 0;
  const metric = (r) => (hasMoney ? r.total : r.count);
  const max = Math.max(1, ...rows.map(metric));
  const color = type === 'in' ? 'var(--in)' : 'var(--out)';

  return (
    <>
      <TopBar title="Hisobot" sub={type === 'out' ? 'Nima, qayerga, qancha sarflandi' : 'Omborga nima keldi'} />
      <div className="page stack" style={{ gap: 10 }}>
        <div className="segmented">
          <button className={type === 'out' ? 'active' : ''} onClick={() => setType('out')}>
            Chiqim (sarf)
          </button>
          <button className={type === 'in' ? 'active' : ''} onClick={() => setType('in')}>
            Kirim
          </button>
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

        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card stat">
            <span className="label">Jami summa</span>
            <span className="value" style={{ fontSize: 20, color }}>
              {data ? (hasMoney ? `${moneyShort(data.total)} so'm` : '—') : '…'}
            </span>
          </div>
          <div className="card stat">
            <span className="label">Operatsiyalar</span>
            <span className="value" style={{ fontSize: 20 }}>
              {data ? data.count : '…'}
            </span>
          </div>
        </div>

        <div className="chips">
          {tabs.map(([k, l]) => (
            <button key={k} className={`chip ${activeTab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <ListSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <div className="card">
            <Empty icon={BarChart3} title="Ma'lumot yo'q" text="Tanlangan davrda harakat bo'lmagan" />
          </div>
        ) : activeTab === 'byProduct' ? (
          <div className="list">
            {rows.map((r) => (
              <div className="bar-row" key={r._id}>
                <div className="row between">
                  <div className="grow">
                    <div className="bold ellipsis">{r.name}</div>
                    <div className="xs faint">
                      {r.category || 'Kategoriyasiz'} · {r.count} marta
                    </div>
                  </div>
                  <div className="end" style={{ textAlign: 'right' }}>
                    <div className="bold tabular">
                      {num(r.quantity)} <span className="small muted">{r.unit}</span>
                    </div>
                    {r.total > 0 && <div className="xs faint tabular">{money(r.total)}</div>}
                  </div>
                </div>
                <div className="bar">
                  <span style={{ width: `${Math.max((metric(r) / max) * 100, 2)}%`, background: r.color || color }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="list">
            {rows.map((r) => {
              const key = String(r._id ?? 'none');
              const expanded = open === `${activeTab}:${key}`;
              return (
                <div className="bar-row" key={key}>
                  <button
                    className="row between"
                    style={{ background: 'none', border: 0, padding: 0, cursor: r.items ? 'pointer' : 'default', textAlign: 'left', width: '100%' }}
                    onClick={() => r.items && setOpen(expanded ? null : `${activeTab}:${key}`)}
                  >
                    <div className="grow">
                      <div className="bold ellipsis">
                        {r.name || (activeTab === 'byCategory' ? 'Kategoriyasiz' : "Noma'lum")}
                        {r.code ? <span className="muted"> ({r.code})</span> : null}
                      </div>
                      <div className="xs faint">
                        {r.count} marta{r.items ? ` · ${r.items.length} xil mahsulot` : ''}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      {r.total > 0 && <span className="bold tabular small">{money(r.total)}</span>}
                      {r.items && (
                        <ChevronDown size={18} style={{ transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none', color: 'var(--text-3)' }} />
                      )}
                    </div>
                  </button>
                  <div className="bar">
                    <span style={{ width: `${Math.max((metric(r) / max) * 100, 2)}%`, background: r.color || color }} />
                  </div>
                  {expanded && (
                    <div className="mt-8" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '4px 0' }}>
                      {r.items.map((it, i) => (
                        <div key={i} className="kv" style={{ padding: '8px 12px' }}>
                          <span className="k ellipsis">{it.name}</span>
                          <span className="v tabular">
                            {num(it.quantity)} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!hasMoney && data && data.count > 0 && (
          <p className="xs faint" style={{ textAlign: 'center' }}>
            Summalar ko'rinishi uchun kirimda narxni kiriting.
          </p>
        )}
      </div>

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
    </>
  );
}
