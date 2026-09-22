'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boxes, Plus, Search } from 'lucide-react';
import { TopBar, CategoryAvatar, ListSkeleton, Empty, ErrorBox, StockBadge } from '@/components/ui';
import ProductForm from '@/components/ProductForm';
import { useApi, useDebounced } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { num, stockStatus } from '@/lib/format';

const STATUS = [
  { v: '', l: 'Hammasi' },
  { v: 'low', l: 'Kam qolgan' },
  { v: 'empty', l: 'Tugagan' },
];

function OmborInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { can } = useAuth();
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

  return (
    <>
      <TopBar
        title="Ombor"
        sub={data ? `${data.length} ta mahsulot` : ' '}
        right={
          can('write') && (
            <button className="icon-btn" onClick={() => setFormOpen(true)} aria-label="Mahsulot qo'shish">
              <Plus />
            </button>
          )
        }
      />
      <div className="page stack" style={{ gap: 10 }}>
        <div className="search">
          <Search />
          <input placeholder="Mahsulot qidirish…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="chips">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>
            Barchasi {cats.data && <span className="count">{totalCount}</span>}
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
              {s.l}
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
              title="Mahsulot topilmadi"
              text={search || category || status ? 'Filtrni o\'zgartirib ko\'ring' : 'Birinchi mahsulotni qo\'shing'}
              action={
                can('write') &&
                !search && (
                  <button className="btn btn-primary btn-sm" onClick={() => setFormOpen(true)}>
                    <Plus /> Mahsulot qo'shish
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
                      {p.category?.name || 'Kategoriyasiz'}
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
                      {num(p.quantity)} <span className="small muted">{p.unit}</span>
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
