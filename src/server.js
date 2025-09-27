import authRoutes from "./routes/auth";

const express = require("express");
const cors = require("cors");
const pool = require("./db");

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

app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customer");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/customers/:id", async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
