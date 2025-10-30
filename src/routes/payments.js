// routes/payments.js
import { Router } from 'express';
import withTransaction from '../utils/tx.js';

const router = Router();

// POST /payments
// body: { creditid, amount_paid }
router.post('/', async (req, res) => {
  const { creditid, amount_paid } = req.body;

  if (!creditid || amount_paid == null || Number(amount_paid) <= 0) {
    return res.status(400).json({ error: 'creditid and positive amount_paid required' });
  }

  try {
    const result = await withTransaction(async (client) => {
      const credit = await client.query(
        'SELECT balance FROM public.credits WHERE id = $1 FOR UPDATE',
        [creditid]
      );
      if (credit.rowCount === 0) return { notFound: true };

      const balance = Number(credit.rows[0].balance || 0);
      if (amount_paid > balance) {
        return { overpay: true, balance };
      }

      const payInsert = `
        INSERT INTO public.payments (credit_id, amount_paid, payment_date)
        VALUES ($1, $2, NOW())
        RETURNING id;
      `;
      const pRes = await client.query(payInsert, [creditid, amount_paid]);

      const newBalance = balance - Number(amount_paid);
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';
      await client.query(
        'UPDATE public.credits SET balance = $1, status = $2 WHERE id = $3',
        [newBalance, newStatus, creditid]
      );

      return { paymentId: pRes.rows[0].id, new_balance: newBalance, status: newStatus };
    });

    if (result.notFound) return res.status(404).json({ error: 'credit_not_found' });
    if (result.overpay) return res.status(400).json({ error: 'amount_exceeds_balance', balance: result.balance });

    return res.json({ id: result.paymentId, new_balance: result.new_balance, status: result.status });
  } catch (err) {
    console.error('POST /payments', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;