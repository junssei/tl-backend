import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import uploadRouter from './routes/uploadRoute.mjs';
import customerRoutes from './routes/customer/crud.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.use('/api', uploadRouter);

app.use('/customers', customerRoutes);

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT (id, email, username, phonenumber, createdat, tindahan_name, role, profile_img, gender) FROM users',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Screen
app.get('/users/:userid/customerlist', async (req, res) => {
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

// Customer Profile
app.get('/user/:userid/customer/:customerid/profile', async (req, res) => {
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
