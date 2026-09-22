// Bo'limlar/sexlar va texnika/mashinalar ro'yxati
const router = require('express').Router();
const { Target, Movement } = require('../models');
const { auth, allow } = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.all !== '1') filter.archived = false;
  res.json(await Target.find(filter).sort({ name: 1 }));
});

router.post('/', allow('admin', 'omborchi'), async (req, res) => {
  const { kind, name, code } = req.body;
  res.status(201).json(await Target.create({ kind, name, code }));
});

router.put('/:id', allow('admin', 'omborchi'), async (req, res) => {
  const { name, code, archived } = req.body;
  const t = await Target.findByIdAndUpdate(req.params.id, { name, code, archived }, { returnDocument: 'after', runValidators: true });
  if (!t) return res.status(404).json({ message: 'Topilmadi' });
  res.json(t);
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const used = await Movement.exists({ $or: [{ department: req.params.id }, { vehicle: req.params.id }] });
  if (used) {
    // Tarixda ishlatilgan bo'lsa o'chirmaymiz, arxivlaymiz
    await Target.findByIdAndUpdate(req.params.id, { archived: true });
    return res.json({ ok: true, archived: true });
  }
  await Target.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
