const router = require('express').Router();
const { Product, Movement, Category } = require('../models');
const { auth } = require('../middleware/auth');

router.use(auth);

const lowExpr = { $and: [{ $gt: ['$minQty', 0] }, { $lte: ['$quantity', '$minQty'] }] };

// Bosh sahifa uchun umumiy ko'rsatkichlar
router.get('/dashboard', async (req, res) => {
  // Kun boshlanishi (klient vaqt zonasi bo'yicha yuboriladi, bo'lmasa server vaqti)
  const dayStart = req.query.dayStart ? new Date(req.query.dayStart) : new Date(new Date().setHours(0, 0, 0, 0));

  const [productCount, lowStock, emptyCount, stockValue, today, recent, categoryCount] = await Promise.all([
    Product.countDocuments({ archived: false }),
    Product.find({ archived: false, $expr: lowExpr })
      .populate('category', 'name color icon')
      .sort({ quantity: 1 })
      .limit(20)
      .lean(),
    Product.countDocuments({ archived: false, quantity: { $lte: 0 } }),
    Product.aggregate([
      { $match: { archived: false } },
      { $group: { _id: null, value: { $sum: { $multiply: [{ $max: ['$quantity', 0] }, '$avgPrice'] } } } },
    ]),
    Movement.aggregate([
      { $match: { date: { $gte: dayStart } } },
      { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]),
    Movement.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(8)
      .populate([
        { path: 'product', select: 'name unit category', populate: { path: 'category', select: 'name color icon' } },
        { path: 'department', select: 'name' },
        { path: 'vehicle', select: 'name code' },
      ])
      .lean(),
    Category.estimatedDocumentCount(),
  ]);

  const t = Object.fromEntries(today.map((x) => [x._id, x]));
  res.json({
    productCount,
    categoryCount,
    lowCount: lowStock.length,
    emptyCount,
    stockValue: Math.round(stockValue[0]?.value || 0),
    todayIn: t.in?.count || 0,
    todayOut: t.out?.count || 0,
    lowStock,
    recent,
  });
});

// Hisobot: ?from=&to=&type=out|in
router.get('/report', async (req, res) => {
  const type = req.query.type === 'in' ? 'in' : 'out';
  const match = { type };
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }

  // Guruh (bo'lim/texnika/shaxs) bo'yicha jami + ichida qaysi mahsulotdan qancha
  const groupBy = (field, lookupFrom) => [
    { $match: { ...match, [field]: { $nin: [null, ''] } } },
    {
      $group: {
        _id: { t: `$${field}`, p: '$product' },
        quantity: { $sum: '$quantity' },
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $lookup: { from: 'products', localField: '_id.p', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $sort: { total: -1, quantity: -1 } },
    {
      $group: {
        _id: '$_id.t',
        total: { $sum: '$total' },
        count: { $sum: '$count' },
        items: { $push: { name: '$p.name', unit: '$p.unit', quantity: '$quantity', total: '$total' } },
      },
    },
    ...(lookupFrom
      ? [
          { $lookup: { from: lookupFrom, localField: '_id', foreignField: '_id', as: 'ref' } },
          { $addFields: { name: { $arrayElemAt: ['$ref.name', 0] }, code: { $arrayElemAt: ['$ref.code', 0] } } },
          { $project: { ref: 0 } },
        ]
      : [{ $addFields: { name: '$_id' } }]),
    { $sort: { total: -1, count: -1 } },
    { $limit: 100 },
  ];

  const [byProduct, byDepartment, byVehicle, byCategory, byPerson, bySupplier, totals] = await Promise.all([
    Movement.aggregate([
      { $match: match },
      { $group: { _id: '$product', quantity: { $sum: '$quantity' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $lookup: { from: 'categories', localField: 'p.category', foreignField: '_id', as: 'c' } },
      {
        $project: {
          quantity: 1, total: 1, count: 1,
          name: '$p.name', unit: '$p.unit',
          category: { $arrayElemAt: ['$c.name', 0] },
          color: { $arrayElemAt: ['$c.color', 0] },
        },
      },
      { $sort: { total: -1, quantity: -1 } },
      { $limit: 100 },
    ]),
    type === 'out' ? Movement.aggregate(groupBy('department', 'targets')) : [],
    type === 'out' ? Movement.aggregate(groupBy('vehicle', 'targets')) : [],
    Movement.aggregate([
      { $match: match },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $group: { _id: '$p.category', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'c' } },
      { $project: { total: 1, count: 1, name: { $arrayElemAt: ['$c.name', 0] }, color: { $arrayElemAt: ['$c.color', 0] } } },
      { $sort: { total: -1, count: -1 } },
    ]),
    Movement.aggregate(groupBy('person', null)),
    type === 'in' ? Movement.aggregate(groupBy('supplier', null)) : [],
    Movement.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
  ]);

  res.json({
    type,
    total: Math.round(totals[0]?.total || 0),
    count: totals[0]?.count || 0,
    byProduct,
    byDepartment,
    byVehicle,
    byCategory,
    byPerson,
    bySupplier,
  });
});

module.exports = router;
