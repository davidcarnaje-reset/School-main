import pool from '../../config/db.js';

const getAvailableContacts = async (req, res) => {
  const { user_id, user_role } = req.query;

  if (!user_id || !user_role) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    let contacts = [];

    if (user_role === 'student') {
      // 1. KUNIN ANG MGA TEACHERS NG STUDENT
      const teacherQuery = `
        SELECT DISTINCT u.id as contact_id, u.full_name as contact_name, u.role as contact_role, u.profile_image
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN users u ON ca.teacher_id = u.id
        WHERE ec.student_id = ? AND ec.status = 'Enrolled'
      `;
      const [teachers] = await pool.query(teacherQuery, [user_id]);

      // 2. KUNIN ANG MGA REGISTRAR AT CASHIER (General Staff)
      const staffQuery = `
        SELECT id as contact_id, full_name as contact_name, role as contact_role, profile_image 
        FROM users 
        WHERE role IN ('registrar', 'cashier') AND status = 'Active'
      `;
      const [staff] = await pool.query(staffQuery);

      contacts = [...teachers, ...staff];
    } else {
      // Kung Staff ang naka-login, ipakita lahat ng students
      const studentQuery = `
        SELECT student_id as contact_id, CONCAT(first_name, ' ', last_name) as contact_name, 'student' as contact_role, profile_image 
        FROM students
      `;
      const [students] = await pool.query(studentQuery);
      contacts = students;
    }

    return res.json({
      status: "success",
      contacts: contacts
    });

  } catch (error) {
    console.error("Get available contacts error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default getAvailableContacts;
