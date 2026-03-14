import mongoose from 'mongoose';

const deliveryLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
});

const deliverySchema = new mongoose.Schema({
  deliveryNumber: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  status: { type: String, enum: ['pending', 'validated'], default: 'pending' },
  lines: [deliveryLineSchema],
  validatedAt: Date,
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
}, { timestamps: true });

export default mongoose.model('Delivery', deliverySchema);
