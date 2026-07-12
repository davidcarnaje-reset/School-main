import pool from '../../config/db.js';

// 1. GET TEACHER/STAFF ANNOUNCEMENTS
export const getAnnouncements = async (req, res) => {
  const userId = req.query.user_id;
  const role = req.query.role || 'teacher';
  const fetchType = req.query.fetch_type || 'both';

  if (!userId) {
    return res.status(400).json({ status: "error", message: "User ID is required." });
  }

  try {
    let whereClause = "";
    const params = [userId, role, userId, role];

    if (fetchType === 'general') {
      whereClause = "(nr.recipient_role = ? OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all'";
      params.push(role);
    } else if (fetchType === 'specific') {
      whereClause = "nr.recipient_id = ? AND nr.recipient_role = ? AND LOWER(nr.recipient_id) != 'all'";
      params.push(userId, role);
    } else {
      whereClause = `(nr.recipient_id = ? AND nr.recipient_role = ? AND LOWER(nr.recipient_id) != 'all') 
                     OR ((nr.recipient_role = ? OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all')`;
      params.push(userId, role, role);
    }

    const query = `
      SELECT DISTINCT
        n.id, 
        n.title, 
        n.message, 
        n.type, 
        n.sender_role, 
        n.created_at,
        n.attachment,
        nr.recipient_id,
        u.full_name as sender_name,
        u.profile_image as sender_image,
        IF(n_read.id IS NOT NULL, 1, 0) as is_read,
        n_react.reaction
      FROM notifications n
      JOIN notification_recipients nr ON n.id = nr.notification_id
      LEFT JOIN users u ON n.sender_id = u.id
      
      LEFT JOIN notification_reads n_read 
        ON n.id = n_read.notification_id 
        AND n_read.user_id = ? 
        AND n_read.user_role = ?
          
      LEFT JOIN notification_reactions n_react 
        ON n.id = n_react.notification_id 
        AND n_react.user_id = ? 
        AND n_react.user_role = ?
          
      WHERE ${whereClause}
      ORDER BY n.created_at DESC 
      LIMIT 50
    `;

    const [announcements] = await pool.query(query, params);

    return res.json({
      status: "success",
      data: announcements || []
    });

  } catch (error) {
    console.error("Get announcements error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// 2. MARK NOTIFICATIONS AS READ
export const markNotificationsRead = async (req, res) => {
  const { user_id: userId, role } = req.body;
  const userRole = role || 'teacher';

  if (!userId) {
    return res.status(400).json({ status: "error", message: "User ID is required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Mark specific records as read
    await connection.query(
      `UPDATE notification_recipients 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE recipient_id = ? AND is_read = 0`,
      [userId]
    );

    // Mark general records (where recipient_id is 'all') as read
    await connection.query(
      `UPDATE notification_recipients 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE recipient_id = 'all' AND (recipient_role = ? OR recipient_role = 'all') AND is_read = 0`,
      [userRole]
    );

    await connection.commit();

    return res.json({
      status: "success",
      message: "All notifications marked as read."
    });

  } catch (error) {
    await connection.rollback();
    console.error("Mark notifications read error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export default { getAnnouncements, markNotificationsRead };
