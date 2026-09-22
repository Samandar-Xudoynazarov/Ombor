const router = require('express').Router();
const { Category, Product } = require('../models');
const { auth, allow } = require('../middleware/auth');

router.use(auth);

// Kategoriyalar + har biridagi mahsulotlar soni
router.get('/', async (req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([{ $match: { archived: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json(cats.map((c) => ({ ...c, productCount: map[String(c._id)] || 0 })));
});

router.post('/', allow('admin', 'omborchi'), async (req, res) => {
  const { name, color, icon } = req.body;
  res.status(201).json(await Category.create({ name, color, icon }));
});

router.put('/:id', allow('admin', 'omborchi'), async (req, res) => {
  const { name, color, icon } = req.body;
  const cat = await Category.findByIdAndUpdate(
    req.params.id,
    { name, color, icon },
    { returnDocument: 'after', runValidators: true }
  );
  if (!cat) return res.status(404).json({ message: 'Kategoriya topilmadi' });
  res.json(cat);
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const used = await Product.countDocuments({ category: req.params.id });
  if (used > 0) {
    return res.status(400).json({ message: `Bu kategoriyada ${used} ta mahsulot bor. Avval ularni boshqa kategoriyaga o'tkazing.` });
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
