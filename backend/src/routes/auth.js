const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Category, Target } = require('../models');
const { auth, signToken } = require('../middleware/auth');

const publicUser = (u) => ({ id: u._id, name: u.name, username: u.username, role: u.role });

// Birinchi marta: bazada foydalanuvchi bo'lmasa, .env dagi ADMIN_USERNAME/ADMIN_PASSWORD bilan admin yaratiladi
async function ensureFirstAdmin(username, password) {
  const count = await User.estimatedDocumentCount();
  if (count > 0) return null;
  const envUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envPass || username !== envUser || password !== envPass) return null;

  const admin = await User.create({
    name: 'Administrator',
    username: envUser,
    password: await bcrypt.hash(envPass, 10),
    role: 'admin',
  });

  // Boshlang'ich kategoriyalar va bo'limlar (keyin o'zgartirish mumkin)
  if ((await Category.estimatedDocumentCount()) === 0) {
    await Category.insertMany([
      { name: 'Yoqilg\'i', color: '#f59e0b', icon: 'fuel' },
      { name: 'Moylar va suyuqliklar', color: '#0ea5e9', icon: 'droplet' },
      { name: 'Metall va armatura', color: '#64748b', icon: 'layers' },
      { name: 'Ehtiyot qismlar', color: '#8b5cf6', icon: 'cog' },
      { name: 'Qurilish materiallari', color: '#ef4444', icon: 'brick' },
      { name: 'Xo\'jalik mollari', color: '#10b981', icon: 'box' },
    ]);
  }
  if ((await Target.estimatedDocumentCount()) === 0) {
    await Target.insertMany([
      { kind: 'department', name: '1-sex' },
      { kind: 'department', name: 'Ta\'mirlash bo\'limi' },
      { kind: 'department', name: 'Transport bo\'limi' },
    ]);
  }
  return admin;
}

router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  if (!username || !password) return res.status(400).json({ message: 'Login va parolni kiriting' });

  let user = await User.findOne({ username }).select('+password');
  if (!user) {
    const created = await ensureFirstAdmin(username, password);
    if (created) user = await User.findById(created._id).select('+password');
  }
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
  }
  if (!user.active) return res.status(403).json({ message: 'Foydalanuvchi bloklangan' });

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Yangi parol kamida 6 belgidan iborat bo\'lsin' });
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(String(oldPassword || ''), user.password))) {
    return res.status(400).json({ message: 'Eski parol noto\'g\'ri' });
  }
  user.password = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  res.json({ ok: true });
});

module.exports = router;
