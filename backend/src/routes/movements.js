const router = require('express').Router();
const mongoose = require('mongoose');
const { Product, Movement } = require('../models');
const { auth, allow, httpError } = require('../middleware/auth');

router.use(auth);

const round = (n) => Math.round(n * 1000) / 1000;
const oid = (v) => (v && mongoose.isValidObjectId(v) ? new mongoose.Types.ObjectId(String(v)) : null);

function buildFilter(q) {
  const filter = {};
  if (q.type === 'in' || q.type === 'out') filter.type = q.type;
  if (oid(q.product)) filter.product = oid(q.product);
  if (oid(q.department)) filter.department = oid(q.department);
  if (oid(q.vehicle)) filter.vehicle = oid(q.vehicle);
  if (q.person) filter.person = new RegExp(String(q.person).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = new Date(q.from);
    if (q.to) filter.date.$lte = new Date(q.to);
  }
  return filter;
}

const populate = [
  { path: 'product', select: 'name unit category', populate: { path: 'category', select: 'name color icon' } },
  { path: 'department', select: 'name code' },
  { path: 'vehicle', select: 'name code' },
  { path: 'createdBy', select: 'name' },
];

// Ro'yxat: ?type=&product=&category=&department=&vehicle=&from=&to=&page=&limit=
router.get('/', async (req, res) => {
  const filter = buildFilter(req.query);
  if (oid(req.query.category)) {
    const ids = await Product.find({ category: oid(req.query.category) }).distinct('_id');
    filter.product = filter.product ? filter.product : { $in: ids };
  }
  const limit = Math.min(Number(req.query.limit) || 50, 5000);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const [items, total] = await Promise.all([
    Movement.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(populate)
      .lean(),
    Movement.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// KIRIM
router.post('/in', allow('admin', 'omborchi'), async (req, res) => {
  const qty = round(Number(req.body.quantity));
  const price = Math.max(Number(req.body.price) || 0, 0);
  if (!(qty > 0)) throw httpError(400, 'Miqdorni to\'g\'ri kiriting');
  const productId = oid(req.body.product);
  if (!productId) throw httpError(400, 'Mahsulotni tanlang');

  // Qoldiqni oshirish va o'rtacha narxni qayta hisoblash (atomar)
  const newAvg =
    price > 0
      ? {
          $cond: [
            { $gt: [{ $add: [{ $max: ['$quantity', 0] }, qty] }, 0] },
            {
              $divide: [
                { $add: [{ $multiply: [{ $max: ['$quantity', 0] }, { $ifNull: ['$avgPrice', 0] }] }, qty * price] },
                { $add: [{ $max: ['$quantity', 0] }, qty] },
              ],
            },
            price,
          ],
        }
      : { $ifNull: ['$avgPrice', 0] };

  const r = await Product.collection.updateOne({ _id: productId, archived: { $ne: true } }, [
    { $set: { avgPrice: newAvg, quantity: { $round: [{ $add: ['$quantity', qty] }, 3] }, updatedAt: new Date() } },
  ]);
  if (!r.matchedCount) throw httpError(404, 'Mahsulot topilmadi');
  const product = await Product.findById(productId).lean();

  try {
    const m = await Movement.create({
      type: 'in',
      product: productId,
      quantity: qty,
      price,
      total: round(qty * price),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      balanceAfter: product.quantity,
      supplier: req.body.supplier,
      docNumber: req.body.docNumber,
      person: req.body.person,
      note: req.body.note,
      createdBy: req.user._id,
    });
    res.status(201).json(await Movement.findById(m._id).populate(populate).lean());
  } catch (e) {
    await Product.updateOne({ _id: productId }, { $inc: { quantity: -qty } });
    throw e;
  }
});

// CHIQIM
router.post('/out', allow('admin', 'omborchi'), async (req, res) => {
  const qty = round(Number(req.body.quantity));
  if (!(qty > 0)) throw httpError(400, 'Miqdorni to\'g\'ri kiriting');
  const productId = oid(req.body.product);
  if (!productId) throw httpError(400, 'Mahsulotni tanlang');
  if (!req.body.department && !req.body.vehicle && !req.body.person) {
    throw httpError(400, 'Qayerga ketganini kiriting: bo\'lim, texnika yoki mas\'ul shaxs');
  }

  // Faqat qoldiq yetarli bo'lsa kamaytiriladi (minusga tushmaydi)
  const product = await Product.findOneAndUpdate(
    { _id: productId, quantity: { $gte: qty - 1e-9 } },
    [{ $set: { quantity: { $round: [{ $subtract: ['$quantity', qty] }, 3] } } }],
    { returnDocument: 'after', updatePipeline: true }
  ).lean();
  if (!product) {
    const p = await Product.findById(productId).lean();
    if (!p) throw httpError(404, 'Mahsulot topilmadi');
    throw httpError(400, `Omborda yetarli emas. Qoldiq: ${p.quantity} ${p.unit}`);
  }

  try {
    const price = product.avgPrice || 0;
    const m = await Movement.create({
      type: 'out',
      product: productId,
      quantity: qty,
      price,
      total: round(qty * price),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      balanceAfter: product.quantity,
      department: oid(req.body.department),
      vehicle: oid(req.body.vehicle),
      person: req.body.person,
      note: req.body.note,
      createdBy: req.user._id,
    });
    res.status(201).json(await Movement.findById(m._id).populate(populate).lean());
  } catch (e) {
    await Product.updateOne({ _id: productId }, { $inc: { quantity: qty } });
    throw e;
  }
});

// Harakatni bekor qilish (faqat admin) — qoldiq qayta tiklanadi
router.delete('/:id', allow('admin'), async (req, res) => {
  const m = await Movement.findById(req.params.id);
  if (!m) throw httpError(404, 'Yozuv topilmadi');

  if (m.type === 'in') {
    const p = await Product.findOneAndUpdate(
      { _id: m.product, quantity: { $gte: m.quantity - 1e-9 } },
      { $inc: { quantity: -m.quantity } }
    );
    if (!p) throw httpError(400, 'Bu kirimdan keyin mahsulot ishlatilgan, bekor qilib bo\'lmaydi');
  } else {
    await Product.updateOne({ _id: m.product }, { $inc: { quantity: m.quantity } });
  }
  await m.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
