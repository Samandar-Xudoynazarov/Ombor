'use client';

import { MoveAvatar } from './ui';
import { num, time, dateShort, money } from '@/lib/format';

// Harakat qatori (kirim yoki chiqim)
export function movementWhere(m) {
  if (m.type === 'in') {
    return [m.supplier, m.docNumber && `№${m.docNumber}`].filter(Boolean).join(' · ') || 'Kirim';
  }
  const parts = [m.department?.name, m.vehicle && `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}`, m.person];
  return parts.filter(Boolean).join(' · ') || 'Chiqim';
}

export default function MovementItem({ m, onClick, showDate, hideProduct }) {
  const inT = m.type === 'in';
  return (
    <button className="list-item" onClick={onClick}>
      <MoveAvatar type={m.type} />
      <div className="grow">
        <div className="title ellipsis">{hideProduct ? (inT ? 'Kirim' : 'Chiqim') : m.product?.name || "O'chirilgan mahsulot"}</div>
        <div className="meta ellipsis">{movementWhere(m)}</div>
      </div>
      <div className="end">
        <div className={`bold tabular ${inT ? 'c-in' : 'c-out'}`}>
          {inT ? '+' : '−'}
          {num(m.quantity)} <span className="small">{m.product?.unit}</span>
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
  const inT = m.type === 'in';
  const rows = [
    ['Turi', inT ? 'Kirim' : 'Chiqim'],
    ['Mahsulot', m.product?.name],
    ['Miqdor', `${num(m.quantity)} ${m.product?.unit || ''}`],
    ['Sana', `${dateShort(m.date)} ${new Date(m.date).getFullYear()}, ${time(m.date)}`],
    inT && ['Yetkazib beruvchi', m.supplier],
    inT && ['Hujjat (nakladnoy) №', m.docNumber],
    !inT && ["Bo'lim / sex", m.department?.name],
    !inT && ['Texnika', m.vehicle && `${m.vehicle.name}${m.vehicle.code ? ` (${m.vehicle.code})` : ''}`],
    ["Mas'ul shaxs", m.person],
    m.price > 0 && ['Birlik narxi', money(m.price)],
    m.total > 0 && ['Jami summa', money(m.total)],
    ['Keyingi qoldiq', `${num(m.balanceAfter)} ${m.product?.unit || ''}`],
    ['Izoh', m.note],
    ['Kiritdi', m.createdBy?.name],
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
