import { Router } from 'express';
import Product from '../models/Product.js';
import StockLevel from '../models/StockLevel.js';
import Receipt from '../models/Receipt.js';
import Delivery from '../models/Delivery.js';
import Transfer from '../models/Transfer.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/kpis', async (req, res) => {
  try {
    const { warehouse, category } = req.query;
    const productMatch = category ? { category } : {};
    const warehouseMatch = warehouse ? { warehouse } : {};

    const products = await Product.find({ isActive: true, ...productMatch }).select('_id lowStockThreshold').lean();
    const productIds = products.map(p => p._id);
    const thresholdByProduct = Object.fromEntries(products.map(p => [p._id.toString(), p.lowStockThreshold ?? 10]));

    const levels = await StockLevel.aggregate([
      { $match: { product: { $in: productIds }, ...warehouseMatch } },
      { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    ]);
    const totalByProduct = Object.fromEntries(levels.map(l => [l._id.toString(), l.total]));

    const totalProducts = products.length;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const p of products) {
      const qty = totalByProduct[p._id.toString()] ?? 0;
      totalStock += qty;
      const th = thresholdByProduct[p._id.toString()] ?? 10;
      if (qty <= 0) outOfStockCount++;
      else if (qty <= th) lowStockCount++;
    }

    const [pendingReceipts, pendingDeliveries, pendingTransfers] = await Promise.all([
      Receipt.countDocuments({ status: 'pending' }),
      Delivery.countDocuments({ status: 'pending' }),
      Transfer.countDocuments({ status: 'pending' }),
    ]);

    res.json({
      totalProductsInStock: totalStock,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      internalTransfers: pendingTransfers,
      totalProductTypes: totalProducts,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
