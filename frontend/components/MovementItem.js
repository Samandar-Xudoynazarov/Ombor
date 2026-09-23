'use client';

import { MoveAvatar } from './ui';
import { useT } from '@/lib/i18n';
import { num, time, dateShort, money, unitLabel, dateFull } from '@/lib/format';

// Chiqim qayerga ketgani (yoki kirim kimdan kelgani)
export function movementWhere(m, t = (s) => s) {
  if (m.type === 'in') {
    return [m.supplier, m.docNumber && `№${m.docNumber}`].filter(Boolean).join(' · ') || t('Kirim');
  }
  const parts = [
    m.department?.name,
    m.vehicle && `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}`,
    m.person,
  ];
  return parts.filter(Boolean).join(' · ') || t('Chiqim');
}

export default function MovementItem({ m, onClick, showDate, hideProduct }) {
  const t = useT();
  const inT = m.type === 'in';
  return (
    <button className="list-item" onClick={onClick}>
      <MoveAvatar type={m.type} />
      <div className="grow">
        <div className="title ellipsis">
          {hideProduct ? (inT ? t('Kirim') : t('Chiqim')) : m.product?.name || t("O'chirilgan mahsulot")}
        </div>
        <div className="meta ellipsis">{movementWhere(m, t)}</div>
      </div>
      <div className="end">
        <div className={`bold tabular ${inT ? 'c-in' : 'c-out'}`}>
          {inT ? '+' : '−'}
          {num(m.quantity)} <span className="small">{unitLabel(m.product?.unit)}</span>
        </div>
        <div className="xs faint tabular">
          {showDate ? `${dateShort(m.date)}, ` : ''}
          {time(m.date)}
        </div>
      </div>
    </button>
  );
}

export function MovementDetail({ m }) {
  const t = useT();
  const inT = m.type === 'in';
  const rows = [
    [t('Turi'), inT ? t('Kirim') : t('Chiqim')],
    [t('Mahsulot'), m.product?.name],
    [t('Miqdor'), `${num(m.quantity)} ${unitLabel(m.product?.unit)}`],
    [t('Sana'), `${dateFull(m.date)}, ${time(m.date)}`],
    inT && [t('Yetkazib beruvchi'), m.supplier],
    inT && [t('Hujjat (nakladnoy) №'), m.docNumber],
    !inT && [t("Bo'lim / sex"), m.department?.name],
    !inT && [t('Texnika'), m.vehicle && `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}`],
    [t("Mas'ul shaxs"), m.person],
    m.price > 0 && [t('Birlik narxi'), money(m.price)],
    m.total > 0 && [t('Jami summa'), money(m.total)],
    [t('Keyingi qoldiq'), `${num(m.balanceAfter)} ${unitLabel(m.product?.unit)}`],
    [t('Izoh'), m.note],
    [t('Kiritdi'), m.createdBy?.name],
  ].filter((r) => r && r[1]);
  return (
    <div className="list">
      {rows.map(([k, v]) => (
        <div className="kv" key={k}>
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </div>
  );
}
