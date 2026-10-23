import pool from '../../config/db.js';

const detectEducationLevel = (gradeLevel, department, programCode) => {
  const gl = (gradeLevel || '').toLowerCase().trim();
  const dept = (department || '').toLowerCase().trim();
  const prog = (programCode || '').toLowerCase().trim();

  if (gl.includes('nursery') || gl.includes('kinder') || gl.includes('prep') || gl.includes('preschool')) {
    return 'Preschool';
  }
  if (dept === 'college' || gl.includes('year') || prog.length > 0) {
    return 'College';
  }
  if (gl.includes('grade 11') || gl.includes('grade 12') || dept === 'shs' || gl.includes('senior')) {
    return 'SHS';
  }
  if (gl.includes('grade 7') || gl.includes('grade 8') || gl.includes('grade 9') || gl.includes('grade 10') || 
      gl.includes('junior') || gl.includes('jhs') || gl.includes('high school')) {
    return 'HS';
  }
  if (gl.includes('grade 1') || gl.includes('grade 2') || gl.includes('grade 3') || 
      gl.includes('grade 4') || gl.includes('grade 5') || gl.includes('grade 6') || gl.includes('elem')) {
    return 'Elementary';
  }
  return 'Elementary';
};

const getBillingList = async (req, res) => {
  const { search = '', status = 'ALL', level = 'ALL', limit = 100 } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.profile_image,
        b.id as billing_id,
        COALESCE(b.total_amount, 0) as total_amount,
        COALESCE(b.paid_amount, 0) as paid_amount,
        COALESCE(b.balance, 0) as balance,
        COALESCE(b.payment_status, 'Unpaid') as payment_status,
        b.last_payment_date as billing_date,
        (
          SELECT p.program_code 
          FROM enrollments e 
          LEFT JOIN academic_programs p ON e.program_id = p.id 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as program_code,
        (
          SELECT p.department 
          FROM enrollments e 
          LEFT JOIN academic_programs p ON e.program_id = p.id 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as department,
        (
          SELECT e.grade_level 
          FROM enrollments e 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as grade_level,
        (
          SELECT e.status 
          FROM enrollments e 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as enrollment_status
      FROM students s
      LEFT JOIN (
        SELECT b1.*
        FROM student_billing b1
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id
          FROM student_billing
          GROUP BY student_id
        ) b2 ON b1.id = b2.max_id
      ) b ON s.student_id = b.student_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        s.student_id LIKE ? OR 
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR
        CONCAT(s.last_name, ', ', s.first_name) LIKE ?
      )`;
      queryParams.push(term, term, term, term, term);
    }

    if (status && status !== 'ALL') {
      sql += ` AND UPPER(COALESCE(b.payment_status, 'Unpaid')) = ?`;
      queryParams.push(status.toUpperCase());
    }

    sql += ` ORDER BY (
      SELECT CASE WHEN e.status = 'Assessed' THEN 1 ELSE 0 END 
      FROM enrollments e WHERE e.student_id = s.student_id ORDER BY e.id DESC LIMIT 1
    ) DESC, b.balance DESC, s.id DESC LIMIT ?`;
    queryParams.push(parseInt(limit, 10) || 100);

    const [rows] = await pool.query(sql, queryParams);

    const processed = (rows || []).map(r => ({
      ...r,
      total_amount: parseFloat(r.total_amount) || 0,
      paid_amount: parseFloat(r.paid_amount) || 0,
      balance: parseFloat(r.balance) || 0,
      detected_level: detectEducationLevel(r.grade_level, r.department, r.program_code)
    }));

    const finalData = (level && level !== 'ALL')
      ? processed.filter(r => r.detected_level.toLowerCase() === level.toLowerCase())
      : processed;

    return res.json({
      status: "success",
      count: finalData.length,
      data: finalData
    });
  } catch (error) {
    console.error("Get billing list error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default getBillingList;
