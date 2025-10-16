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

    const customerId = result.rows[0].id;

    const credits = await pool.query(
      'INSERT INTO credits (amount, customerid) VALUES ($1, $2) RETURNING *',
      [1000, customerId],
    );

    res.status(201).json({
      message: 'Customer created',
      customer: result.rows[0],
      credits: credits.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
