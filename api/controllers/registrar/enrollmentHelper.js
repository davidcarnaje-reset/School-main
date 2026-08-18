import pool from '../../config/db.js';

export const getStudentsByStatus = async (req, res) => {
  const { status } = req.query;
  const targetStatus = status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Pending';

  try {
    const sql = `
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        e.grade_level,
        e.program_id,
        ap.program_code,
        ap.department,
        ap.major,
        e.status as enrollment_status,
        s.first_name,
        s.last_name,
        s.profile_image,
        ap.program_description
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE e.status = ?
      ORDER BY e.created_at DESC
    `;
    const [data] = await pool.query(sql, [targetStatus]);

    // Format profile_image path if it's relative
    const formattedData = (data || []).map(student => {
      if (student.profile_image && !student.profile_image.startsWith('http://') && !student.profile_image.startsWith('https://')) {
        student.profile_image = `http://localhost/sms-api/uploads/profiles/${student.profile_image}`;
      }
      return student;
    });

    return res.status(200).json(formattedData || []);
  } catch (error) {
    console.error("getStudentsByStatus error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getAvailableClasses = async (req, res) => {
  const { program_id, grade_level } = req.query;
  const targetGradeLevel = grade_level || '';

  try {
    let sql = `
      SELECT 
        ca.id as class_assignment_id, 
        ca.schedule, 
        r.room_name as room,
        s.subject_code, 
        s.subject_description, 
        s.units, 
        u.first_name, 
        u.last_name, 
        sec.section_name,
        sec.grade_level
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.is_active = 1
    `;
    const params = [];

    // Filter by grade levels (College vs SHS vs K-10)
    if (targetGradeLevel.toLowerCase().includes('college') || targetGradeLevel.toLowerCase().includes('year')) {
      sql += " AND s.level_category = 'College'";
      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND (s.program_id = ? OR s.program_id IS NULL)";
        params.push(parseInt(program_id, 10));
      }
    } else if (['Grade 11', 'Grade 12'].includes(targetGradeLevel)) {
      sql += " AND s.level_category = 'SHS'";
      if (program_id && program_id !== 'null' && program_id !== 'undefined' && program_id !== '') {
        sql += " AND (s.program_id = ? OR s.program_id IS NULL)";
        params.push(parseInt(program_id, 10));
      }
    } else {
      sql += " AND s.level_category = 'K-10'";
    }

    sql += " ORDER BY sec.grade_level ASC, s.subject_code ASC";

    const [classes] = await pool.query(sql, params);
    return res.status(200).json({ success: true, classes: classes || [] });
  } catch (error) {
    console.error("getAvailableClasses error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const processEnrollment = async (req, res) => {
  const { student_id, school_year = '2026-2027', student_status = 'Regular', section_id, selected_fees = [], selected_classes = [] } = req.body;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update enrollment record status to 'Assessed'
    let updateSql = "UPDATE enrollments SET status = 'Assessed'";
    const updateParams = [];

    if (section_id) {
      updateSql += ", section_id = ?";
      updateParams.push(parseInt(section_id, 10));
    }

    updateSql += " WHERE student_id = ? AND status IN ('Pending', 'Assessed')";
    updateParams.push(student_id);

    await connection.query(updateSql, updateParams);

    // 2. Process fees & create billing if selected_fees provided
    if (Array.isArray(selected_fees) && selected_fees.length > 0) {
      const placeholders = selected_fees.map(() => '?').join(',');
      const [feeRows] = await connection.query(
        `SELECT id, item_name, amount FROM fees_catalog WHERE id IN (${placeholders})`,
        selected_fees.map(id => parseInt(id, 10))
      );

      if (feeRows.length > 0) {
        const totalAmount = feeRows.reduce((sum, f) => sum + parseFloat(f.amount), 0);

        const [existingBill] = await connection.query(
          "SELECT id FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1",
          [student_id]
        );

        let billingId;
        if (existingBill.length > 0) {
          billingId = existingBill[0].id;
          await connection.query(
            "UPDATE student_billing SET total_amount = ?, balance = ?, payment_status = 'Unpaid' WHERE id = ?",
            [totalAmount, totalAmount, billingId]
          );
          await connection.query("DELETE FROM student_billing_items WHERE billing_id = ?", [billingId]);
        } else {
          const [maxBillId] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM student_billing FOR UPDATE");
          billingId = maxBillId[0].maxId + 1;
          await connection.query(
            "INSERT INTO student_billing (id, student_id, total_amount, balance, payment_status) VALUES (?, ?, ?, ?, 'Unpaid')",
            [billingId, student_id, totalAmount, totalAmount]
          );
        }

        const [maxItemId] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM student_billing_items FOR UPDATE");
        let currentItemId = maxItemId[0].maxId;

        const itemValues = feeRows.map(fee => {
          currentItemId++;
          return [currentItemId, billingId, fee.id, fee.item_name, parseFloat(fee.amount), 0];
        });

        await connection.query(
          "INSERT INTO student_billing_items (id, billing_id, fee_id, item_name, amount, paid_amount) VALUES ?",
          [itemValues]
        );
      }
    }

    // 3. Process custom classes if irregular
    if (Array.isArray(selected_classes) && selected_classes.length > 0) {
      const [enrollmentRow] = await connection.query(
        "SELECT id FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1",
        [student_id]
      );
      const enrollmentId = enrollmentRow[0]?.id;

      if (enrollmentId) {
        const [maxSubId] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM student_subjects FOR UPDATE");
        let currentSubId = maxSubId[0].maxId;

        const subjectValues = selected_classes.map(classId => {
          currentSubId++;
          return [currentSubId, student_id, parseInt(classId, 10), enrollmentId];
        });

        await connection.query(
          "INSERT INTO student_subjects (id, student_id, subject_id, enrollment_id) VALUES ?",
          [subjectValues]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "Successfully Assessed & Sectioned! Forwarded to Cashier."
    });

  } catch (error) {
    await connection.rollback();
    console.error("processEnrollment error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};
