// routes/auth.js
import express from 'express';
import pool from '../../db.js';

const router = express.Router();

// Create
router.post('/create', async (req, res) => {
  try {
    const {
      userid,
      product_name,
      category,
      brand,
      description,
      price,
      stock,
      unit,
    } = req.body;

    const existing = await pool.query(
      'SELECT * FROM products WHERE product_name = $1 AND brand = $2 AND userid = $3',
      [product_name, brand, userid],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Product already exists.' });
    }

    const result = await pool.query(
      'INSERT INTO products (user_id, product_name, category, brand, description, price, stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userid, product_name, category, brand, description, price, stock, unit],
    );

    res.status(201).json({
      message: 'Product created',
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

// Delete
router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;

    // Check if customer exists
    const existing = await pool.query('SELECT * FROM customer WHERE id = $1', [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete customer
    await pool.query('DELETE FROM customer WHERE id = $1', [id]);

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
