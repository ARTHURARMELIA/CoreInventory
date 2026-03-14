import mongoose from 'mongoose';

const receiptLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
});

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  supplier: { type: String, required: true },
  status: { type: String, enum: ['pending', 'validated'], default: 'pending' },
  lines: [receiptLineSchema],
  validatedAt: Date,
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
}, { timestamps: true });

export default mongoose.model('Receipt', receiptSchema);
