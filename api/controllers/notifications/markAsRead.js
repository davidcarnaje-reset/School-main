import pool from '../../config/db.js';

const markAsRead = async (req, res) => {
  const { notification_id, user_id } = req.body;

  if (!notification_id || !user_id) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const query = `
      UPDATE notification_recipients 
      SET is_read = 1, read_at = NOW() 
      WHERE notification_id = ? AND recipient_id = ?
    `;
    await pool.query(query, [notification_id, user_id]);

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default markAsRead;
