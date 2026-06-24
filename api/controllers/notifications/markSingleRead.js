import pool from '../../config/db.js';

const markSingleRead = async (req, res) => {
  const { notification_id, user_id, role } = req.body;

  if (!notification_id || !user_id || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const query = `
      INSERT IGNORE INTO notification_reads (notification_id, user_id, user_role) 
      VALUES (?, ?, ?)
    `;
    await pool.query(query, [notification_id, user_id, role]);

    return res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    console.error("Mark single read error:", error);
    return res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
};

export default markSingleRead;
