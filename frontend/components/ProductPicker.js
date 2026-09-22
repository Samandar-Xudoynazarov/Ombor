'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Sheet, CategoryAvatar, Empty, ListSkeleton, StockBadge } from './ui';
import { useApi, useDebounced } from '@/lib/hooks';
import { num } from '@/lib/format';

// Mahsulot tanlash oynasi (qidiruv + kategoriya filtri)
export default function ProductPicker({ open, onClose, onSelect, onCreate, onlyInStock }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const q = useDebounced(search, 250);
  const cats = useApi('/categories', null, { skip: !open });
  const { data, loading } = useApi('/products', { search: q, category }, { skip: !open });

  const list = (data || []).filter((p) => !onlyInStock || p.quantity > 0);

  return (
    <Sheet open={open} onClose={onClose} title="Mahsulotni tanlang">
      <div className="stack" style={{ gap: 10 }}>
        <div className="search">
          <Search />
          <input
            autoFocus
            placeholder="Nomi yoki kodi bo'yicha qidirish"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chips">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>
            Barchasi
          </button>
          {(cats.data || []).map((c) => (
            <button
              key={c._id}
              className={`chip ${category === c._id ? 'active' : ''}`}
              onClick={() => setCategory(c._id)}
            >
              <span className="dot" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <ListSkeleton rows={4} />
        ) : list.length === 0 ? (
          <Empty
            title={onlyInStock ? 'Omborda mavjud mahsulot topilmadi' : 'Mahsulot topilmadi'}
            text={search ? `"${search}" bo'yicha hech narsa yo'q` : null}
          />
        ) : (
          <div className="list">
            {list.map((p) => (
              <button key={p._id} className="list-item" onClick={() => onSelect(p)}>
                <CategoryAvatar category={p.category} />
                <div className="grow">
                  <div className="title ellipsis">{p.name}</div>
                  <div className="meta ellipsis">{p.category?.name || 'Kategoriyasiz'}</div>
                </div>
                <div className="end">
                  <div className="bold tabular">
                    {num(p.quantity)} <span className="small muted">{p.unit}</span>
                  </div>
                  <StockBadge product={p} />
                </div>
              </button>
            ))}
          </div>
        )}

        {onCreate && (
          <button className="btn btn-soft btn-block" onClick={() => onCreate(search)}>
            <Plus /> Yangi mahsulot qo'shish
          </button>
        )}
      </div>
    </Sheet>
  );
}
