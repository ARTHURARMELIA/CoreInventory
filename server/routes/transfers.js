import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Transfer from '../models/Transfer.js';
import StockLevel from '../models/StockLevel.js';
import { protect } from '../middleware/auth.js';
import { updateStock, recordMovement } from '../services/stockService.js';

const router = Router();
router.use(protect);

function nextTransferNumber() {
  return 'TRF-' + Date.now();
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let q = {};
    if (status) q.status = status;
    const list = await Transfer.find(q).populate('fromWarehouse').populate('toWarehouse').populate('lines.product').sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await Transfer.findById(req.params.id).populate('fromWarehouse').populate('toWarehouse').populate('lines.product');
    if (!doc) return res.status(404).json({ message: 'Transfer not found' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('fromWarehouse').notEmpty(),
  body('toWarehouse').notEmpty(),
  body('lines').isArray({ min: 1 }),
  body('lines.*.product').notEmpty(),
  body('lines.*.quantity').isInt({ min: 1 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const { fromWarehouse, toWarehouse, lines } = req.body;
      for (const line of lines) {
        const level = await StockLevel.findOne({ product: line.product, warehouse: fromWarehouse });
        const qty = level?.quantity ?? 0;
        if (qty < line.quantity) {
          return res.status(400).json({ message: 'Insufficient stock in source warehouse' });
        }
      }
      const doc = await Transfer.create({
        transferNumber: nextTransferNumber(),
        fromWarehouse,
        toWarehouse,
        lines,
        createdBy: req.user._id,
        notes: req.body.notes,
      });
      const populated = await Transfer.findById(doc._id).populate('fromWarehouse').populate('toWarehouse').populate('lines.product');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post('/:id/validate', async (req, res) => {
  try {
    const doc = await Transfer.findById(req.params.id).populate('fromWarehouse').populate('toWarehouse').populate('lines.product');
    if (!doc) return res.status(404).json({ message: 'Transfer not found' });
    if (doc.status === 'validated') return res.status(400).json({ message: 'Already validated' });
    for (const line of doc.lines) {
      await updateStock(line.product._id, doc.fromWarehouse._id, -line.quantity);
      await updateStock(line.product._id, doc.toWarehouse._id, line.quantity);
      await recordMovement({
        product: line.product._id,
        movementType: 'transfer',
        quantity: -line.quantity,
        warehouse: doc.fromWarehouse._id,
        toWarehouse: doc.toWarehouse._id,
        reference: doc._id,
        referenceModel: 'Transfer',
        user: req.user._id,
        notes: `Transfer ${doc.transferNumber}`,
      });
      await recordMovement({
        product: line.product._id,
        movementType: 'transfer',
        quantity: line.quantity,
        warehouse: doc.toWarehouse._id,
        toWarehouse: doc.fromWarehouse._id,
        reference: doc._id,
        referenceModel: 'Transfer',
        user: req.user._id,
        notes: `Transfer ${doc.transferNumber} (in)`,
      });
    }
    doc.status = 'validated';
    doc.validatedAt = new Date();
    doc.validatedBy = req.user._id;
    await doc.save();
    const updated = await Transfer.findById(doc._id).populate('fromWarehouse').populate('toWarehouse').populate('lines.product');
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
