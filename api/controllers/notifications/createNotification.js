import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

const createNotification = async (req, res) => {
  // Kunin ang data mula sa request body (na pinarse ng multer at express.json)
  const sender_id = req.body.sender_id || 1;
  const sender_role = req.body.sender_role || 'admin';
  const type = req.body.type || 'Announcement';
  const targetType = req.body.targetType || 'role';
  const targetRole = req.body.targetRole || '';
  const targetUserId = req.body.targetUserId || '';
  const title = (req.body.title || '').trim();
  const message = (req.body.message || '').trim();
  const dueDate = req.body.dueDate || null;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and Message are required." });
  }

  try {
    // 1. Kuhanin ang pangalan ng uploaded file mula sa multer (kung mayroon)
    const attachment_filename = req.file ? req.file.filename : null;

    // 2. Format message kung Task Reminder ang type
    let final_message = message;
    if (type === 'Task Reminder' && dueDate) {
      const dateObj = new Date(dueDate);
      if (!isNaN(dateObj.getTime())) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const formattedDate = `${months[dateObj.getMonth()]} ${dateObj.getDate().toString().padStart(2, '0')}, ${dateObj.getFullYear()}`;
        final_message = `[DUE: ${formattedDate}]\n\n${message}`;
      }
    }

    // 3. I-determine ang listahan ng makakatanggap
    let recipients = [];
    let recipient_count_for_log = 0;

    if (targetType === 'user' && targetUserId) {
      recipients.push({ id: targetUserId, role: targetRole });
      recipient_count_for_log = 1;
    } else if (targetType === 'role') {
      recipients.push({ id: 'all', role: targetRole });
      if (targetRole === 'student') {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM students");
        recipient_count_for_log = rows[0].count;
      } else {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = ?", [targetRole]);
        recipient_count_for_log = rows[0].count;
      }
    } else {
      recipients.push({ id: 'all', role: 'all' });
      const [uRows] = await pool.query("SELECT COUNT(*) as count FROM users");
      const [sRows] = await pool.query("SELECT COUNT(*) as count FROM students");
      recipient_count_for_log = Number(uRows[0].count) + Number(sRows[0].count);
    }

    // 4. I-save ang notification at mga recipients sa loob ng DATABASE TRANSACTION
    const connection = await pool.getConnection();
    let notification_id = null;
    try {
      await connection.beginTransaction();

      const notifQuery = "INSERT INTO notifications (sender_id, sender_role, type, title, message, attachment) VALUES (?, ?, ?, ?, ?, ?)";
      const [notifResult] = await connection.query(notifQuery, [
        sender_id, sender_role, type, title, final_message, attachment_filename
      ]);
      notification_id = notifResult.insertId;

      if (recipients.length > 0) {
        const recipientQuery = "INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role) VALUES (?, ?, ?)";
        for (const r of recipients) {
          await connection.query(recipientQuery, [notification_id, r.id, r.role]);
        }
      } else {
        throw new Error("No recipients found for the selected target.");
      }

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    // 5. I-log ang transaksyon sa audit log
    const log_target = (targetType === 'all') ? "Everyone" : (targetType === 'role' ? `all ${targetRole}s` : `User ${targetUserId}`);
    const action_type = 'CREATE_NOTIFICATION';
    const log_desc = `Sent a ${type}: '${title}' to ${log_target}. Estimated Recipients: ${recipient_count_for_log}`;

    await logAuditTrail(sender_id, sender_role, action_type, log_desc, req);

    return res.json({ success: true, message: "Notification sent successfully!" });

  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default createNotification;
