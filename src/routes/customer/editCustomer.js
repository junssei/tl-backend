// routes/auth.js
import express from 'express';
import bcrypt from "bcrypt";
import pool from "../../db.js";

const router = express.Router();

// Register
router.post("/edit", async (req, res) => {
  try {
    const { id, c_fullname, c_phonenumber, c_address, c_gender, userid } = req.body;

    const existing = await pool.query("SELECT * FROM customer WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const result = await pool.query(
      "UPDATE customer SET c_fullname = $1, c_phonenumber = $2, c_address = $3, c_gender = $4, userid = $5 WHERE id = $6 RETURNING *",
      [c_fullname, c_phonenumber, c_address, c_gender, userid, id]
    );

    res.status(200).json({ message: "Customer updated", customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});