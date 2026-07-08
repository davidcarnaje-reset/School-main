import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';

export const resetPassword = async (req, res) => {
  try {
    const { token, password, portal } = req.body;

    if (!token || !password || !portal) {
      return res.status(400).json({ success: false, message: "Incomplete reset data." });
    }

    const trimmedToken = token.trim();
    const portalType = portal.trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (portalType === 'student') {
      const [rows] = await pool.query("SELECT student_id FROM students WHERE reset_token = ?", [trimmedToken]);
      if (rows.length > 0) {
        await pool.query("UPDATE students SET password = ?, reset_token = NULL WHERE reset_token = ?", [hashedPassword, trimmedToken]);
        return res.json({ success: true, message: "Student password successfully updated!" });
      } else {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
      }
    } else {
      const [rows] = await pool.query("SELECT id FROM users WHERE reset_token = ?", [trimmedToken]);
      if (rows.length > 0) {
        await pool.query("UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?", [hashedPassword, trimmedToken]);
        return res.json({ success: true, message: "Staff password successfully updated!" });
      } else {
        return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
      }
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Database error occurred." });
  }
};

export default resetPassword;
