import pool from '../../config/db.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, getFrontendUrl } from '../../utils/emailEngine.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide an email address." });
    }

    let userType = null;
    let firstName = "User";

    // 1. Check in USERS
    const [userRows] = await pool.query("SELECT id, full_name FROM users WHERE email = ?", [email]);
    if (userRows.length > 0) {
      firstName = userRows[0].full_name;
      userType = 'users';
    } else {
      // 2. Check in STUDENTS
      const [studentRows] = await pool.query("SELECT student_id, first_name, last_name FROM students WHERE email = ?", [email]);
      if (studentRows.length > 0) {
        firstName = `${studentRows[0].first_name} ${studentRows[0].last_name}`.trim();
        userType = 'students';
      }
    }

    if (!userType) {
      return res.status(400).json({ success: false, message: "We could not find an account registered with that email address." });
    }

    // Generate secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save token to table
    if (userType === 'users') {
      await pool.query("UPDATE users SET reset_token = ? WHERE email = ?", [resetToken, email]);
    } else {
      await pool.query("UPDATE students SET reset_token = ? WHERE email = ?", [resetToken, email]);
    }

    const portalType = userType === 'users' ? 'staff' : 'student';
    const userId = userType === 'users' ? userRows[0].id : 1;
    const frontendUrl = getFrontendUrl(req);
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&portal=${portalType}`;

    // Send email using emailEngine
    try {
      await sendPasswordResetEmail(email, firstName, resetLink);

      await logAuditTrail(
        userId,
        portalType,
        "FORGOT_PASSWORD_REQUEST",
        `Requested password reset link for email: ${email}`,
        req
      );

      return res.json({ success: true, message: "A password reset link has been sent to your email." });
    } catch (emailErr) {
      console.error("Forgot password email send error:", emailErr);
      return res.status(500).json({ success: false, message: "Mailer Error: Failed to send password reset email." });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Database error occurred." });
  }
};

export default forgotPassword;
