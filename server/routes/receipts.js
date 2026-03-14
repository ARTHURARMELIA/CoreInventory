import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Receipt from '../models/Receipt.js';
import { protect } from '../middleware/auth.js';
import { updateStock, recordMovement } from '../services/stockService.js';

const router = Router();
router.use(protect);

function nextReceiptNumber() {
  return 'REC-' + Date.now();
}

router.get('/', async (req, res) => {
  try {
    const { status, warehouse } = req.query;
    let q = {};
    if (status) q.status = status;
    const list = await Receipt.find(q).populate('lines.product').populate('lines.warehouse').sort({ createdAt: -1 });
    let result = list;
    if (warehouse) {
      result = list.filter(r => r.lines.some(l => l.warehouse?._id?.toString() === warehouse));
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Receipt.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Receipt not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('supplier').trim().notEmpty(),
  body('lines').isArray({ min: 1 }),
  body('lines.*.product').notEmpty(),
  body('lines.*.quantity').isInt({ min: 1 }),
  body('lines.*.warehouse').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const doc = await Receipt.create({
        receiptNumber: nextReceiptNumber(),
        supplier: req.body.supplier,
        lines: req.body.lines,
        createdBy: req.user._id,
        notes: req.body.notes,
      });
      const populated = await Receipt.findById(doc._id).populate('lines.product').populate('lines.warehouse');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post('/:id/validate', async (req, res) => {
  try {
    const doc = await Receipt.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!doc) return res.status(404).json({ message: 'Receipt not found' });
    if (doc.status === 'validated') return res.status(400).json({ message: 'Already validated' });
    for (const line of doc.lines) {
      await updateStock(line.product._id, line.warehouse._id, line.quantity);
      await recordMovement({
        product: line.product._id,
        movementType: 'receipt',
        quantity: line.quantity,
        warehouse: line.warehouse._id,
        reference: doc._id,
        referenceModel: 'Receipt',
        user: req.user._id,
        notes: `Receipt ${doc.receiptNumber}`,
      });
    }
    doc.status = 'validated';
    doc.validatedAt = new Date();
    doc.validatedBy = req.user._id;
    await doc.save();
    const updated = await Receipt.findById(doc._id).populate('lines.product').populate('lines.warehouse');
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
