import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Adjustment from '../models/Adjustment.js';
import { protect } from '../middleware/auth.js';
import { updateStock, recordMovement } from '../services/stockService.js';

const router = Router();
router.use(protect);

function nextAdjustmentNumber() {
  return 'ADJ-' + Date.now();
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let q = {};
    if (status) q.status = status;
    const list = await Adjustment.find(q).populate('lines.product').populate('lines.warehouse').sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Adjustment.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Adjustment not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('lines').isArray({ min: 1 }),
  body('lines.*.product').notEmpty(),
  body('lines.*.warehouse').notEmpty(),
  body('lines.*.physicalQuantity').isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const StockLevel = (await import('../models/StockLevel.js')).default;
      const lines = [];
      for (const l of req.body.lines) {
        const level = await StockLevel.findOne({ product: l.product, warehouse: l.warehouse });
        const systemQty = level?.quantity ?? 0;
        const physicalQty = Number(l.physicalQuantity);
        const diff = physicalQty - systemQty;
        lines.push({
          product: l.product,
          warehouse: l.warehouse,
          systemQuantity: systemQty,
          physicalQuantity: physicalQty,
          difference: diff,
        });
      }
      const doc = await Adjustment.create({
        adjustmentNumber: nextAdjustmentNumber(),
        lines,
        createdBy: req.user._id,
        notes: req.body.notes,
      });
      const populated = await Adjustment.findById(doc._id).populate('lines.product').populate('lines.warehouse');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post('/:id/apply', async (req, res) => {
  try {
    const doc = await Adjustment.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Adjustment not found' });
    if (doc.status === 'applied') return res.status(400).json({ message: 'Already applied' });
    for (const line of doc.lines) {
      await updateStock(line.product._id, line.warehouse._id, line.difference);
      await recordMovement({
        product: line.product._id,
        movementType: 'adjustment',
        quantity: line.difference,
        warehouse: line.warehouse._id,
        reference: doc._id,
        referenceModel: 'Adjustment',
        user: req.user._id,
        notes: `Adjustment ${doc.adjustmentNumber}: ${line.difference > 0 ? '+' : ''}${line.difference}`,
      });
    }
    doc.status = 'applied';
    doc.appliedAt = new Date();
    doc.appliedBy = req.user._id;
    await doc.save();
    const updated = await Adjustment.findById(doc._id).populate('lines.product').populate('lines.warehouse');
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
