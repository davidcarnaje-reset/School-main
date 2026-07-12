import pool from '../../config/db.js';

export const getMySchedule = async (req, res) => {
  const teacherId = req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ status: "error", message: "Teacher ID is missing or invalid." });
  }

  try {
    const query = `
      SELECT 
        ca.id, 
        s.subject_code, 
        s.subject_description, 
        s.units, 
        sec.grade_level, 
        COALESCE(sec.section_name, 'TBA') as section, 
        COALESCE(r.room_name, 'TBA') as room, 
        ca.schedule, 
        ca.school_year 
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.teacher_id = ? AND ca.is_active = 1
      ORDER BY ca.school_year DESC, ca.schedule ASC
    `;

    const [schedule] = await pool.query(query, [teacherId]);

    return res.json({
      status: "success",
      data: schedule || []
    });

  } catch (error) {
    console.error("Get schedule error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { getMySchedule };
