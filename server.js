const express = require("express");
const cors = require("cors");
const pool = require("./db");

require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
