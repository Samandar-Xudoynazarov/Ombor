const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth, allow } = require('../middleware/auth');

router.use(auth, allow('admin'));

router.get('/', async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json(users);
});

router.post('/', async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Parol kamida 6 belgidan iborat bo\'lsin' });
  }
  const user = await User.create({
    name,
    username,
    role,
    password: await bcrypt.hash(String(password), 10),
  });
  res.status(201).json(user);
});

router.put('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
  const { name, role, active, password } = req.body;
  const isSelf = user._id.equals(req.user._id);
  if (name !== undefined) user.name = name;
  if (role !== undefined && !isSelf) user.role = role;
  if (active !== undefined && !isSelf) user.active = !!active;
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ message: 'Parol kamida 6 belgidan iborat bo\'lsin' });
    user.password = await bcrypt.hash(String(password), 10);
  }
  await user.save();
  res.json(user);
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'O\'zingizni o\'chira olmaysiz' });
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
