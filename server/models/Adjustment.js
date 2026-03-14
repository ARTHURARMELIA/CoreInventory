import mongoose from 'mongoose';

const adjustmentLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  systemQuantity: { type: Number, required: true },
  physicalQuantity: { type: Number, required: true },
  difference: { type: Number, required: true },
});

const adjustmentSchema = new mongoose.Schema({
  adjustmentNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'applied'], default: 'pending' },
  lines: [adjustmentLineSchema],
  appliedAt: Date,
  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
}, { timestamps: true });

export default mongoose.model('Adjustment', adjustmentSchema);
