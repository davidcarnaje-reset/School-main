import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { username, password, portal } = req.body;
    console.log(`[AUTH LOGGER] Core intercept login trigger for: ${username} on portal: ${portal}`);

    if (!username || !password || !portal) {
      return res.status(400).json({
        status: 'error',
        message: 'Incomplete login credentials.'
      });
    }

    // ==========================================
    // Student Portal Auth Logic
    // ==========================================
    if (portal === 'student') {
      const [rows] = await pool.query(
        "SELECT * FROM students WHERE student_id = ? AND is_verified = 1",
        [username]
      );
      const student = rows[0];

      if (!student) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid Student ID or account not verified.'
        });
      }

      const isAuthenticated = await bcrypt.compare(password, student.password);
      if (!isAuthenticated) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid student credentials.'
        });
      }

      const displayName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
      const token = jwt.sign(
        { username: student.student_id, role: 'student', name: displayName },
        process.env.JWT_SECRET || 'sms_super_secret_key_2026',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        status: 'success',
        token: token,
        user: {
          username: student.student_id,
          name: displayName,
          role: 'student',
          student_id: student.student_id
        }
      });
    }

    // ==========================================
    // Admin & Staff Portals Auth Logic
    // ==========================================
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    let isAuthenticated = false;
    let assignedRole = user.role || 'admin';
    let displayName = user.full_name || 'Administrator';

    // 2. If a user record is found:
    // Check if the input username is EXACTLY 'admin' AND the input plain text password is EXACTLY 'password'.
    if (username === 'admin' && password === 'password') {
      isAuthenticated = true;
      assignedRole = 'admin'; // FORCE role strictly to 'admin'
    } else {
      // 3. Fallback cleanly to use standard bcrypt.compare() mapping rules against the stored user hash.
      isAuthenticated = await bcrypt.compare(password, user.password);
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    // Portal Security check: ensure user is allowed on this portal
    const isAllowed = 
      (portal === 'admin' && assignedRole === 'admin') ||
      (portal === 'staff' && ['registrar', 'cashier', 'teacher'].includes(assignedRole));

    if (!isAllowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access: Account not configured for this portal.'
      });
    }

    const token = jwt.sign(
      { username: user.username, role: assignedRole, name: displayName },
      process.env.JWT_SECRET || 'sms_super_secret_key_2026',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      status: 'success',
      token: token,
      user: {
        username: user.username,
        name: displayName,
        role: assignedRole
      }
    });

  } catch (error) {
    console.error("Login database error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default login;
