// routes/auth.js
import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// Create
router.post('/create', async (req, res) => {
  try {
    const { c_fullname, c_phonenumber, c_address, c_gender, userid } = req.body;

    const existing = await pool.query(
      'SELECT * FROM customer WHERE c_fullname = $1 AND userid = $2',
      [c_fullname, userid],
    );

    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Customer already exists for this user' });
    }

    const result = await pool.query(
      'INSERT INTO customer (c_fullname, c_phonenumber, c_address, c_gender, userid) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [c_fullname, c_phonenumber, c_address, c_gender, userid],
    );

    res.status(201).json({
      message: 'Customer created',
      customer: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit
router.post('/edit', async (req, res) => {
  try {
    const { id, c_fullname, c_phonenumber, c_address, c_gender } = req.body;

    const existing = await pool.query('SELECT * FROM customer WHERE id = $1', [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = await pool.query(
      'UPDATE customer SET c_fullname = $1, c_phonenumber = $2, c_address = $3, c_gender = $4 WHERE id = $5 RETURNING *',
      [c_fullname, c_phonenumber, c_address, c_gender, id],
    );

    res
      .status(200)
      .json({ message: 'Customer updated', customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
