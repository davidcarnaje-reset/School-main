import pool from '../../config/db.js';

const reactToNotif = async (req, res) => {
  const { notification_id, user_id, role, reaction } = req.body;

  if (!notification_id || !user_id || !role) {
    return res.status(400).json({ success: false, message: "Missing required data." });
  }

  try {
    const query = `
      INSERT INTO notification_reactions (notification_id, user_id, user_role, reaction, reacted_at) 
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
      reaction = VALUES(reaction), 
      reacted_at = NOW()
    `;
    await pool.query(query, [notification_id, user_id, role, reaction || null]);

    return res.json({ success: true });
  } catch (error) {
    console.error("React to notification error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default reactToNotif;
