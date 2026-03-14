import mongoose from 'mongoose';

const movementSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  movementType: { type: String, enum: ['receipt', 'delivery', 'transfer', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  reference: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceModel' },
  referenceModel: { type: String, enum: ['Receipt', 'Delivery', 'Transfer', 'Adjustment'] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
}, { timestamps: true });

export default mongoose.model('Movement', movementSchema);
