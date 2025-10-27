import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import uploadRouter from './routes/uploadRoute.mjs';

import userRoutes from './routes/users/index.js';
import productRoutes from './routes/products/crud.js';
import customerRoutes from './routes/customer/crud.js';

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
