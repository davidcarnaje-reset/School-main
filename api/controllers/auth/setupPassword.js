import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const setupPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete data provided.'
      });
    }

    const trimmedEmail = email.trim();
    const trimmedToken = token.trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Check in USERS table (Staff/Admin)
    const [userRows] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND verification_token = ? AND is_verified = 0",
      [trimmedEmail, trimmedToken]
    );

    if (userRows.length > 0) {
      await pool.query(
        "UPDATE users SET password = ?, is_verified = 1, verification_token = NULL WHERE email = ?",
        [hashedPassword, trimmedEmail]
      );
      await logAuditTrail(
        userRows[0].id,
        'staff',
        "VERIFY_ACCOUNT",
        `Staff account verified for email: ${trimmedEmail}`,
        req
      );

      return res.status(200).json({
        success: true,
        message: "Staff account verified successfully!",
        portal: "staff"
      });
    }

    // 2. Check in STUDENTS table
    const [studentRows] = await pool.query(
      "SELECT student_id FROM students WHERE email = ? AND verification_token = ? AND is_verified = 0",
      [trimmedEmail, trimmedToken]
    );

    if (studentRows.length > 0) {
      await pool.query(
        "UPDATE students SET password = ?, is_verified = 1, verification_token = NULL WHERE email = ?",
        [hashedPassword, trimmedEmail]
      );
      await logAuditTrail(
        1,
        'student',
        "VERIFY_ACCOUNT",
        `Student account verified for email: ${trimmedEmail} (Student ID: ${studentRows[0].student_id})`,
        req
      );

      return res.status(200).json({
        success: true,
        message: "Student account verified successfully!",
        portal: "student"
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid link, expired token, or account is already verified."
    });

  } catch (error) {
    console.error("Setup password error:", error);
    return res.status(500).json({
      success: false,
      message: "Database error occurred."
    });
  }
};

export default setupPassword;
