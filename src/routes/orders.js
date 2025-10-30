// routes/orders.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /orders
// body: { customerid, userid, total_amount, status }
router.post('/', async (req, res) => {
  try {
    const { customerid, userid, total_amount, status } = req.body;

    if (!customerid || !userid || total_amount == null || !status) {
      return res.status(400).json({ error: 'customerid, userid, total_amount, status are required' });
    }

    const insert = `
      INSERT INTO public.orders (user_id, customer_id, quantity, totalAmount, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING order_id;
    `;
    const { rows } = await pool.query(insert, [userid, customerid, 0, total_amount, status]);
    return res.json({ id: rows[0].order_id });
  } catch (err) {
    console.error('POST /orders', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;