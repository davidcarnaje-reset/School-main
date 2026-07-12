import pool from '../../config/db.js';

// GET STUDENT PORTAL ANNOUNCEMENTS
export const getStudentAnnouncements = async (req, res) => {
  const studentId = req.query.student_id;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        DATE_FORMAT(created_at, '%b %d, %Y') as date_posted
      FROM notifications 
      WHERE type IN ('Announcement', 'Urgent Alert', 'Task Reminder')
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [announcements] = await pool.query(query);

    return res.json({
      success: true,
      data: announcements || []
    });

  } catch (error) {
    console.error("Get student announcements error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getStudentAnnouncements };
