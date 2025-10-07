const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth");

require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Screen
app.get("/users/:userid/customerlist", async (req, res) => {
  try {
    const { userid } = req.params

    // users customer
    const result = await pool.query("SELECT credits.id, credits.amount, customer.c_fullname, customer.c_gender FROM customer INNER JOIN credits ON credits.customerid = customer.id WHERE userid = $1", [userid]);
    
    if (result.rows.length === 0) {
      return res.json({ message: "No rows found", data: [] });
    }
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Profile
app.get("/users/:id/customers/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM customer WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]); // return single user
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
