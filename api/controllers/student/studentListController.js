import pool from '../../config/db.js';

// GET ALL MASTERLIST STUDENTS
export const getStudents = async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.*, 
        DATE_FORMAT(s.dob, '%Y-%m-%d') as dob,
        e.grade_level, 
        e.school_year, 
        e.payment_plan, 
        e.enrollment_type,
        e.status as enrollment_status,
        e.section_id,
        e.program_id,
        sec.section_name as actual_section_name, 
        ap.program_code as ap_code,
        ap.program_description as ap_desc,
        b.id as billing_id, 
        b.payment_status,
        b.total_amount,
        b.paid_amount,
        b.balance,
        b.last_payment_date
      FROM students s 
      LEFT JOIN enrollments e ON e.id = (
        SELECT id FROM enrollments 
        WHERE student_id = s.student_id 
        ORDER BY id DESC LIMIT 1
      )
      LEFT JOIN sections sec ON e.section_id = sec.id 
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      LEFT JOIN student_billing b ON s.student_id = b.student_id
      ORDER BY s.id DESC
    `;

    const [rows] = await pool.query(sql);

    const students = rows.map(row => {
      // Remove sensitive password fields
      delete row.password;

      return {
        ...row,
        paid_amount: parseFloat(row.paid_amount || 0),
        total_amount: parseFloat(row.total_amount || 0),
        balance: parseFloat(row.balance || 0),
        section_id: row.section_id ? parseInt(row.section_id, 10) : null,
        program_id: row.program_id ? parseInt(row.program_id, 10) : null,
        program_code: row.ap_code || 'N/A',
        section: row.actual_section_name || 'TBA'
      };
    });

    const [billingItems] = await pool.query("SELECT billing_id, item_name, amount, paid_amount FROM student_billing_items");

    return res.json({
      success: true,
      students: students || [],
      billing_items: billingItems || []
    });

  } catch (error) {
    console.error("Get students list error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

// GET ASSESSED STUDENTS
export const getAssessedStudents = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.student_id, 
        s.first_name, 
        s.last_name, 
        e.grade_level, 
        p.program_code,
        DATE_FORMAT(e.created_at, '%b %d, %Y') as date_added
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs p ON e.program_id = p.id
      WHERE e.status = 'Assessed'
      ORDER BY e.id DESC
    `;

    const [rows] = await pool.query(query);
    return res.json(rows || []);

  } catch (error) {
    console.error("Get assessed students error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

// GET ENROLLED STUDENTS
export const getEnrolledStudents = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.student_id, 
        s.first_name, 
        s.last_name, 
        e.grade_level, 
        p.program_code,
        DATE_FORMAT(e.created_at, '%b %d, %Y') as date_added
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs p ON e.program_id = p.id
      WHERE e.status = 'Enrolled'
      ORDER BY e.id DESC
    `;

    const [rows] = await pool.query(query);
    return res.json(rows || []);

  } catch (error) {
    console.error("Get enrolled students error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

// GET PENDING STUDENTS
export const getPendingStudents = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.student_id, 
        s.first_name, 
        s.last_name, 
        e.grade_level, 
        e.enrollment_type,
        DATE_FORMAT(e.created_at, '%b %d, %Y') as date_added
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      WHERE e.status = 'Pending'
      ORDER BY e.id DESC
    `;

    const [rows] = await pool.query(query);
    return res.json(rows || []);

  } catch (error) {
    console.error("Get pending students error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default { getStudents, getAssessedStudents, getEnrolledStudents, getPendingStudents };
