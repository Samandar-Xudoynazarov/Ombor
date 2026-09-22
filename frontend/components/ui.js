'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine, ArrowUpFromLine, BrickWall, Cable, CircleAlert, CircleCheck, ChevronLeft, Cog,
  Droplet, FlaskConical, Fuel, Hammer, Layers, Package, PaintBucket, Shirt, Truck, Wrench, X, Zap,
  Lightbulb, Tractor, Factory,
} from 'lucide-react';
import { stockStatus } from '@/lib/format';

/* ---------- Kategoriya ikonkalari ---------- */
export const CATEGORY_ICONS = {
  box: Package, fuel: Fuel, droplet: Droplet, layers: Layers, cog: Cog, brick: BrickWall,
  wrench: Wrench, zap: Zap, hammer: Hammer, paint: PaintBucket, shirt: Shirt, flask: FlaskConical,
  truck: Truck, cable: Cable, bulb: Lightbulb, tractor: Tractor, factory: Factory,
};
export const CATEGORY_COLORS = [
  '#2563eb', '#0ea5e9', '#10b981', '#84cc16', '#f59e0b', '#f97316',
  '#ef4444', '#ec4899', '#8b5cf6', '#64748b', '#78716c', '#0f766e',
];

export function CategoryAvatar({ category, size }) {
  const Icon = CATEGORY_ICONS[category?.icon] || Package;
  const color = category?.color || '#64748b';
  return (
    <div
      className={`avatar ${size === 'sm' ? 'sm' : ''}`}
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      <Icon />
    </div>
  );
}

export function MoveAvatar({ type, size }) {
  const inT = type === 'in';
  const Icon = inT ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <div
      className={`avatar ${size === 'sm' ? 'sm' : ''}`}
      style={{ background: inT ? 'var(--in-soft)' : 'var(--out-soft)', color: inT ? 'var(--in)' : 'var(--out)' }}
    >
      <Icon />
    </div>
  );
}

export function StockBadge({ product }) {
  const s = stockStatus(product);
  if (s === 'empty') return <span className="badge b-empty">Tugagan</span>;
  if (s === 'low') return <span className="badge b-low">Kam qoldi</span>;
  return <span className="badge b-ok">Yetarli</span>;
}

/* ---------- Yuqori panel ---------- */
export function TopBar({ title, sub, back, right }) {
  const router = useRouter();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back && (
          <button
            className="icon-btn plain"
            aria-label="Orqaga"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(back === true ? '/' : back))}
            style={{ marginLeft: -8 }}
          >
            <ChevronLeft />
          </button>
        )}
        <div className="grow">
          <h1 className="ellipsis">{title}</h1>
          {sub && <div className="sub ellipsis">{sub}</div>}
        </div>
        {right}
      </div>
    </header>
  );
}

/* ---------- Bottom sheet ---------- */
export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        {title && (
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="icon-btn plain" onClick={onClose} aria-label="Yopish">
              <X />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div style={{ padding: '0 16px 16px' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, type }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'error' ? <CircleAlert /> : <CircleCheck />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ---------- Bo'sh holat, yuklanish ---------- */
export function Empty({ icon: Icon = Package, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon />
      </div>
      {title && <h3>{title}</h3>}
      {text && <p className="small">{text}</p>}
      {action && <div className="mt-16">{action}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="list-item">
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12 }} />
          <div className="grow stack" style={{ gap: 8 }}>
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
            <div className="skeleton" style={{ height: 12, width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" />;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <Empty
      icon={CircleAlert}
      title="Ma'lumot yuklanmadi"
      text={error?.message}
      action={
        onRetry && (
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Qayta urinish
          </button>
        )
      }
    />
  );
}
