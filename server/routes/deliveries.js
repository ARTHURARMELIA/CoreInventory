import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Delivery from '../models/Delivery.js';
import StockLevel from '../models/StockLevel.js';
import { protect } from '../middleware/auth.js';
import { updateStock, recordMovement } from '../services/stockService.js';

const router = Router();
router.use(protect);

function nextDeliveryNumber() {
  return 'DO-' + Date.now();
}

router.get('/', async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let q = {};
    if (status) q.status = status;
    const list = await Delivery.find(q).populate('lines.product').populate('lines.warehouse').sort({ createdAt: -1 });
    let result = list;
    if (warehouse) {
      result = list.filter(d => d.lines.some(l => l.warehouse?._id?.toString() === warehouse));
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Delivery.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Delivery not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('customer').trim().notEmpty(),
  body('lines').isArray({ min: 1 }),
  body('lines.*.product').notEmpty(),
  body('lines.*.quantity').isInt({ min: 1 }),
  body('lines.*.warehouse').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      for (const line of req.body.lines) {
        const level = await StockLevel.findOne({ product: line.product, warehouse: line.warehouse });
        const qty = level?.quantity ?? 0;
        if (qty < line.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product in warehouse` });
        }
      }
      const doc = await Delivery.create({
        deliveryNumber: nextDeliveryNumber(),
        customer: req.body.customer,
        lines: req.body.lines,
        createdBy: req.user._id,
        notes: req.body.notes,
      });
      const populated = await Delivery.findById(doc._id).populate('lines.product').populate('lines.warehouse');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post('/:id/validate', async (req, res) => {
  try {
    const doc = await Delivery.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Delivery not found' });
    if (doc.status === 'validated') return res.status(400).json({ message: 'Already validated' });
    for (const line of doc.lines) {
      await updateStock(line.product._id, line.warehouse._id, -line.quantity);
      await recordMovement({
        product: line.product._id,
        movementType: 'delivery',
        quantity: -line.quantity,
        warehouse: line.warehouse._id,
        reference: doc._id,
        referenceModel: 'Delivery',
        user: req.user._id,
        notes: `Delivery ${doc.deliveryNumber}`,
      });
    }
    doc.status = 'validated';
    doc.validatedAt = new Date();
    doc.validatedBy = req.user._id;
    await doc.save();
    const updated = await Delivery.findById(doc._id).populate('lines.product').populate('lines.warehouse');
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
