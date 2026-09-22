'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, History, Pencil, Trash2 } from 'lucide-react';
import { TopBar, CategoryAvatar, ListSkeleton, Empty, ErrorBox, Sheet, StockBadge, useToast } from '@/components/ui';
import MovementItem, { MovementDetail } from '@/components/MovementItem';
import ProductForm from '@/components/ProductForm';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { num, money, dayKey, dayLabel } from '@/lib/format';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();
  const { data: p, error, reload } = useApi(`/products/${id}`);
  const moves = useApi('/movements', { product: id, limit: 100 });
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function remove() {
    if (!confirm(`"${p.name}" o'chirilsinmi? Tarixi bo'lsa, arxivga o'tkaziladi.`)) return;
    try {
      await api.del(`/products/${id}`);
      toast('Mahsulot o\'chirildi');
      router.replace('/ombor');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  async function cancelMove(m) {
    if (!confirm('Bu harakat bekor qilinsinmi? Qoldiq qayta hisoblanadi.')) return;
    try {
      await api.del(`/movements/${m._id}`);
      toast('Harakat bekor qilindi');
      setSelected(null);
      reload();
      moves.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  if (error) {
    return (
      <>
        <TopBar title="Mahsulot" back="/ombor" />
        <div className="page">
          <ErrorBox error={error} onRetry={reload} />
        </div>
      </>
    );
  }

  const groups = [];
  for (const m of moves.data?.items || []) {
    const k = dayKey(m.date);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, date: m.date, items: [] });
    groups[groups.length - 1].items.push(m);
  }

  return (
    <>
      <TopBar
        title={p?.name || 'Yuklanmoqda…'}
        sub={p?.category?.name || (p ? 'Kategoriyasiz' : '')}
        back="/ombor"
        right={
          p &&
          can('write') && (
            <button className="icon-btn" onClick={() => setEditOpen(true)} aria-label="Tahrirlash">
              <Pencil />
            </button>
          )
        }
      />
      <div className="page">
        {!p ? (
          <ListSkeleton rows={3} />
        ) : (
          <>
            <div className="card qty-hero">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CategoryAvatar category={p.category} />
              </div>
              <div className="small muted mt-12">Omborda qoldiq</div>
              <div className="mt-8">
                <span className="q">{num(p.quantity)}</span>
                <span className="u">{p.unit}</span>
              </div>
              <div className="mt-8">
                <StockBadge product={p} />
              </div>
              {can('write') && (
                <div className="grid-2 mt-16">
                  <button className="btn btn-in" onClick={() => router.push(`/kirim?product=${p._id}`)}>
                    <ArrowDownToLine /> Kirim
                  </button>
                  <button
                    className="btn btn-out"
                    disabled={p.quantity <= 0}
                    onClick={() => router.push(`/chiqim?product=${p._id}`)}
                  >
                    <ArrowUpFromLine /> Chiqim
                  </button>
                </div>
              )}
            </div>

            <div className="list mt-12">
              <div className="kv">
                <span className="k">30 kunda kirim</span>
                <span className="v c-in tabular">
                  +{num(p.last30.in)} {p.unit}
                </span>
              </div>
              <div className="kv">
                <span className="k">30 kunda chiqim</span>
                <span className="v c-out tabular">
                  −{num(p.last30.out)} {p.unit}
                </span>
              </div>
              {p.last30.out > 0 && p.quantity > 0 && (
                <div className="kv">
                  <span className="k">Taxminan yetadi</span>
                  <span className="v">{Math.floor(p.quantity / (p.last30.out / 30))} kun</span>
                </div>
              )}
              <div className="kv">
                <span className="k">Minimal qoldiq</span>
                <span className="v tabular">{p.minQty > 0 ? `${num(p.minQty)} ${p.unit}` : 'Belgilanmagan'}</span>
              </div>
              {p.avgPrice > 0 && (
                <>
                  <div className="kv">
                    <span className="k">O'rtacha narx</span>
                    <span className="v tabular">
                      {money(p.avgPrice)} / {p.unit}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">Qoldiq qiymati</span>
                    <span className="v tabular">{money(Math.max(p.quantity, 0) * p.avgPrice)}</span>
                  </div>
                </>
              )}
              {p.code && (
                <div className="kv">
                  <span className="k">Kod / artikul</span>
                  <span className="v">{p.code}</span>
                </div>
              )}
              {p.note && (
                <div className="kv">
                  <span className="k">Izoh</span>
                  <span className="v">{p.note}</span>
                </div>
              )}
            </div>

            <div className="section-title">
              <span>Harakatlar tarixi</span>
            </div>
            {moves.loading && !moves.data ? (
              <ListSkeleton rows={3} />
            ) : groups.length === 0 ? (
              <div className="card">
                <Empty icon={History} title="Harakat yo'q" text="Bu mahsulot bo'yicha hali kirim-chiqim qilinmagan" />
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key}>
                  <div className="day-head">{dayLabel(g.date)}</div>
                  <div className="list">
                    {g.items.map((m) => (
                      <MovementItem key={m._id} m={m} hideProduct onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              ))
            )}

            {can('admin') && (
              <button className="btn btn-danger btn-block mt-24" onClick={remove}>
                <Trash2 /> Mahsulotni o'chirish
              </button>
            )}
          </>
        )}
      </div>

      <ProductForm open={editOpen} onClose={() => setEditOpen(false)} product={p} onSaved={() => reload()} />

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
