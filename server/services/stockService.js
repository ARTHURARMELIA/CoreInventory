import StockLevel from '../models/StockLevel.js';
import Movement from '../models/Movement.js';

export async function updateStock(productId, warehouseId, delta, opts = {}) {
  let level = await StockLevel.findOne({ product: productId, warehouse: warehouseId });
  if (!level) {
    level = await StockLevel.create({ product: productId, warehouse: warehouseId, quantity: 0 });
  }
  const newQty = level.quantity + delta;
  if (newQty < 0) throw new Error('Insufficient stock');
  level.quantity = newQty;
  await level.save();
  return level;
}

export async function recordMovement(data) {
  return Movement.create(data);
}
