import pool from '../../config/db.js';

export const getTeacherProfile = async (req, res) => {
  const teacherId = req.query.id || req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ status: "error", message: "Invalid Teacher ID." });
  }

  try {
    const userQuery = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone_number as phone, 
        role, 
        department, 
        address,
        profile_image, 
        DATE_FORMAT(created_at, '%Y-%m-%d') as dateHired, 
        is_verified 
      FROM users 
      WHERE id = ? AND role = 'teacher' 
      LIMIT 1
    `;

    const [users] = await pool.query(userQuery, [teacherId]);

    if (users.length === 0) {
      return res.status(404).json({ status: "error", message: "Teacher profile not found." });
    }

    const teacher = users[0];

    // Split full_name for the React component
    const nameParts = (teacher.full_name || '').trim().split(' ');
    teacher.firstName = nameParts[0] || '';
    teacher.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    teacher.status = teacher.is_verified === 1 ? 'Active' : 'Pending';

    // Fetch teaching load
    const loadQuery = `
      SELECT 
        s.id, 
        s.subject_code as code, 
        s.subject_description as name, 
        COALESCE(sec.section_name, 'TBA') as section, 
        ca.schedule, 
        COALESCE(r.room_name, 'TBA') as room 
      FROM subjects s
      JOIN class_assignments ca ON s.id = ca.subject_id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.teacher_id = ? AND ca.is_active = 1
    `;

    const [subjects] = await pool.query(loadQuery, [teacherId]);
    teacher.subjects = subjects || [];

    return res.json({
      status: "success",
      data: teacher
    });

  } catch (error) {
    console.error("Get teacher profile error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { getTeacherProfile };
