'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, History, Pencil, Trash2 } from 'lucide-react';
import { TopBar, CategoryAvatar, ListSkeleton, Empty, ErrorBox, Sheet, StockBadge, useToast } from '@/components/ui';
import MovementItem, { MovementDetail } from '@/components/MovementItem';
import ProductForm from '@/components/ProductForm';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { num, money, dayKey, dayLabelKey, unitLabel } from '@/lib/format';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const { can } = useAuth();
  const { data: p, error, reload } = useApi(`/products/${id}`);
  const moves = useApi('/movements', { product: id, limit: 100 });
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const dayLabel = (d) => {
    const r = dayLabelKey(d);
    return r.key ? t(r.key) : r.text;
  };

  async function remove() {
    if (!confirm(t('"{name}" o\'chirilsinmi? Tarixi bo\'lsa, arxivga o\'tkaziladi.', { name: p.name }))) return;
    try {
      await api.del(`/products/${id}`);
      toast(t("Mahsulot o'chirildi"));
      router.replace('/ombor');
    } catch (e) {
      toast(t(e.message), 'error');
    }
  }

  async function cancelMove(m) {
    if (!confirm(t('Bu harakat bekor qilinsinmi? Qoldiq qayta hisoblanadi.'))) return;
    try {
      await api.del(`/movements/${m._id}`);
      toast(t('Harakat bekor qilindi'));
      setSelected(null);
      reload();
      moves.reload();
    } catch (e) {
      toast(t(e.message), 'error');
    }
  }

  if (error) {
    return (
      <>
        <TopBar title={t('Mahsulot')} back="/ombor" />
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
        title={p?.name || t('Yuklanmoqda…')}
        sub={p?.category?.name || (p ? t('Kategoriyasiz') : '')}
        back="/ombor"
        right={
          p &&
          can('write') && (
            <button className="icon-btn" onClick={() => setEditOpen(true)} aria-label={t('Tahrirlash')}>
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
              <div className="small muted mt-12">{t('Omborda qoldiq')}</div>
              <div className="mt-8">
                <span className="q">{num(p.quantity)}</span>
                <span className="u">{unitLabel(p.unit)}</span>
              </div>
              <div className="mt-8">
                <StockBadge product={p} />
              </div>
              {can('write') && (
                <div className="grid-2 mt-16">
                  <button className="btn btn-in" onClick={() => router.push(`/kirim?product=${p._id}`)}>
                    <ArrowDownToLine /> {t('Kirim')}
                  </button>
                  <button
                    className="btn btn-out"
                    disabled={p.quantity <= 0}
                    onClick={() => router.push(`/chiqim?product=${p._id}`)}
                  >
                    <ArrowUpFromLine /> {t('Chiqim')}
                  </button>
                </div>
              )}
            </div>

            <div className="list mt-12">
              <div className="kv">
                <span className="k">{t('30 kunda kirim')}</span>
                <span className="v c-in tabular">
                  +{num(p.last30.in)} {unitLabel(p.unit)}
                </span>
              </div>
              <div className="kv">
                <span className="k">{t('30 kunda chiqim')}</span>
                <span className="v c-out tabular">
                  −{num(p.last30.out)} {unitLabel(p.unit)}
                </span>
              </div>
              {p.last30.out > 0 && p.quantity > 0 && (
                <div className="kv">
                  <span className="k">{t('Taxminan yetadi')}</span>
                  <span className="v">{t('{n} kun', { n: Math.floor(p.quantity / (p.last30.out / 30)) })}</span>
                </div>
              )}
              <div className="kv">
                <span className="k">{t('Minimal qoldiq')}</span>
                <span className="v tabular">
                  {p.minQty > 0 ? `${num(p.minQty)} ${unitLabel(p.unit)}` : t('Belgilanmagan')}
                </span>
              </div>
              {p.avgPrice > 0 && (
                <>
                  <div className="kv">
                    <span className="k">{t("O'rtacha narx")}</span>
                    <span className="v tabular">
                      {money(p.avgPrice)} / {unitLabel(p.unit)}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">{t('Qoldiq qiymati')}</span>
                    <span className="v tabular">{money(Math.max(p.quantity, 0) * p.avgPrice)}</span>
                  </div>
                </>
              )}
              {p.code && (
                <div className="kv">
                  <span className="k">{t('Kod / artikul')}</span>
                  <span className="v">{p.code}</span>
                </div>
              )}
              {p.note && (
                <div className="kv">
                  <span className="k">{t('Izoh')}</span>
                  <span className="v">{p.note}</span>
                </div>
              )}
            </div>

            <div className="section-title">
              <span>{t('Harakatlar tarixi')}</span>
            </div>
            {moves.loading && !moves.data ? (
              <ListSkeleton rows={3} />
            ) : groups.length === 0 ? (
              <div className="card">
                <Empty
                  icon={History}
                  title={t("Harakat yo'q")}
                  text={t("Bu mahsulot bo'yicha hali kirim-chiqim qilinmagan")}
                />
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
                <Trash2 /> {t("Mahsulotni o'chirish")}
              </button>
            )}
          </>
        )}
      </div>

      <ProductForm open={editOpen} onClose={() => setEditOpen(false)} product={p} onSaved={() => reload()} />

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
