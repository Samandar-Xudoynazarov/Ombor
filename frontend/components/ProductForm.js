'use client';

import { useEffect, useState } from 'react';
import { Sheet, useToast } from './ui';
import { useApi } from '@/lib/hooks';
import { api } from '@/lib/api';
import { UNITS } from '@/lib/format';

const blank = { name: '', category: '', unit: 'dona', code: '', minQty: '', note: '' };

// Mahsulot qo'shish / tahrirlash oynasi
export default function ProductForm({ open, onClose, product, initialName, onSaved }) {
  const toast = useToast();
  const cats = useApi('/categories', null, { skip: !open });
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setF({
        name: product.name || '',
        category: product.category?._id || product.category || '',
        unit: product.unit || 'dona',
        code: product.code || '',
        minQty: product.minQty || '',
        note: product.note || '',
      });
    } else {
      setF({ ...blank, name: initialName || '' });
    }
  }, [open, product, initialName]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const unitOptions = UNITS.includes(f.unit) ? UNITS : [f.unit, ...UNITS];

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return toast('Mahsulot nomini kiriting', 'error');
    setSaving(true);
    try {
      const body = { ...f, minQty: Number(f.minQty) || 0, category: f.category || null };
      const saved = product ? await api.put(`/products/${product._id}`, body) : await api.post('/products', body);
      toast(product ? 'Saqlandi' : 'Mahsulot qo\'shildi');
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Nomi *</label>
          <input className="input" value={f.name} onChange={set('name')} placeholder="Masalan: Salarka (dizel)" autoFocus={!product} />
        </div>
        <div className="field">
          <label>Kategoriya</label>
          <select className="select" value={f.category} onChange={set('category')}>
            <option value="">— Kategoriyasiz —</option>
            {(cats.data || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>O'lchov birligi</label>
            <select className="select" value={f.unit} onChange={set('unit')}>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Minimal qoldiq</label>
            <input className="input" type="number" inputMode="decimal" step="any" min="0" value={f.minQty} onChange={set('minQty')} placeholder="0" />
          </div>
        </div>
        <div className="field">
          <label>Kod / artikul</label>
          <input className="input" value={f.code} onChange={set('code')} placeholder="Ixtiyoriy" />
        </div>
        <div className="field">
          <label>Izoh</label>
          <textarea className="textarea" value={f.note} onChange={set('note')} placeholder="Ixtiyoriy" />
        </div>
        <p className="xs faint">Qoldiq shu miqdordan kam bo'lsa, "Kam qoldi" deb ogohlantiriladi.</p>
        <button className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </form>
    </Sheet>
  );
}
