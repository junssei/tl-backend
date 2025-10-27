// routes/auth.js
import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// GetAll users
app.get('', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT (id, email, username, phonenumber, createdat, tindahan_name, role, profile_img, gender) FROM users',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GetAll User Customers
app.get('/:userid/customerlist', async (req, res) => {
  try {
    const { userid } = req.params;

    // users customer
    const result = await pool.query(
      'SELECT * FROM customer WHERE userid = $1',
      [userid],
    );

    if (result.rows.length === 0) {
      return res.json({ message: 'No rows found', data: [] });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Customer Profile for specific user
app.get('/:userid/customer/:customerid/profile', async (req, res) => {
  try {
    const { customerid, userid } = req.params;
    const result = await pool.query(
      'SELECT * FROM customer WHERE id = $1 AND userid = $2',
      [customerid, userid],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]); // return single user
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
