import { Router } from 'express';
import Movement from '../models/Movement.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { type, warehouse, product, fromDate, toDate } = req.query;
    let q = {};
    if (type) q.movementType = type;
    if (warehouse) q.warehouse = warehouse;
    if (product) q.product = product;
    if (fromDate || toDate) {
      q.date = {};
      if (fromDate) q.date.$gte = new Date(fromDate);
      if (toDate) q.date.$lte = new Date(toDate);
    }
    const list = await Movement.find(q)
      .populate('product', 'name sku')
      .populate('warehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('user', 'name email')
      .sort({ date: -1 })
      .limit(500)
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
