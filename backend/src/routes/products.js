const router = require('express').Router();
const { Product, Movement } = require('../models');
const { auth, allow } = require('../middleware/auth');

router.use(auth);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ro'yxat: ?search=&category=&status=low|empty&archived=1
router.get('/', async (req, res) => {
  const { search, category, status, archived } = req.query;
  const filter = { archived: archived === '1' };
  if (category) filter.category = category === 'none' ? null : category;
  if (search) {
    const re = new RegExp(escapeRe(String(search).trim()), 'i');
    filter.$or = [{ name: re }, { code: re }];
  }
  if (status === 'low') filter.$expr = { $and: [{ $gt: ['$minQty', 0] }, { $lte: ['$quantity', '$minQty'] }] };
  if (status === 'empty') filter.quantity = { $lte: 0 };

  const products = await Product.find(filter).populate('category', 'name color icon').sort({ name: 1 }).lean();
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name color icon').lean();
  if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });

  // So'nggi 30 kunlik sarf
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [agg] = await Movement.aggregate([
    { $match: { product: product._id, date: { $gte: since } } },
    {
      $group: {
        _id: null,
        in: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] } },
        out: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] } },
      },
    },
  ]);
  res.json({ ...product, last30: { in: agg?.in || 0, out: agg?.out || 0 } });
});

function pickProduct(body) {
  const data = {};
  for (const k of ['name', 'unit', 'code', 'note']) if (body[k] !== undefined) data[k] = body[k];
  if (body.category !== undefined) data.category = body.category || null;
  if (body.minQty !== undefined) data.minQty = Number(body.minQty) || 0;
  if (body.archived !== undefined) data.archived = !!body.archived;
  return data;
}

router.post('/', allow('admin', 'omborchi'), async (req, res) => {
  const product = await Product.create(pickProduct(req.body));
  res.status(201).json(await product.populate('category', 'name color icon'));
});

router.put('/:id', allow('admin', 'omborchi'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickProduct(req.body), {
    returnDocument: 'after',
    runValidators: true,
  }).populate('category', 'name color icon');
  if (!product) return res.status(404).json({ message: 'Mahsulot topilmadi' });
  res.json(product);
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const hasHistory = await Movement.exists({ product: req.params.id });
  if (hasHistory) {
    // Tarix yo'qolmasligi uchun arxivlanadi
    await Product.findByIdAndUpdate(req.params.id, { archived: true });
    return res.json({ ok: true, archived: true });
  }
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
