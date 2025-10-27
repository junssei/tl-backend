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
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category, brand, description, price, stock, unit } =
      req.body;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const result = await pool.query(
      `UPDATE products
       SET product_name = $1, category = $2, brand = $3, description = $4,
           price = $5, stock = $6, unit = $7
       WHERE id = $8
       RETURNING *`,
      [product_name, category, brand, description, price, stock, unit, id],
    );

    res.json({
      message: 'Product updated successfully.',
      product: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
