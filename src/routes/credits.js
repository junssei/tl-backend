// routes/credits.js
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// POST /credits
// body: { customerid, amount, balance, status, due_date, orderid, userid? }
router.post('/', async (req, res) => {
  try {
    const { customerid, amount, balance, status, due_date, orderid, userid } = req.body;

    if (!customerid || amount == null || balance == null || !status || !orderid) {
      return res.status(400).json({ error: 'customerid, amount, balance, status, orderid are required' });
    }

    const insert = `
      INSERT INTO credits (amount, created_at, customerid, user_id, order_id, balance, status, due_date)
      VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const { rows } = await pool.query(insert, [
      amount,
      customerid,
      userid || null,
      orderid,
      balance,
      status,
      due_date || null,
    ]);

    return res.json({ id: rows[0].id });
  } catch (err) {
    console.error('POST /credits', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// PATCH /credits/:id
// body: { balance?, status? }
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { balance, status } = req.body;

  if (!id || (!('balance' in req.body) && !('status' in req.body))) {
    return res.status(400).json({ error: 'balance or status required' });
  }

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (balance != null) {
      fields.push(`balance = $${idx++}`);
      values.push(balance);
    }
    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    values.push(id);

    const sql = `UPDATE public.credits SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, balance, status`;
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return res.status(404).json({ error: 'credit_not_found' });

    return res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /credits/:id', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;