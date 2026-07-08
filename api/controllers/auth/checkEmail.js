import pool from '../../config/db.js';

export const checkEmail = async (req, res) => {
  try {
    const email = (req.query.email || req.body.email || '').trim();
    if (!email) {
      return res.status(400).json({ exists: false, message: "Email is required." });
    }

    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [email]);

    if (userRows.length > 0 || studentRows.length > 0) {
      return res.json({
        exists: true,
        message: "Email is already registered in the system."
      });
    } else {
      return res.json({
        exists: false,
        message: "Email is available."
      });
    }
  } catch (error) {
    console.error("Check email error:", error);
    return res.status(500).json({ exists: false, message: "Database error occurred." });
  }
};

export default checkEmail;
