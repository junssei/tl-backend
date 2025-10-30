// routes/orderItems.js
import { Router } from 'express';
import withTransaction from '../utils/tx.js';

const router = Router();

// POST /order-items/bulk
// body: { items: [{ orderid, productid, quantity, subtotal }] }
router.post('/bulk', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  try {
    const inserted = await withTransaction(async (client) => {
      const text =
        'INSERT INTO order_products (order_id, product_id, quantity, subtotal) VALUES ($1, $2, $3, $4)';
      for (const it of items) {
        if (!it.orderid || !it.productid || it.quantity == null || it.subtotal == null) {
          throw new Error('invalid_item');
        }
        await client.query(text, [it.orderid, it.productid, it.quantity, it.subtotal]);
      }
      return items.length;
    });

    return res.json({ inserted });
  } catch (err) {
    console.error('POST /order-items/bulk', err);
    const code = err.message === 'invalid_item' ? 400 : 500;
    return res.status(code).json({ error: err.message || 'internal_error' });
  }
});

export default router;