import pool from '../../config/db.js';

const getStudentAnnouncements = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    // SQL query to fetch top 5 announcements targeting the student directly or via role broadcast
    const query = `
      SELECT 
          n.title, 
          n.message, 
          n.type, 
          DATE_FORMAT(n.created_at, '%M %d, %Y') as date_posted 
      FROM notifications n
      INNER JOIN notification_recipients nr ON n.id = nr.notification_id
      WHERE (nr.recipient_id = ? AND nr.recipient_role = 'student')
         OR (nr.recipient_id = 'all' AND (nr.recipient_role = 'student' OR nr.recipient_role = 'all'))
      ORDER BY n.created_at DESC 
      LIMIT 5
    `;

    const [rows] = await pool.query(query, [student_id]);

    return res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error("Get student announcements error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default getStudentAnnouncements;
