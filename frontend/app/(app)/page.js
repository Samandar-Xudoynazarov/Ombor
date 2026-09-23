'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, CircleX, History, Settings, Tags } from 'lucide-react';
import { TopBar, CategoryAvatar, ListSkeleton, Empty, ErrorBox, Sheet, StockBadge } from '@/components/ui';
import MovementItem, { MovementDetail } from '@/components/MovementItem';
import { useApi } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { num, money, longDate, unitLabel } from '@/lib/format';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 5) return 'Xayrli tun';
  if (h < 11) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const t = useT();
  const router = useRouter();
  const dayStart = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), []);
  const { data, loading, error, reload } = useApi('/stats/dashboard', { dayStart });
  const [selected, setSelected] = useState(null);

  return (
    <>
      <TopBar
        title={`${t(greetingKey())}, ${user.name.split(' ')[0]}`}
        sub={longDate()}
        right={
          <Link href="/sozlamalar" className="icon-btn" aria-label={t('Sozlamalar')}>
            <Settings />
          </Link>
        }
      />
      <div className="page">
        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : (
          <>
            <div className="hero">
              <div className="hero-label">{t('Ombordagi tovarlar qiymati')}</div>
              <div className="hero-value">{data ? money(data.stockValue) : '—'}</div>
              <div className="small" style={{ opacity: 0.85, marginTop: 4 }}>
                {data
                  ? `${t('{n} xil mahsulot', { n: data.productCount })} · ${t('{n} kategoriya', { n: data.categoryCount })}`
                  : ' '}
              </div>
              {can('write') && (
                <div className="hero-actions">
                  <button className="hero-btn solid" onClick={() => router.push('/kirim')}>
                    <ArrowDownToLine size={19} /> {t('Kirim')}
                  </button>
                  <button className="hero-btn" onClick={() => router.push('/chiqim')}>
                    <ArrowUpFromLine size={19} /> {t('Chiqim')}
                  </button>
                </div>
              )}
            </div>

            <div className="stat-grid mt-12">
              <Link href="/ombor" className="card stat">
                <span className="label">
                  <Boxes /> {t('Mahsulotlar')}
                </span>
                <span className="value">{data ? data.productCount : '—'}</span>
              </Link>
              <Link href="/ombor?status=low" className="card stat">
                <span className="label c-warn">
                  <AlertTriangle /> {t('Kam qolgan')}
                </span>
                <span className="value">{data ? data.lowCount : '—'}</span>
              </Link>
              <Link href="/tarix?type=in" className="card stat">
                <span className="label c-in">
                  <ArrowDownToLine /> {t('Bugun kirim')}
                </span>
                <span className="value">{data ? data.todayIn : '—'}</span>
              </Link>
              <Link href="/tarix?type=out" className="card stat">
                <span className="label c-out">
                  <ArrowUpFromLine /> {t('Bugun chiqim')}
                </span>
                <span className="value">{data ? data.todayOut : '—'}</span>
              </Link>
            </div>

            {data && data.productCount === 0 && (
              <div className="card card-pad mt-16">
                <div className="row">
                  <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                    <Tags />
                  </div>
                  <div className="grow">
                    <div className="bold">{t('Boshlash uchun')}</div>
                    <div className="small muted">
                      {t("Avval kategoriyalarni sozlang, keyin mahsulotlarni qo'shib, kirim qiling.")}
                    </div>
                  </div>
                </div>
                <div className="grid-2 mt-12">
                  <Link href="/sozlamalar/kategoriyalar" className="btn btn-ghost btn-sm">
                    {t('Kategoriyalar')}
                  </Link>
                  <Link href="/ombor?yangi=1" className="btn btn-primary btn-sm">
                    {t("Mahsulot qo'shish")}
                  </Link>
                </div>
              </div>
            )}

            {data && data.lowStock.length > 0 && (
              <>
                <div className="section-title">
                  <span>{t('Tugayapti')}</span>
                  <Link href="/ombor?status=low">{t('Barchasi')}</Link>
                </div>
                <div className="list">
                  {data.lowStock.slice(0, 5).map((p) => (
                    <Link key={p._id} href={`/ombor/${p._id}`} className="list-item">
                      <CategoryAvatar category={p.category} />
                      <div className="grow">
                        <div className="title ellipsis">{p.name}</div>
                        <div className="meta">
                          {t('Min')}: {num(p.minQty)} {unitLabel(p.unit)}
                        </div>
                      </div>
                      <div className="end">
                        <div className="bold tabular">
                          {num(p.quantity)} <span className="small muted">{unitLabel(p.unit)}</span>
                        </div>
                        <StockBadge product={p} />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {data && data.emptyCount > 0 && (
              <Link href="/ombor?status=empty" className="card card-pad row mt-12">
                <CircleX className="c-danger" size={20} />
                <span className="grow small">{t('{n} ta mahsulot omborda qolmagan', { n: data.emptyCount })}</span>
                <span className="small" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {t("Ko'rish")}
                </span>
              </Link>
            )}

            <div className="section-title">
              <span>{t("So'nggi harakatlar")}</span>
              <Link href="/tarix">{t('Barchasi')}</Link>
            </div>
            {loading && !data ? (
              <ListSkeleton rows={4} />
            ) : data.recent.length === 0 ? (
              <div className="card">
                <Empty
                  icon={History}
                  title={t("Hali harakat yo'q")}
                  text={t("Kirim yoki chiqim qilinganda shu yerda ko'rinadi")}
                />
              </div>
            ) : (
              <div className="list">
                {data.recent.map((m) => (
                  <MovementItem key={m._id} m={m} showDate onClick={() => setSelected(m)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={t('Harakat tafsilotlari')}>
        {selected && <MovementDetail m={selected} />}
      </Sheet>
    </>
  );
}
