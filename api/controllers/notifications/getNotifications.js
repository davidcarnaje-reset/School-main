import pool from '../../config/db.js';

const getNotifications = async (req, res) => {
  const { user_id, role } = req.query;

  if (!user_id || !role) {
    return res.status(400).json({ success: false, message: "User context missing." });
  }

  try {
    // 1. QUERY PARA SA LISTAHAN NG NOTIFICATIONS
    // Nagdagdag tayo ng check para sa 'all' recipients at is_read mapping mula sa notification_reads
    const query = `
      SELECT 
        n.id, 
        n.type, 
        n.title, 
        n.message, 
        n.attachment, 
        n.sender_role,
        n.created_at,
        COALESCE(
          (SELECT 1 FROM notification_reads nr_read 
           WHERE nr_read.notification_id = n.id AND nr_read.user_id = ? AND nr_read.user_role = ?),
          nr.is_read
        ) as is_read,
        COALESCE(
          (SELECT reaction FROM notification_reactions nr_react 
           WHERE nr_react.notification_id = n.id AND nr_react.user_id = ? AND nr_react.user_role = ?),
          nr.reaction
        ) as reaction,
        u.full_name as sender_name,
        u.profile_image as sender_image
      FROM notification_recipients nr
      JOIN notifications n ON nr.notification_id = n.id
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE (nr.recipient_id = ? AND nr.recipient_role = ?)
         OR (nr.recipient_id = 'all' AND (nr.recipient_role = ? OR nr.recipient_role = 'all'))
      ORDER BY n.created_at DESC 
      LIMIT 20
    `;

    const [notifications] = await pool.query(query, [
      user_id, role, // para sa is_read checks
      user_id, role, // para sa reaction checks
      user_id, role, // para sa direktang recipient_id match
      role           // para sa role match
    ]);

    // 2. BILANGIN ANG UNREAD PARA SA RED BADGE (Isinasama ang target na 'all')
    const countQuery = `
      SELECT COUNT(*) as count FROM notification_recipients nr
      JOIN notifications n ON nr.notification_id = n.id
      WHERE (
        (nr.recipient_id = ? AND nr.recipient_role = ? AND nr.is_read = 0)
        OR (
          nr.recipient_id = 'all' 
          AND (nr.recipient_role = ? OR nr.recipient_role = 'all') 
          AND n.id NOT IN (
            SELECT notification_id FROM notification_reads 
            WHERE user_id = ? AND user_role = ?
          )
        )
      )
    `;
    const [countRows] = await pool.query(countQuery, [
      user_id, role,
      role,
      user_id, role
    ]);
    const unread_count = countRows[0].count;

    return res.json({
      success: true,
      notifications: notifications,
      unread_count: parseInt(unread_count, 10)
    });

  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default getNotifications;
