import pool from '../../config/db.js';

const getReactions = async (req, res) => {
  const { notification_id } = req.query;

  if (!notification_id) {
    return res.status(400).json({ success: false, message: "Notification ID is required." });
  }

  try {
    const query = `
      SELECT 
          nr.reaction,
          nr.reacted_at,
          nr.user_role as recipient_role,
          CASE 
              WHEN nr.user_role = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
              ELSE u.full_name 
          END as reactor_name,
          CASE 
              WHEN nr.user_role = 'student' THEN s.profile_image
              ELSE u.profile_image 
          END as profile_image
      FROM notification_reactions nr
      LEFT JOIN students s ON nr.user_id = s.student_id AND nr.user_role = 'student'
      LEFT JOIN users u ON nr.user_id = u.id AND nr.user_role != 'student'
      WHERE nr.notification_id = ? 
      AND nr.reaction IS NOT NULL
      ORDER BY nr.reacted_at DESC
    `;

    const [reactions] = await pool.query(query, [notification_id]);

    const summary = { like: 0, heart: 0, noted: 0, total: reactions.length };
    reactions.forEach(r => {
      if (summary[r.reaction] !== undefined) {
        summary[r.reaction]++;
      }
    });

    return res.json({
      success: true,
      summary: summary,
      reactors: reactions
    });

  } catch (error) {
    console.error("Get reactions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default getReactions;
