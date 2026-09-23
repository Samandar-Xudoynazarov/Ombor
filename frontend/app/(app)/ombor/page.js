'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boxes, Plus, Search } from 'lucide-react';
import { TopBar, CategoryAvatar, ListSkeleton, Empty, ErrorBox, StockBadge } from '@/components/ui';
import ProductForm from '@/components/ProductForm';
import ExportButton from '@/components/ExportSheet';
import { useApi, useDebounced } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { num, stockStatus, toDateInput, unitLabel, currency } from '@/lib/format';

const STATUS = [
  { v: '', l: 'Hammasi' },
  { v: 'low', l: 'Kam qolgan' },
  { v: 'empty', l: 'Tugagan' },
];

function OmborInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { can } = useAuth();
  const t = useT();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.get('category') || '');
  const [status, setStatus] = useState(params.get('status') || '');
  const [formOpen, setFormOpen] = useState(params.get('yangi') === '1');
  const q = useDebounced(search, 250);

  const cats = useApi('/categories');
  const { data, loading, error, reload } = useApi('/products', { search: q, category, status });

  useEffect(() => {
    if (params.get('yangi') === '1') {
      setFormOpen(true);
      router.replace('/ombor');
    }
  }, [params, router]);

  const totalCount = (cats.data || []).reduce((s, c) => s + c.productCount, 0);

  // Excel: ombordagi qoldiqlar
  async function buildExport() {
    const list = data || [];
    const statusText = (p) => {
      const s = stockStatus(p);
      return s === 'empty' ? t('Tugagan') : s === 'low' ? t('Kam qoldi') : t('Yetarli');
    };
    const rows = list.map((p) => [
      p.name,
      p.category?.name || '',
      p.code || '',
      p.quantity,
      unitLabel(p.unit),
      p.minQty || '',
      p.avgPrice || '',
      (p.quantity > 0 ? p.quantity : 0) * (p.avgPrice || 0) || '',
      statusText(p),
      p.note || '',
    ]);
    const totalValue = list.reduce((s, p) => s + Math.max(p.quantity, 0) * (p.avgPrice || 0), 0);
    if (rows.length) {
      const total = [t('JAMI'), '', '', '', '', '', '', totalValue, '', ''];
      total.__bold = true;
      rows.push(total);
    }
    return {
      filename: `ombor-qoldiq-${toDateInput()}.xlsx`,
      rowCount: list.length,
      sheets: [
        {
          name: t('Ombor'),
          title: t('Ombor qoldiqlari'),
          subtitle: `${t('Sana')}: ${new Date().toLocaleString('ru-RU')}`,
          columns: [
            { header: t('Mahsulot'), width: 34 },
            { header: t('Kategoriya'), width: 20 },
            { header: t('Kod'), width: 12 },
            { header: t('Qoldiq'), width: 12, type: 'num' },
            { header: t('Birlik'), width: 10 },
            { header: t('Minimal'), width: 12, type: 'num' },
            { header: `${t("O'rtacha narx")}, ${currency()}`, width: 16, type: 'money' },
            { header: `${t('Qiymati')}, ${currency()}`, width: 18, type: 'money' },
            { header: t('Holati'), width: 14 },
            { header: t('Izoh'), width: 24 },
          ],
          rows,
        },
      ],
    };
  }

  return (
    <>
      <TopBar
        title={t('Ombor')}
        sub={data ? t('{n} ta mahsulot', { n: data.length }) : ' '}
        right={
          <>
            <ExportButton build={buildExport} title={t('Ombor qoldiqlari')} />
            {can('write') && (
              <button className="icon-btn" onClick={() => setFormOpen(true)} aria-label={t("Mahsulot qo'shish")}>
                <Plus />
              </button>
            )}
          </>
        }
      />
      <div className="page stack" style={{ gap: 10 }}>
        <div className="search">
          <Search />
          <input placeholder={t('Mahsulot qidirish…')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="chips">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>
            {t('Barchasi')} {cats.data && <span className="count">{totalCount}</span>}
          </button>
          {(cats.data || []).map((c) => (
            <button key={c._id} className={`chip ${category === c._id ? 'active' : ''}`} onClick={() => setCategory(c._id)}>
              <span className="dot" style={{ background: c.color }} />
              {c.name}
              <span className="count">{c.productCount}</span>
            </button>
          ))}
        </div>

        <div className="segmented">
          {STATUS.map((s) => (
            <button key={s.v} className={status === s.v ? 'active' : ''} onClick={() => setStatus(s.v)}>
              {t(s.l)}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <ListSkeleton rows={6} />
        ) : data.length === 0 ? (
          <div className="card">
            <Empty
              icon={Boxes}
              title={t('Mahsulot topilmadi')}
              text={search || category || status ? t("Filtrni o'zgartirib ko'ring") : t("Birinchi mahsulotni qo'shing")}
              action={
                can('write') &&
                !search && (
                  <button className="btn btn-primary btn-sm" onClick={() => setFormOpen(true)}>
                    <Plus /> {t("Mahsulot qo'shish")}
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="list">
            {data.map((p) => {
              const s = stockStatus(p);
              const pct = p.minQty > 0 ? Math.min(100, (p.quantity / (p.minQty * 3)) * 100) : null;
              return (
                <Link key={p._id} href={`/ombor/${p._id}`} className="list-item">
                  <CategoryAvatar category={p.category} />
                  <div className="grow">
                    <div className="title ellipsis">{p.name}</div>
                    <div className="meta ellipsis">
                      {p.category?.name || t('Kategoriyasiz')}
                      {p.code ? ` · ${p.code}` : ''}
                    </div>
                    {pct !== null && (
                      <div className="progress mt-8" style={{ maxWidth: 160 }}>
                        <span
                          style={{
                            width: `${Math.max(pct, 3)}%`,
                            background: s === 'ok' ? 'var(--in)' : s === 'low' ? 'var(--warn)' : 'var(--danger)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="end">
                    <div className="bold tabular" style={{ fontSize: 16 }}>
                      {num(p.quantity)} <span className="small muted">{unitLabel(p.unit)}</span>
                    </div>
                    <StockBadge product={p} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(p) => {
          reload();
          cats.reload();
          router.push(`/ombor/${p._id}`);
        }}
      />
    </>
  );
}

export default function OmborPage() {
  return (
    <Suspense fallback={null}>
      <OmborInner />
    </Suspense>
  );
}
