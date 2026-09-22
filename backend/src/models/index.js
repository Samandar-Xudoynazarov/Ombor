const mongoose = require('mongoose');
const { Schema, model, models } = mongoose;

const opts = { timestamps: true };

// Foydalanuvchi
const UserSchema = new Schema(
  {
    name: { type: String, required: [true, 'Ism kiritilmagan'], trim: true },
    username: { type: String, required: [true, 'Login kiritilmagan'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    // admin — hammasi; omborchi — kirim/chiqim/mahsulot; kuzatuvchi — faqat ko'rish
    role: { type: String, enum: ['admin', 'omborchi', 'kuzatuvchi'], default: 'omborchi' },
    active: { type: Boolean, default: true },
  },
  opts
);

// Kategoriya (Yoqilg'i, Metall, Moylar ...)
const CategorySchema = new Schema(
  {
    name: { type: String, required: [true, 'Kategoriya nomi kiritilmagan'], unique: true, trim: true },
    color: { type: String, default: '#2563eb' },
    icon: { type: String, default: 'box' },
  },
  opts
);

// Mahsulot (Salarka, Armatura 12mm, Antifriz ...)
const ProductSchema = new Schema(
  {
    name: { type: String, required: [true, 'Mahsulot nomi kiritilmagan'], trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    unit: { type: String, required: true, default: 'dona', trim: true },
    code: { type: String, trim: true, default: '' }, // artikul / ichki kod
    minQty: { type: Number, default: 0, min: 0 }, // shundan kam qolsa ogohlantirish
    quantity: { type: Number, default: 0 }, // joriy qoldiq (harakatlar orqali o'zgaradi)
    avgPrice: { type: Number, default: 0 }, // o'rtacha tannarx (so'm)
    note: { type: String, default: '' },
    archived: { type: Boolean, default: false },
  },
  opts
);
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });

// Chiqim manzillari: bo'lim/sex yoki texnika/mashina
const TargetSchema = new Schema(
  {
    kind: { type: String, enum: ['department', 'vehicle'], required: true },
    name: { type: String, required: [true, 'Nomi kiritilmagan'], trim: true },
    code: { type: String, default: '', trim: true }, // davlat raqami yoki sex kodi
    archived: { type: Boolean, default: false },
  },
  opts
);
TargetSchema.index({ kind: 1, name: 1 }, { unique: true });

// Harakat: kirim (in) yoki chiqim (out)
const MovementSchema = new Schema(
  {
    type: { type: String, enum: ['in', 'out'], required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: [0.0001, 'Miqdor 0 dan katta bo\'lishi kerak'] },
    price: { type: Number, default: 0 }, // birlik narxi
    total: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    balanceAfter: { type: Number, default: 0 }, // harakatdan keyingi qoldiq
    // Kirim uchun
    supplier: { type: String, default: '', trim: true },
    docNumber: { type: String, default: '', trim: true }, // nakladnoy raqami
    // Chiqim uchun
    department: { type: Schema.Types.ObjectId, ref: 'Target', default: null },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Target', default: null },
    person: { type: String, default: '', trim: true }, // mas'ul shaxs
    note: { type: String, default: '', trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  opts
);
MovementSchema.index({ date: -1 });
MovementSchema.index({ product: 1, date: -1 });
MovementSchema.index({ type: 1, date: -1 });

module.exports = {
  User: models.User || model('User', UserSchema),
  Category: models.Category || model('Category', CategorySchema),
  Product: models.Product || model('Product', ProductSchema),
  Target: models.Target || model('Target', TargetSchema),
  Movement: models.Movement || model('Movement', MovementSchema),
};
