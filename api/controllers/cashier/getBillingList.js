import pool from '../../config/db.js';

const getBillingList = async (req, res) => {
  const { search = '', status = 'ALL', limit = 100 } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        b.id as billing_id,
        COALESCE(b.total_amount, 0) as total_amount,
        COALESCE(b.paid_amount, 0) as paid_amount,
        COALESCE(b.balance, 0) as balance,
        COALESCE(b.payment_status, 'Unpaid') as payment_status,
        b.created_at as billing_date,
        (
          SELECT p.program_code 
          FROM enrollments e 
          LEFT JOIN academic_programs p ON e.program_id = p.id 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as program_code,
        (
          SELECT e.grade_level 
          FROM enrollments e 
          WHERE e.student_id = s.student_id 
          ORDER BY e.id DESC LIMIT 1
        ) as grade_level
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

    sql += ` ORDER BY s.id DESC LIMIT ?`;
    queryParams.push(parseInt(limit) || 100);

    const [rows] = await pool.query(sql, queryParams);

    return res.json({
      status: "success",
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error("Get billing list error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default getBillingList;
