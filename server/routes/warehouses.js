import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Warehouse from '../models/Warehouse.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const list = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/',
  body('name').trim().notEmpty(),
  body('code').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const w = await Warehouse.create(req.body);
      res.status(201).json(w);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.put('/:id',
  body('name').trim().notEmpty().optional(),
  body('code').trim().notEmpty().optional(),
  async (req, res) => {
    try {
      const w = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!w) return res.status(404).json({ message: 'Warehouse not found' });
      res.json(w);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!w) return res.status(404).json({ message: 'Warehouse not found' });
    res.json(w);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
