'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, CircleCheck, ChevronRight, Package, Plus } from 'lucide-react';
import { TopBar, CategoryAvatar, Sheet, useToast } from './ui';
import ProductPicker from './ProductPicker';
import ProductForm from './ProductForm';
import { useApi } from '@/lib/hooks';
import { api } from '@/lib/api';
import { num, money, toLocalInput } from '@/lib/format';

const KIND_LABEL = { department: "Yangi bo'lim / sex", vehicle: 'Yangi texnika' };

// Kirim va chiqim uchun umumiy forma. type: 'in' | 'out'
export default function MovementForm({ type }) {
  const inT = type === 'in';
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(null); // boshlang'ich nom
  const [f, setF] = useState(() => initial());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [addKind, setAddKind] = useState(null);

  const departments = useApi('/targets', { kind: 'department' }, { skip: inT });
  const vehicles = useApi('/targets', { kind: 'vehicle' }, { skip: inT });

  function initial() {
    return { quantity: '', price: '', supplier: '', docNumber: '', department: '', vehicle: '', person: '', note: '', date: toLocalInput() };
  }

  // ?product=ID bo'lsa, mahsulotni avtomatik tanlash
  useEffect(() => {
    const pid = params.get('product');
    if (pid) api.get(`/products/${pid}`).then(setProduct).catch(() => {});
    else setPickerOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const qty = Number(String(f.quantity).replace(',', '.')) || 0;
  const price = Number(String(f.price).replace(',', '.')) || 0;
  const over = !inT && product && qty > product.quantity;

  async function submit(e) {
    e.preventDefault();
    if (!product) return toast('Mahsulotni tanlang', 'error');
    if (!(qty > 0)) return toast('Miqdorni kiriting', 'error');
    if (over) return toast(`Omborda faqat ${num(product.quantity)} ${product.unit} bor`, 'error');
    if (!inT && !f.department && !f.vehicle && !f.person.trim()) {
      return toast("Qayerga ketganini ko'rsating: bo'lim, texnika yoki mas'ul shaxs", 'error');
    }
    setSaving(true);
    try {
      const body = {
        product: product._id,
        quantity: qty,
        date: new Date(f.date).toISOString(),
        person: f.person,
        note: f.note,
        ...(inT
          ? { price, supplier: f.supplier, docNumber: f.docNumber }
          : { department: f.department || null, vehicle: f.vehicle || null }),
      };
      const m = await api.post(inT ? '/movements/in' : '/movements/out', body);
      setDone(m);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function again(sameProduct) {
    setDone(null);
    setF((x) => ({ ...initial(), department: x.department, vehicle: x.vehicle, person: x.person, supplier: x.supplier }));
    if (sameProduct && product) {
      api.get(`/products/${product._id}`).then(setProduct).catch(() => {});
    } else {
      setProduct(null);
      setPickerOpen(true);
    }
  }

  return (
    <>
      <TopBar title={inT ? 'Kirim' : 'Chiqim'} sub={inT ? 'Omborga tovar qabul qilish' : 'Ombordan tovar berish'} back />
      <form className="page stack" onSubmit={submit}>
        {/* Mahsulot */}
        <div className="field">
          <span className="field-label">Mahsulot</span>
          <button type="button" className={`picker-btn ${product ? 'filled' : ''}`} onClick={() => setPickerOpen(true)}>
            {product ? (
              <>
                <CategoryAvatar category={product.category} />
                <div className="grow">
                  <div className="bold ellipsis">{product.name}</div>
                  <div className="small muted">
                    Qoldiq: <b className="tabular">{num(product.quantity)}</b> {product.unit}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="avatar" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                  <Package />
                </div>
                <div className="grow muted">Mahsulotni tanlang</div>
              </>
            )}
            <ChevronRight className="chev" />
          </button>
        </div>

        {/* Miqdor */}
        <div className="field">
          <label htmlFor="qty">Miqdor</label>
          <div className="input-group">
            <input
              id="qty"
              className="input big"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={f.quantity}
              onChange={(e) => setF((x) => ({ ...x, quantity: e.target.value.replace(/[^0-9.,]/g, '') }))}
              style={over ? { borderColor: 'var(--danger)' } : undefined}
            />
            <span className="suffix">{product?.unit || ''}</span>
          </div>
          {over && <span className="xs c-danger">Omborda faqat {num(product.quantity)} {product.unit} bor</span>}
          {!inT && product && product.quantity > 0 && !over && (
            <div className="chips" style={{ marginTop: 2 }}>
              {[0.25, 0.5, 1].map((k) => (
                <button
                  type="button"
                  key={k}
                  className="chip"
                  onClick={() => setF((x) => ({ ...x, quantity: String(Math.round(product.quantity * k * 1000) / 1000) }))}
                >
                  {k === 1 ? 'Hammasi' : `${k * 100}%`}
                </button>
              ))}
            </div>
          )}
        </div>

        {inT ? (
          <>
            <div className="field">
              <label>Birlik narxi (so'm)</label>
              <input className="input" type="text" inputMode="decimal" placeholder="Ixtiyoriy" value={f.price} onChange={set('price')} />
              {price > 0 && qty > 0 && <span className="hint">Jami: {money(price * qty)}</span>}
            </div>
            <div className="field">
              <label>Yetkazib beruvchi</label>
              <input className="input" placeholder="Masalan: Uzbekneftegaz, “Temir savdo” MChJ" value={f.supplier} onChange={set('supplier')} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>Nakladnoy №</label>
                <input className="input" placeholder="Ixtiyoriy" value={f.docNumber} onChange={set('docNumber')} />
              </div>
              <div className="field">
                <label>Qabul qildi</label>
                <input className="input" placeholder="F.I.Sh." value={f.person} onChange={set('person')} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <div className="row between">
                <label>Bo'lim / sex</label>
                <button type="button" className="btn btn-sm" style={{ height: 26, padding: 0, color: 'var(--primary)', background: 'none' }} onClick={() => setAddKind('department')}>
                  <Plus size={16} /> Qo'shish
                </button>
              </div>
              <select className="select" value={f.department} onChange={set('department')}>
                <option value="">— Tanlanmagan —</option>
                {(departments.data || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="row between">
                <label>Texnika / mashina</label>
                <button type="button" className="btn btn-sm" style={{ height: 26, padding: 0, color: 'var(--primary)', background: 'none' }} onClick={() => setAddKind('vehicle')}>
                  <Plus size={16} /> Qo'shish
                </button>
              </div>
              <select className="select" value={f.vehicle} onChange={set('vehicle')}>
                <option value="">— Tanlanmagan —</option>
                {(vehicles.data || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                    {d.code ? ` (${d.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Mas'ul shaxs (kim oldi)</label>
              <input className="input" placeholder="F.I.Sh." value={f.person} onChange={set('person')} />
            </div>
          </>
        )}

        <div className="field">
          <label>Sana va vaqt</label>
          <input className="input" type="datetime-local" value={f.date} onChange={set('date')} />
        </div>
        <div className="field">
          <label>Izoh</label>
          <textarea className="textarea" placeholder="Ixtiyoriy" value={f.note} onChange={set('note')} />
        </div>

        <div className="form-footer">
          <button className={`btn btn-block ${inT ? 'btn-in' : 'btn-out'}`} disabled={saving || !product || !(qty > 0) || over}>
            {inT ? <ArrowDownToLine /> : <ArrowUpFromLine />}
            {saving ? 'Saqlanmoqda…' : inT ? 'Kirimni saqlash' : 'Chiqimni saqlash'}
          </button>
        </div>
      </form>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onlyInStock={!inT}
        onSelect={(p) => {
          setProduct(p);
          setPickerOpen(false);
          setTimeout(() => document.getElementById('qty')?.focus(), 150);
        }}
        onCreate={
          inT
            ? (name) => {
                setPickerOpen(false);
                setNewProduct(name || '');
              }
            : null
        }
      />

      <ProductForm
        open={newProduct !== null}
        initialName={newProduct}
        onClose={() => setNewProduct(null)}
        onSaved={(p) => setProduct(p)}
      />

      <TargetQuickAdd
        kind={addKind}
        onClose={() => setAddKind(null)}
        onSaved={(t) => {
          if (t.kind === 'department') {
            departments.reload();
            setF((x) => ({ ...x, department: t._id }));
          } else {
            vehicles.reload();
            setF((x) => ({ ...x, vehicle: t._id }));
          }
        }}
      />

      <Sheet open={!!done} onClose={() => router.push('/')}>
        {done && (
          <div className="stack" style={{ textAlign: 'center', paddingTop: 8 }}>
            <div
              className="avatar"
              style={{ margin: '0 auto', width: 64, height: 64, borderRadius: 20, background: 'var(--in-soft)', color: 'var(--in)' }}
            >
              <CircleCheck style={{ width: 32, height: 32 }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 750 }}>{inT ? 'Kirim saqlandi' : 'Chiqim saqlandi'}</h2>
              <p className="muted mt-8">
                {done.product?.name}: {inT ? '+' : '−'}
                {num(done.quantity)} {done.product?.unit}
                <br />
                Yangi qoldiq: <b>{num(done.balanceAfter)} {done.product?.unit}</b>
              </p>
            </div>
            <button className={`btn btn-block ${inT ? 'btn-in' : 'btn-out'}`} onClick={() => again(false)}>
              Yana {inT ? 'kirim' : 'chiqim'} qilish
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => again(true)}>
              Shu mahsulotdan yana
            </button>
            <button className="btn btn-block" style={{ background: 'none', color: 'var(--primary)' }} onClick={() => router.push('/')}>
              Bosh sahifaga
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function TargetQuickAdd({ kind, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName('');
    setCode('');
  }, [kind]);

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const t = await api.post('/targets', { kind, name, code });
      toast("Qo'shildi");
      onSaved(t);
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!kind} onClose={onClose} title={KIND_LABEL[kind]}>
      <form className="stack" onSubmit={save}>
        <div className="field">
          <label>Nomi</label>
          <input
            className="input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'vehicle' ? 'Masalan: KamAZ 6520' : 'Masalan: 2-sex'}
          />
        </div>
        {kind === 'vehicle' && (
          <div className="field">
            <label>Davlat raqami</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="01 A 123 BC" />
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={saving || !name.trim()}>
          Saqlash
        </button>
      </form>
    </Sheet>
  );
}
