// routes/orders.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /orders
// body: { customerid, userid, quantity?, total_amount, status }
router.post('/', async (req, res) => {
  try {
    const { customerid, userid, quantity, total_amount, status } = req.body;

    if (!customerid || !userid || total_amount == null || !status) {
      return res.status(400).json({ error: 'customerid, userid, total_amount, status are required' });
    }

    // quantity must satisfy check constraint; default to 1 if invalid
    const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0
      ? Math.floor(Number(quantity))
      : 1;

    // Include quantity to satisfy NOT NULL/constraints
    const insert = `
      INSERT INTO orders (user_id, customer_id, quantity, total_amount, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const { rows } = await pool.query(insert, [userid, customerid, qty, total_amount, status]);
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