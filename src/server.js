import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.js';
import uploadRouter from './routes/uploadRoute.mjs';

import userRoutes from './routes/users/index.js';
import productRoutes from './routes/products/crud.js';
import customerRoutes from './routes/customer/crud.js';

import ordersRouter from './routes/orders.js';
import creditsRouter from './routes/credits.js';
import paymentsRouter from './routes/payments.js';
import orderItemsRouter from './routes/orderItems.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.use('/api', uploadRouter);

app.use('/user', userRoutes);
app.use('/products', productRoutes);
app.use('/customers', customerRoutes);

// routes
app.use('/orders', ordersRouter);
app.use('/credits', creditsRouter);
app.use('/payments', paymentsRouter);
app.use('/order-items', orderItemsRouter);

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// error fallback
app.use((err, req, res, next) => {
  console.error('Unhandled', err);
  res.status(500).json({ error: 'internal_error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
