import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Nagpaparami ng custom JWT token na kahalintulad ng nakaraang PHP implementation
 * upang manatiling tugma sa kasalukuyang client decoding/authentication logic.
 */
function generateToken(userId, role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    user_id: userId,
    role: role,
    exp: Math.floor(Date.now() / 1000) + 86400
  })).toString('base64');
  
  const secret = 'Sms_S3cr3t_K3y_2026_Obando!';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64');
    
  return `${header}.${payload}.${signature}`;
}

const login = async (req, res) => {
  const { username, password, portal } = req.body;

  if (!username || !password || !portal) {
    return res.status(400).json({ success: false, message: "Incomplete login data." });
  }

  try {
    // ==========================================
    // PINTO NG ESTUDYANTE
    // ==========================================
    if (portal === 'student') {
      const [rows] = await pool.query(
        "SELECT * FROM students WHERE student_id = ? AND is_verified = 1",
        [username]
      );
      const user = rows[0];

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          token: generateToken(user.student_id, 'student'),
          user: {
            id: user.student_id,
            username: user.student_id,
            role: "student",
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            profile_image: user.profile_image || null
          }
        });
      } else {
        return res.json({ success: false, message: "Invalid credentials or account not active." });
      }
    }

    // ==========================================
    // PINTO NG ADMIN & STAFF
    // ==========================================
    else {
      const [rows] = await pool.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );
      const user = rows[0];

      if (user && (await bcrypt.compare(password, user.password))) {
        const isAllowed = 
          (portal === 'admin' && user.role === 'admin') ||
          (portal === 'staff' && ['registrar', 'cashier', 'teacher'].includes(user.role));

        if (isAllowed) {
          return res.json({
            success: true,
            token: generateToken(user.id, user.role),
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              full_name: user.full_name,
              email: user.email,
              profile_image: user.profile_image || null
            }
          });
        } else {
          return res.json({ success: false, message: "Unauthorized portal access." });
        }
      } else {
        return res.json({ success: false, message: "Invalid credentials." });
      }
    }
  } catch (error) {
    console.error("Login database error:", error);
    // Safe error handling katulad sa PHP PDOException catch block
    return res.status(500).json({ success: false, message: "System error occurred." });
  }
};

export default login;
