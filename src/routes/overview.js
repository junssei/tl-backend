import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /overview/summary
// Returns row counts for key tables
router.get('/summary', async (req, res) => {
  try {
    const queries = [
      { key: 'users', sql: 'SELECT COUNT(*)::int AS count FROM users' },
      { key: 'customer', sql: 'SELECT COUNT(*)::int AS count FROM customer' },
      { key: 'products', sql: 'SELECT COUNT(*)::int AS count FROM products' },
      { key: 'orders', sql: 'SELECT COUNT(*)::int AS count FROM public.orders' },
      { key: 'credits', sql: 'SELECT COUNT(*)::int AS count FROM public.credits' },
      { key: 'payments', sql: 'SELECT COUNT(*)::int AS count FROM public.payments' },
      { key: 'order_products', sql: 'SELECT COUNT(*)::int AS count FROM public.order_products' },
    ];

    const results = await Promise.all(
      queries.map((q) => pool.query(q.sql))
    );

    const summary = {};
    results.forEach((r, idx) => {
      summary[queries[idx].key] = r.rows[0]?.count ?? 0;
    });

    return res.json(summary);
  } catch (err) {
    console.error('GET /overview/summary', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// GET /overview
// Returns limited rows for each table (default limit=50)
router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  try {
    const dataQueries = [
      { key: 'users', sql: 'SELECT id, email, username, phonenumber, createdat, tindahan_name, role, profile_img, gender FROM users ORDER BY id DESC LIMIT $1' },
      { key: 'customer', sql: 'SELECT * FROM customer ORDER BY id DESC LIMIT $1' },
      { key: 'products', sql: 'SELECT * FROM products ORDER BY product_id DESC LIMIT $1' },
      { key: 'orders', sql: 'SELECT * FROM public.orders ORDER BY order_id DESC LIMIT $1' },
      { key: 'credits', sql: 'SELECT * FROM public.credits ORDER BY id DESC LIMIT $1' },
      { key: 'payments', sql: 'SELECT * FROM public.payments ORDER BY id DESC LIMIT $1' },
      { key: 'order_products', sql: 'SELECT * FROM public.order_products ORDER BY id DESC LIMIT $1' },
    ];

    const results = await Promise.all(
      dataQueries.map((q) => pool.query(q.sql, [limit]))
    );

    const payload = {};
    results.forEach((r, idx) => {
      payload[dataQueries[idx].key] = r.rows;
    });

    return res.json({ limit, ...payload });
  } catch (err) {
    console.error('GET /overview', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;


