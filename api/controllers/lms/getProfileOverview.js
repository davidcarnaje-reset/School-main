import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

export const getProfileOverview = async (req, res) => {
  const rawStudentId = req.query.student_id;

  if (!rawStudentId) {
    return res.status(400).json({ error: "Missing student_id parameter" });
  }

  try {
    const studentId = await resolveStudentId(rawStudentId);

    // Auto-sync officially enrolled classes
    await syncStudentEnrolledClasses(studentId);

    // 1. Get profile data
    const profileQuery = `
      SELECT 
        s.id as numeric_id, s.student_id, s.first_name, s.last_name, s.email, s.mobile_no, s.address_city, s.address_province,
        e.grade_level, e.school_year, ap.program_code, sec.section_name
      FROM students s
      LEFT JOIN enrollments e ON (s.student_id = e.student_id OR s.id = e.student_id) AND e.status IN ('Enrolled', 'Assessed')
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      LEFT JOIN sections sec ON e.section_id = sec.id
      WHERE s.student_id = ? OR s.id = ?
      ORDER BY e.created_at DESC LIMIT 1
    `;

    const [profiles] = await pool.query(profileQuery, [studentId, rawStudentId]);

    if (profiles.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const profileData = profiles[0];
    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(studentId),
      ...(profileData.numeric_id ? [String(profileData.numeric_id)] : []),
      ...(profileData.student_id ? [String(profileData.student_id)] : [])
    ]));

    // 2. Get subjects & teachers
    const subjectsQuery = `
      SELECT DISTINCT
        sub.subject_code, 
        sub.subject_description, 
        COALESCE(NULLIF(TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, ''))), ''), 'To Be Assigned') AS teacher_name, 
        t.profile_image
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN users t ON ca.teacher_id = t.id
      WHERE ec.student_id IN (?) AND ec.status = 'Enrolled'
      ORDER BY sub.subject_code ASC
    `;

    const [subjectsData] = await pool.query(subjectsQuery, [idCandidates]);

    // Unique teachers mapping
    const teachersMap = {};
    subjectsData.forEach(row => {
      if (row.teacher_name && !teachersMap[row.teacher_name]) {
        teachersMap[row.teacher_name] = {
          name: row.teacher_name,
          image: row.profile_image
        };
      }
    });

    const teachersData = Object.values(teachersMap);

    return res.json({
      profile: profileData,
      subjects: subjectsData,
      teachers: teachersData
    });

  } catch (error) {
    console.error("Profile overview error:", error);
    return res.status(500).json({ error: "Database Error: " + error.message });
  }
};

export default getProfileOverview;
