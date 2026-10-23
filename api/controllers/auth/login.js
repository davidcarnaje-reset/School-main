import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logAuditTrail } from '../../utils/auditLogger.js';

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
        "SELECT * FROM students WHERE (student_id = ? OR email = ?) AND is_verified = 1",
        [username, username]
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

      // Fetch student's latest enrollment info
      const [enrRows] = await pool.query(
        "SELECT grade_level, section_id, status FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1",
        [student.student_id]
      );
      const enrollment = enrRows[0] || {};

      // Trigger automatic LMS classes sync in background
      try {
        const { syncStudentEnrolledClasses } = await import('../../utils/lmsSync.js');
        await syncStudentEnrolledClasses(student.student_id);
      } catch (syncErr) {
        console.warn("[LMS SYNC WARNING] Failed to sync on login:", syncErr.message);
      }

      const displayName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
      const token = jwt.sign(
        { username: student.student_id, role: 'student', name: displayName, school_id: student.school_id },
        process.env.JWT_SECRET || 'sms_super_secret_key_2026',
        { expiresIn: '24h' }
      );

      await logAuditTrail(
        1,
        'student',
        'LOGIN',
        `Student ID ${student.student_id} (${displayName}) logged in successfully.`,
        req
      );

      return res.status(200).json({
        status: 'success',
        token: token,
        user: {
          id: student.student_id,
          username: student.student_id,
          name: displayName,
          full_name: displayName,
          email: student.email,
          role: 'student',
          student_id: student.student_id,
          school_id: student.school_id,
          grade_level: enrollment.grade_level || 'Grade 1',
          section_id: enrollment.section_id || null,
          enrollment_status: enrollment.status || 'Enrolled',
          profile_image: student.profile_image
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
      assignedRole = 'super_admin'; // FORCE role strictly to 'super_admin'
    } else {
      // 3. Fallback cleanly to use standard bcrypt.compare() mapping rules against the stored user hash.
      isAuthenticated = await bcrypt.compare(password, user.password);
      if (isAuthenticated && portal === 'admin' && assignedRole === 'admin') {
        assignedRole = 'super_admin';
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password.'
      });
    }

    const isAllowed = 
      (portal === 'admin' && assignedRole === 'super_admin') ||
      (portal === 'staff' && ['admin', 'registrar', 'cashier', 'teacher', 'hr', 'it', 'school_admin', 'custodian'].includes(assignedRole));

    if (!isAllowed) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access: Account not configured for this portal.'
      });
    }

    const token = jwt.sign(
      { username: user.username, role: assignedRole, name: displayName, school_id: user.school_id },
      process.env.JWT_SECRET || 'sms_super_secret_key_2026',
      { expiresIn: '24h' }
    );

    await logAuditTrail(
      user.id,
      assignedRole,
      'LOGIN',
      `User ${user.username} (${displayName}) logged in successfully via ${portal} portal.`,
      req
    );

    return res.status(200).json({
      status: 'success',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: displayName,
        full_name: displayName,
        role: assignedRole,
        school_id: user.school_id,
        profile_image: user.profile_image
      }
    });

  } catch (error) {
    console.error("Login database error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default login;
