'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, History, House, PackagePlus, Plus, Settings, Warehouse,
} from 'lucide-react';
import { Sheet } from './ui';
import { useAuth } from '@/lib/auth';

const LINKS = [
  { href: '/', label: 'Asosiy', icon: House },
  { href: '/ombor', label: 'Ombor', icon: Boxes },
  null, // o'rtada + tugmasi
  { href: '/tarix', label: 'Tarix', icon: History },
  { href: '/hisobot', label: 'Hisobot', icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const canWrite = can('write');

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const go = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="bottom-nav">
        <div className="nav-brand">
          <div className="logo-mark sm">
            <Warehouse />
          </div>
          Zavod ombori
        </div>
        {LINKS.map((l, i) =>
          l ? (
            <Link key={l.href} href={l.href} className={`nav-item ${isActive(l.href) ? 'active' : ''}`}>
              <l.icon />
              <span>{l.label}</span>
            </Link>
          ) : (
            <div key={i} className="nav-fab-wrap">
              {canWrite && (
                <button className={`nav-fab ${open ? 'open' : ''}`} onClick={() => setOpen(true)} aria-label="Yangi amal">
                  <Plus />
                  <span className="fab-label" style={{ display: 'none' }}>
                    Yangi amal
                  </span>
                </button>
              )}
            </div>
          )
        )}
        <Link href="/sozlamalar" className={`nav-item nav-desktop ${isActive('/sozlamalar') ? 'active' : ''}`}>
          <Settings />
          <span>Sozlamalar</span>
        </Link>
      </nav>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nima qilamiz?">
        <div className="action-sheet-grid">
          <button className="action-tile" onClick={() => go('/kirim')}>
            <div className="avatar" style={{ background: 'var(--in-soft)', color: 'var(--in)' }}>
              <ArrowDownToLine />
            </div>
            <div>
              <div className="bold">Kirim</div>
              <div className="small muted">Omborga tovar keldi</div>
            </div>
          </button>
          <button className="action-tile" onClick={() => go('/chiqim')}>
            <div className="avatar" style={{ background: 'var(--out-soft)', color: 'var(--out)' }}>
              <ArrowUpFromLine />
            </div>
            <div>
              <div className="bold">Chiqim</div>
              <div className="small muted">Ombordan tovar berildi</div>
            </div>
          </button>
          <button className="action-tile" onClick={() => go('/ombor?yangi=1')}>
            <div className="avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <PackagePlus />
            </div>
            <div>
              <div className="bold">Yangi mahsulot</div>
              <div className="small muted">Ro'yxatga yangi nom qo'shish</div>
            </div>
          </button>
        </div>
      </Sheet>
    </>
  );
}
