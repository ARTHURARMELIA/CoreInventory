import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import warehouseRoutes from './routes/warehouses.js';
import receiptRoutes from './routes/receipts.js';
import deliveryRoutes from './routes/deliveries.js';
import transferRoutes from './routes/transfers.js';
import adjustmentRoutes from './routes/adjustments.js';
import movementRoutes from './routes/movements.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coreinventory';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`CoreInventory API running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('DB connection failed:', err));
