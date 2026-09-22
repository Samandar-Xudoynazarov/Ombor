const jwt = require('jsonwebtoken');
const { User } = require('../models');

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  e.expose = true;
  return e;
}

function secret() {
  if (!process.env.JWT_SECRET) throw httpError(500, 'JWT_SECRET muhit o\'zgaruvchisi berilmagan');
  return process.env.JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, secret(), { expiresIn: '30d' });
}

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Tizimga kiring' });
  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    return res.status(401).json({ message: 'Sessiya muddati tugagan, qayta kiring' });
  }
  const user = await User.findById(payload.id);
  if (!user || !user.active) return res.status(401).json({ message: 'Foydalanuvchi topilmadi yoki bloklangan' });
  req.user = user;
  next();
}

// Rollarni tekshirish: allow('admin', 'omborchi')
function allow(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu amal uchun ruxsatingiz yo\'q' });
    }
    next();
  };
}

module.exports = { auth, allow, signToken, httpError };
