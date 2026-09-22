const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// CORS: FRONTEND_URL da vergul bilan bir nechta manzil berish mumkin
const allowed = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({ ok: true, name: 'Ombor API' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Har bir API so'rovdan oldin bazaga ulanish
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi' });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/targets', require('./routes/targets'));
app.use('/api/movements', require('./routes/movements'));
app.use('/api/stats', require('./routes/stats'));

app.use((req, res) => res.status(404).json({ message: 'Topilmadi' }));

// Xatoliklarni ushlash (Express 5 async xatolarni o'zi shu yerga yuboradi)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Noto\'g\'ri ma\'lumot' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Noto\'g\'ri ID' });
  if (err.code === 11000) return res.status(409).json({ message: 'Bunday nom allaqachon mavjud' });
  res.status(err.status || 500).json({ message: err.expose ? err.message : 'Serverda xatolik yuz berdi' });
});

module.exports = app;
