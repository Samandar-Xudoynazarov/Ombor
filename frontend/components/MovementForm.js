'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, CircleCheck, ChevronRight, Package, Plus } from 'lucide-react';
import { TopBar, CategoryAvatar, Sheet, useToast } from './ui';
import ProductPicker from './ProductPicker';
import ProductForm from './ProductForm';
import { useApi } from '@/lib/hooks';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { num, money, toLocalInput, unitLabel, currency } from '@/lib/format';

// Kirim va chiqim uchun umumiy forma. type: 'in' | 'out'
export default function MovementForm({ type }) {
  const inT = type === 'in';
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const t = useT();

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
    return {
      quantity: '', price: '', supplier: '', docNumber: '',
      department: '', vehicle: '', person: '', note: '', date: toLocalInput(),
    };
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
    if (!product) return toast(t('Mahsulotni tanlang'), 'error');
    if (!(qty > 0)) return toast(t('Miqdorni kiriting'), 'error');
    if (over) return toast(t('Omborda faqat {q} {unit} bor', { q: num(product.quantity), unit: unitLabel(product.unit) }), 'error');
    if (!inT && !f.department && !f.vehicle && !f.person.trim()) {
      return toast(t("Qayerga ketganini ko'rsating: bo'lim, texnika yoki mas'ul shaxs"), 'error');
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
      toast(t(err.message), 'error');
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
      <TopBar
        title={inT ? t('Kirim') : t('Chiqim')}
        sub={inT ? t('Omborga tovar qabul qilish') : t('Ombordan tovar berish')}
        back
      />
      <form className="page stack" onSubmit={submit}>
        {/* Mahsulot */}
        <div className="field">
          <span className="field-label">{t('Mahsulot')}</span>
          <button type="button" className={`picker-btn ${product ? 'filled' : ''}`} onClick={() => setPickerOpen(true)}>
            {product ? (
              <>
                <CategoryAvatar category={product.category} />
                <div className="grow">
                  <div className="bold ellipsis">{product.name}</div>
                  <div className="small muted">
                    {t('Qoldiq')}: <b className="tabular">{num(product.quantity)}</b> {unitLabel(product.unit)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="avatar" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                  <Package />
                </div>
                <div className="grow muted">{t('Mahsulotni tanlang')}</div>
              </>
            )}
            <ChevronRight className="chev" />
          </button>
        </div>

        {/* Miqdor */}
        <div className="field">
          <label htmlFor="qty">{t('Miqdor')}</label>
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
            <span className="suffix">{product ? unitLabel(product.unit) : ''}</span>
          </div>
          {over && (
            <span className="xs c-danger">
              {t('Omborda faqat {q} {unit} bor', { q: num(product.quantity), unit: unitLabel(product.unit) })}
            </span>
          )}
          {!inT && product && product.quantity > 0 && !over && (
            <div className="chips" style={{ marginTop: 2 }}>
              {[0.25, 0.5, 1].map((k) => (
                <button
                  type="button"
                  key={k}
                  className="chip"
                  onClick={() => setF((x) => ({ ...x, quantity: String(Math.round(product.quantity * k * 1000) / 1000) }))}
                >
                  {k === 1 ? t('Hammasi') : `${k * 100}%`}
                </button>
              ))}
            </div>
          )}
        </div>

        {inT ? (
          <>
            <div className="field">
              <label>{t('Birlik narxi')} ({currency()})</label>
              <input className="input" type="text" inputMode="decimal" placeholder={t('Ixtiyoriy')} value={f.price} onChange={set('price')} />
              {price > 0 && qty > 0 && <span className="hint">{t('Jami')}: {money(price * qty)}</span>}
            </div>
            <div className="field">
              <label>{t('Yetkazib beruvchi')}</label>
              <input className="input" placeholder={t('Masalan: Uzbekneftegaz')} value={f.supplier} onChange={set('supplier')} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>{t('Nakladnoy №')}</label>
                <input className="input" placeholder={t('Ixtiyoriy')} value={f.docNumber} onChange={set('docNumber')} />
              </div>
              <div className="field">
                <label>{t('Qabul qildi')}</label>
                <input className="input" placeholder={t('F.I.Sh.')} value={f.person} onChange={set('person')} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <div className="row between">
                <label>{t("Bo'lim / sex")}</label>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ height: 26, padding: 0, color: 'var(--primary)', background: 'none' }}
                  onClick={() => setAddKind('department')}
                >
                  <Plus size={16} /> {t("Qo'shish")}
                </button>
              </div>
              <select className="select" value={f.department} onChange={set('department')}>
                <option value="">— {t('Tanlanmagan')} —</option>
                {(departments.data || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="row between">
                <label>{t('Texnika / mashina')}</label>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ height: 26, padding: 0, color: 'var(--primary)', background: 'none' }}
                  onClick={() => setAddKind('vehicle')}
                >
                  <Plus size={16} /> {t("Qo'shish")}
                </button>
              </div>
              <select className="select" value={f.vehicle} onChange={set('vehicle')}>
                <option value="">— {t('Tanlanmagan')} —</option>
                {(vehicles.data || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                    {d.code ? ` (${d.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("Mas'ul shaxs (kim oldi)")}</label>
              <input className="input" placeholder={t('F.I.Sh.')} value={f.person} onChange={set('person')} />
            </div>
          </>
        )}

        <div className="field">
          <label>{t('Sana va vaqt')}</label>
          <input className="input" type="datetime-local" value={f.date} onChange={set('date')} />
        </div>
        <div className="field">
          <label>{t('Izoh')}</label>
          <textarea className="textarea" placeholder={t('Ixtiyoriy')} value={f.note} onChange={set('note')} />
        </div>

        <div className="form-footer">
          <button className={`btn btn-block ${inT ? 'btn-in' : 'btn-out'}`} disabled={saving || !product || !(qty > 0) || over}>
            {inT ? <ArrowDownToLine /> : <ArrowUpFromLine />}
            {saving ? t('Saqlanmoqda…') : inT ? t('Kirimni saqlash') : t('Chiqimni saqlash')}
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
        onSaved={(target) => {
          if (target.kind === 'department') {
            departments.reload();
            setF((x) => ({ ...x, department: target._id }));
          } else {
            vehicles.reload();
            setF((x) => ({ ...x, vehicle: target._id }));
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
              <h2 style={{ fontSize: 20, fontWeight: 750 }}>{inT ? t('Kirim saqlandi') : t('Chiqim saqlandi')}</h2>
              <p className="muted mt-8">
                {done.product?.name}: {inT ? '+' : '−'}
                {num(done.quantity)} {unitLabel(done.product?.unit)}
                <br />
                {t('Yangi qoldiq')}:{' '}
                <b>
                  {num(done.balanceAfter)} {unitLabel(done.product?.unit)}
                </b>
              </p>
            </div>
            <button className={`btn btn-block ${inT ? 'btn-in' : 'btn-out'}`} onClick={() => again(false)}>
              {inT ? t('Yana kirim qilish') : t('Yana chiqim qilish')}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => again(true)}>
              {t('Shu mahsulotdan yana')}
            </button>
            <button className="btn btn-block" style={{ background: 'none', color: 'var(--primary)' }} onClick={() => router.push('/')}>
              {t('Bosh sahifaga')}
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

function TargetQuickAdd({ kind, onClose, onSaved }) {
  const toast = useToast();
  const t = useT();
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
      const target = await api.post('/targets', { kind, name, code });
      toast(t("Qo'shildi"));
      onSaved(target);
      onClose();
    } catch (err) {
      toast(t(err.message), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!kind} onClose={onClose} title={kind === 'vehicle' ? t('Yangi texnika') : t("Yangi bo'lim / sex")}>
      <form className="stack" onSubmit={save}>
        <div className="field">
          <label>{t('Nomi')}</label>
          <input
            className="input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'vehicle' ? t('Masalan: KamAZ 6520') : t('Masalan: 2-sex')}
          />
        </div>
        {kind === 'vehicle' && (
          <div className="field">
            <label>{t('Davlat raqami')}</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="01 A 123 BC" />
          </div>
        )}
        <button className="btn btn-primary btn-block" disabled={saving || !name.trim()}>
          {t('Saqlash')}
        </button>
      </form>
    </Sheet>
  );
}
