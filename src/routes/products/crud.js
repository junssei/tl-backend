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
      'SELECT * FROM products WHERE product_name = $1 AND brand = $2 AND user_id = $3',
      [product_name, brand, userid],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Product already exists.' });
    }

    const result = await pool.query(
      'INSERT INTO products (user_id, product_name, category, brand, description, price, stock, unit) VALUES ($1, $2, $3, $4, $5, $6::numeric, $7, $8) RETURNING *',
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

    const existing = await pool.query(
      'SELECT * FROM products WHERE product_id = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const result = await pool.query(
      `UPDATE products
       SET product_name = $1, category = $2, brand = $3, description = $4,
           price = $5::numeric, stock = $6, unit = $7
       WHERE product_id = $8
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

router.post('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM products WHERE product_id = $1',
      [id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await pool.query('DELETE FROM products WHERE product_id = $1', [id]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this to your existing products router file (same file as create/update/delete)
router.patch('/:id/reduce-stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const qty = Number(quantity);
  if (!id || !Number.isInteger(Number(id)) || !qty || qty <= 0) {
    return res.status(400).json({ error: 'id and positive quantity are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the product row to prevent concurrent stock updates
    const lock = await client.query(
      'SELECT stock FROM products WHERE product_id = $1 FOR UPDATE',
      [id],
    );

    if (lock.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'product_not_found' });
    }

    const current = Number(lock.rows[0].stock || 0);
    if (current < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'insufficient_stock', current });
    }

    const updated = await client.query(
      'UPDATE products SET stock = stock - $2, updated_at = NOW() WHERE product_id = $1 RETURNING product_id, stock',
      [id, qty],
    );

    await client.query('COMMIT');
    return res.json({ product_id: updated.rows[0].product_id, new_stock: Number(updated.rows[0].stock) });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('PATCH /products/:id/reduce-stock', err);
    return res.status(500).json({ error: 'server_error' });
  } finally {
    client.release();
  }
});

// GET /products/:id/history?userId=123&limit=50
// Returns order history for a product with customer, qty, subtotal, and aggregates
router.get('/:id/history', async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId ? Number(req.query.userId) : null;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);

  if (!id || !Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'invalid_product_id' });
  }

  try {
    const params = [id];
    let sql = `
      SELECT
        o.order_id,
        o.created_at,
        o.status,
        c.c_fullname AS customer_name,
        op.quantity,
        op.subtotal
      FROM public.order_products op
      JOIN public.orders o ON o.order_id = op.order_id
      LEFT JOIN public.customer c ON c.id = o.customer_id
      WHERE op.product_id = $1
    `;
    if (userId) {
      params.push(userId);
      sql += ' AND o.user_id = $2';
    }
    sql += ' ORDER BY o.created_at DESC LIMIT ' + limit;

    const { rows } = await pool.query(sql, params);

    const agg = rows.reduce(
      (acc, r) => {
        acc.total_quantity += Number(r.quantity || 0);
        acc.total_sales += Number(r.subtotal || 0);
        return acc;
      },
      { total_quantity: 0, total_sales: 0 },
    );

    return res.json({ history: rows, ...agg });
  } catch (err) {
    console.error('GET /products/:id/history', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
