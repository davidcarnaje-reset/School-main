import pool from '../../config/db.js';

const getNotifications = async (req, res) => {
  const user_id = req.query.user_id || req.user?.id || (req.user?.role === 'student' ? req.user?.student_id : 1);
  const role = req.query.role || req.user?.role || 'admin';

  try {
    // Resolve candidate IDs if student (so both numeric students.id and string students.student_id match)
    let idCandidates = [String(user_id)];
    if (String(role).toLowerCase() === 'student') {
      const [stRows] = await pool.query(
        "SELECT id, student_id FROM students WHERE id = ? OR student_id = ? OR email = ? LIMIT 1",
        [user_id, user_id, user_id]
      );
      if (stRows.length > 0) {
        idCandidates = Array.from(new Set([
          String(user_id),
          String(stRows[0].id),
          String(stRows[0].student_id)
        ].filter(Boolean)));
      }
    }

    // 1. QUERY PARA SA LISTAHAN NG NOTIFICATIONS
    const query = `
      SELECT DISTINCT
        n.id, 
        n.type, 
        n.title, 
        n.message, 
        n.attachment, 
        n.sender_role,
        n.created_at,
        COALESCE(
          (SELECT 1 FROM notification_reads nr_read 
           WHERE nr_read.notification_id = n.id AND nr_read.user_id IN (?) AND nr_read.user_role = ? LIMIT 1),
          nr.is_read
        ) as is_read,
        COALESCE(
          (SELECT reaction FROM notification_reactions nr_react 
           WHERE nr_react.notification_id = n.id AND nr_react.user_id IN (?) AND nr_react.user_role = ? LIMIT 1),
          nr.reaction
        ) as reaction,
        COALESCE(
          NULLIF(TRIM(u.full_name), ''),
          NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
          'System'
        ) as sender_name,
        u.profile_image as sender_image
      FROM notification_recipients nr
      JOIN notifications n ON nr.notification_id = n.id
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE (nr.recipient_id IN (?) AND nr.recipient_role = ?)
         OR (LOWER(nr.recipient_id) = 'all' AND (nr.recipient_role = ? OR nr.recipient_role = 'all'))
      ORDER BY n.created_at DESC 
      LIMIT 25
    `;

    const [notifications] = await pool.query(query, [
      idCandidates, role, // para sa is_read checks
      idCandidates, role, // para sa reaction checks
      idCandidates, role, // para sa direktang recipient_id match
      role                // para sa role match
    ]);

    // 2. BILANGIN ANG UNREAD PARA SA RED BADGE (Isinasama ang target na 'all')
    const countQuery = `
      SELECT COUNT(DISTINCT n.id) as count FROM notification_recipients nr
      JOIN notifications n ON nr.notification_id = n.id
      WHERE (
        (nr.recipient_id IN (?) AND nr.recipient_role = ? AND nr.is_read = 0)
        OR (
          LOWER(nr.recipient_id) = 'all' 
          AND (nr.recipient_role = ? OR nr.recipient_role = 'all') 
          AND n.id NOT IN (
            SELECT notification_id FROM notification_reads 
            WHERE user_id IN (?) AND user_role = ?
          )
        )
      )
    `;
    const [countRows] = await pool.query(countQuery, [
      idCandidates, role,
      role,
      idCandidates, role
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
