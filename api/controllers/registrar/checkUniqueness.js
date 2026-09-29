import pool from '../../config/db.js';

export const checkUniqueness = async (req, res) => {
  try {
    const email = (req.query.email || req.body.email || '').trim();
    const mobile_no = (req.query.mobile_no || req.body.mobile_no || '').trim();
    const lrn = (req.query.lrn || req.body.lrn || '').trim();
    const excludeStudentId = (req.query.exclude_student_id || req.body.exclude_student_id || '').trim();

    const results = {
      is_available: true,
      email_taken: false,
      email_message: null,
      mobile_taken: false,
      mobile_message: null,
      lrn_taken: false,
      lrn_message: null
    };

    // 1. Check Email
    if (email) {
      let studentEmailSql = "SELECT id, student_id, first_name, last_name FROM students WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))";
      const params = [email];
      if (excludeStudentId) {
        studentEmailSql += " AND student_id != ?";
        params.push(excludeStudentId);
      }
      studentEmailSql += " LIMIT 1";

      const [studentRows] = await pool.query(studentEmailSql, params);
      if (studentRows.length > 0) {
        results.email_taken = true;
        results.is_available = false;
        results.email_message = `Email is already registered to ${studentRows[0].first_name} ${studentRows[0].last_name} (${studentRows[0].student_id}).`;
      } else {
        const [userRows] = await pool.query("SELECT id, full_name, role FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1", [email]);
        if (userRows.length > 0) {
          results.email_taken = true;
          results.is_available = false;
          results.email_message = `Email is already registered to a system user (${userRows[0].role}).`;
        }
      }
    }

    // 2. Check Mobile Number
    if (mobile_no && mobile_no !== '+639') {
      let studentMobileSql = "SELECT id, student_id, first_name, last_name FROM students WHERE TRIM(mobile_no) = TRIM(?)";
      const params = [mobile_no];
      if (excludeStudentId) {
        studentMobileSql += " AND student_id != ?";
        params.push(excludeStudentId);
      }
      studentMobileSql += " LIMIT 1";

      const [studentMobileRows] = await pool.query(studentMobileSql, params);
      if (studentMobileRows.length > 0) {
        results.mobile_taken = true;
        results.is_available = false;
        results.mobile_message = `Mobile number is already registered to ${studentMobileRows[0].first_name} ${studentMobileRows[0].last_name} (${studentMobileRows[0].student_id}).`;
      }
    }

    // 3. Check LRN
    if (lrn && lrn.toUpperCase() !== 'N/A') {
      let studentLrnSql = "SELECT id, student_id, first_name, last_name FROM students WHERE TRIM(lrn) = TRIM(?)";
      const params = [lrn];
      if (excludeStudentId) {
        studentLrnSql += " AND student_id != ?";
        params.push(excludeStudentId);
      }
      studentLrnSql += " LIMIT 1";

      const [studentLrnRows] = await pool.query(studentLrnSql, params);
      if (studentLrnRows.length > 0) {
        results.lrn_taken = true;
        results.is_available = false;
        results.lrn_message = `LRN is already registered to student ${studentLrnRows[0].first_name} ${studentLrnRows[0].last_name} (${studentLrnRows[0].student_id}).`;
      }
    }

    return res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error("checkUniqueness error:", error);
    return res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
};

export default checkUniqueness;
