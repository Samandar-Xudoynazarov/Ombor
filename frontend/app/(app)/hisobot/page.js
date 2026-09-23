'use client';

import { useMemo, useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';
import { TopBar, ListSkeleton, Empty, ErrorBox, Sheet } from '@/components/ui';
import ExportButton from '@/components/ExportSheet';
import { useApi } from '@/lib/hooks';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { PERIODS, periodRange } from '@/lib/period';
import { money, moneyShort, num, toDateInput, unitLabel, currency } from '@/lib/format';

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
  const t = useT();
  const [type, setType] = useState('out');
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: toDateInput(), to: toDateInput() });
  const [customOpen, setCustomOpen] = useState(false);
  const [tab, setTab] = useState('byProduct');
  const [open, setOpen] = useState(null);

  const range = useMemo(() => periodRange(period, custom), [period, custom]);
  const { data, loading, error, reload } = useApi('/stats/report', { type, ...range });

  const tabs = TABS[type];
  const activeTab = tabs.some((x) => x[0] === tab) ? tab : 'byProduct';
  const rows = data?.[activeTab] || [];
  const hasMoney = (data?.total || 0) > 0;
  const metric = (r) => (hasMoney ? r.total : r.count);
  const max = Math.max(1, ...rows.map(metric));
  const color = type === 'in' ? 'var(--in)' : 'var(--out)';

  const periodText = `${range.from ? new Date(range.from).toLocaleDateString('ru-RU') : '…'} — ${
    range.to ? new Date(range.to).toLocaleDateString('ru-RU') : '…'
  }`;

  // Excel: hisobot (har bir bo'lim alohida varaqda)
  async function buildExport() {
    const d = await api.get('/stats/report', { type, ...range });

    const groupSheet = (name, list, firstHeader) =>
      list && list.length
        ? {
            name,
            title: `${type === 'out' ? t('Chiqim (sarf)') : t('Kirim')} — ${name}`,
            subtitle: `${t('Davr')}: ${periodText}`,
            columns: [
              { header: firstHeader, width: 26 },
              { header: t('Mahsulot'), width: 30 },
              { header: t('Miqdor'), width: 14, type: 'num' },
              { header: t('Birlik'), width: 10 },
              { header: `${t('Summa')}, ${currency()}`, width: 16, type: 'money' },
            ],
            rows: list.flatMap((g) => {
              const head = [g.name || t("Noma'lum"), '', '', '', g.total || ''];
              head.__bold = true;
              const items = (g.items || []).map((it) => ['', it.name, it.quantity, unitLabel(it.unit), it.total || '']);
              return [head, ...items];
            }),
          }
        : null;

    const sheets = [
      {
        name: t('Mahsulotlar'),
        title: `${type === 'out' ? t('Chiqim (sarf)') : t('Kirim')} — ${t('Mahsulotlar')}`,
        subtitle: `${t('Davr')}: ${periodText}`,
        columns: [
          { header: t('Mahsulot'), width: 32 },
          { header: t('Kategoriya'), width: 20 },
          { header: t('Miqdor'), width: 14, type: 'num' },
          { header: t('Birlik'), width: 10 },
          { header: t('Operatsiyalar'), width: 14, type: 'num' },
          { header: `${t('Summa')}, ${currency()}`, width: 16, type: 'money' },
        ],
        rows: (() => {
          const list = d.byProduct || [];
          const r = list.map((x) => [x.name, x.category || '', x.quantity, unitLabel(x.unit), x.count, x.total || '']);
          if (r.length) {
            const total = [t('JAMI'), '', '', '', d.count, d.total || ''];
            total.__bold = true;
            r.push(total);
          }
          return r;
        })(),
      },
      groupSheet(t("Bo'limlar"), d.byDepartment, t("Bo'lim / sex")),
      groupSheet(t('Texnika'), d.byVehicle, t('Texnika')),
      groupSheet(type === 'in' ? t('Qabul qilganlar') : t('Shaxslar'), d.byPerson, t("Mas'ul shaxs")),
      groupSheet(t('Yetkazib beruvchilar'), d.bySupplier, t('Yetkazib beruvchi')),
      d.byCategory && d.byCategory.length
        ? {
            name: t('Kategoriyalar'),
            columns: [
              { header: t('Kategoriya'), width: 26 },
              { header: t('Operatsiyalar'), width: 14, type: 'num' },
              { header: `${t('Summa')}, ${currency()}`, width: 16, type: 'money' },
            ],
            rows: d.byCategory.map((c) => [c.name || t('Kategoriyasiz'), c.count, c.total || '']),
          }
        : null,
    ].filter(Boolean);

    return {
      filename: `ombor-hisobot-${toDateInput()}.xlsx`,
      rowCount: d.count,
      sheets,
    };
  }

  return (
    <>
      <TopBar
        title={t('Hisobot')}
        sub={type === 'out' ? t('Nima, qayerga, qancha sarflandi') : t('Omborga nima keldi')}
        right={<ExportButton build={buildExport} title={t('Hisobot')} />}
      />
      <div className="page stack" style={{ gap: 10 }}>
        <div className="segmented">
          <button className={type === 'out' ? 'active' : ''} onClick={() => setType('out')}>
            {t('Chiqim (sarf)')}
          </button>
          <button className={type === 'in' ? 'active' : ''} onClick={() => setType('in')}>
            {t('Kirim')}
          </button>
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

        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card stat">
            <span className="label">{t('Jami summa')}</span>
            <span className="value" style={{ fontSize: 20, color }}>
              {data ? (hasMoney ? `${moneyShort(data.total)} ${currency()}` : '—') : '…'}
            </span>
          </div>
          <div className="card stat">
            <span className="label">{t('Operatsiyalar')}</span>
            <span className="value" style={{ fontSize: 20 }}>
              {data ? data.count : '…'}
            </span>
          </div>
        </div>

        <div className="chips">
          {tabs.map(([k, l]) => (
            <button key={k} className={`chip ${activeTab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {t(l)}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <ListSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <div className="card">
            <Empty icon={BarChart3} title={t("Ma'lumot yo'q")} text={t("Tanlangan davrda harakat bo'lmagan")} />
          </div>
        ) : activeTab === 'byProduct' ? (
          <div className="list">
            {rows.map((r) => (
              <div className="bar-row" key={r._id}>
                <div className="row between">
                  <div className="grow">
                    <div className="bold ellipsis">{r.name}</div>
                    <div className="xs faint">
                      {r.category || t('Kategoriyasiz')} · {t('{n} marta', { n: r.count })}
                    </div>
                  </div>
                  <div className="end" style={{ textAlign: 'right' }}>
                    <div className="bold tabular">
                      {num(r.quantity)} <span className="small muted">{unitLabel(r.unit)}</span>
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
                    style={{
                      background: 'none', border: 0, padding: 0, cursor: r.items ? 'pointer' : 'default',
                      textAlign: 'left', width: '100%',
                    }}
                    onClick={() => r.items && setOpen(expanded ? null : `${activeTab}:${key}`)}
                  >
                    <div className="grow">
                      <div className="bold ellipsis">
                        {r.name || (activeTab === 'byCategory' ? t('Kategoriyasiz') : t("Noma'lum"))}
                        {r.code ? <span className="muted"> ({r.code})</span> : null}
                      </div>
                      <div className="xs faint">
                        {t('{n} marta', { n: r.count })}
                        {r.items ? ` · ${t('{n} xil mahsulot', { n: r.items.length })}` : ''}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      {r.total > 0 && <span className="bold tabular small">{money(r.total)}</span>}
                      {r.items && (
                        <ChevronDown
                          size={18}
                          style={{
                            transition: 'transform .2s',
                            transform: expanded ? 'rotate(180deg)' : 'none',
                            color: 'var(--text-3)',
                          }}
                        />
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
                            {num(it.quantity)} {unitLabel(it.unit)}
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
            {t("Summalar ko'rinishi uchun kirimda narxni kiriting.")}
          </p>
        )}
      </div>

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
    </>
  );
}
