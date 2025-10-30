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

    // Use snake_case columns that typically exist; omit quantity
    const insert = `
      INSERT INTO orders (user_id, customer_id, total_amount, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const { rows } = await pool.query(insert, [userid, customerid, total_amount, status]);
    const inserted = rows[0] || {};
    const id = inserted.order_id || inserted.id;
    if (!id) {
      return res.status(500).json({ error: 'order_id_missing' });
    }
    return res.json({ id });
  } catch (err) {
    console.error('POST /orders', err);
    return res.status(500).json({ error: err.message || 'internal_error' });
  }
});

export default router;