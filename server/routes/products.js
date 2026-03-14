import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import StockLevel from '../models/StockLevel.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { category, warehouse, sku, lowStock } = req.query;
    let q = { isActive: true };
    if (category) q.category = category;
    if (sku) q.sku = new RegExp(sku, 'i');
    let list = await Product.find(q).sort({ name: 1 }).lean();
    if (warehouse) {
      const levels = await StockLevel.find({ warehouse }).populate('product').lean();
      const byProduct = Object.fromEntries(levels.map(l => [l.product._id.toString(), l]));
      list = list.filter(p => byProduct[p._id.toString()] !== undefined || list.find(x => x._id.toString() === p._id.toString()));
      list = list.map(p => ({
        ...p,
        quantity: byProduct[p._id.toString()]?.quantity ?? 0,
      }));
    } else {
      const levels = await StockLevel.aggregate([{ $group: { _id: '$product', total: { $sum: '$quantity' } } }]);
      const byProduct = Object.fromEntries(levels.map(l => [l._id.toString(), l.total]));
      list = list.map(p => ({ ...p, quantity: byProduct[p._id.toString()] ?? 0 }));
    }
    if (lowStock === 'true') {
      list = list.filter(p => (p.quantity ?? 0) <= (p.lowStockThreshold ?? 10));
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const cats = await Product.distinct('category', { isActive: true });
    res.json(cats.sort());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const levels = await StockLevel.find({ product: product._id }).populate('warehouse').lean();
    res.json({ ...product.toObject(), stockByWarehouse: levels });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('name').trim().notEmpty(),
  body('sku').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('unitOfMeasure').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { initialStock, warehouseId, ...data } = req.body;
      if (await Product.findOne({ sku: data.sku })) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
      const product = await Product.create(data);
      if (warehouseId && (initialStock > 0 || initialStock === 0)) {
        await StockLevel.findOneAndUpdate(
          { product: product._id, warehouse: warehouseId },
          { $setOnInsert: { product: product._id, warehouse: warehouseId }, $set: { quantity: Number(initialStock) } },
          { upsert: true, new: true }
        );
      }
      res.status(201).json(product);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.put('/:id',
  body('name').trim().notEmpty().optional(),
  body('sku').trim().notEmpty().optional(),
  body('category').trim().notEmpty().optional(),
  body('unitOfMeasure').trim().notEmpty().optional(),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
