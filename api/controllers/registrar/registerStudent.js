import db from '../../config/db.js';
import crypto from 'crypto';

/**
 * Registers a new student using a secure database transaction, calculating next sequential ID,
 * generating a verification token, and inserting parallel entries into enrollments and user_settings.
 */
const registerStudent = async (req, res) => {
  const {
    lrn = null,
    first_name,
    middle_name = null,
    last_name,
    suffix = null,
    gender = null,
    dob = null,
    email,
    mobile_no = null,
    school_year,
    grade_level,
    program_id = null,
    section_id = null,
    payment_plan = 'Full Payment'
  } = req.body;

  if (!email || !last_name || !first_name) {
    return res.status(400).json({ success: false, message: "Missing required fields (email, first_name, last_name)." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Compute next sequential student_id (format: YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const idPrefix = `${currentYear}-`;

    const [lastStudentRows] = await connection.query(
      "SELECT student_id FROM students WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [`${idPrefix}%`]
    );

    let newNum = "0001";
    if (lastStudentRows.length > 0) {
      const lastStudentId = lastStudentRows[0].student_id;
      const lastNum = parseInt(lastStudentId.substring(idPrefix.length), 10);
      newNum = String(lastNum + 1).padStart(4, '0');
    }
    const student_id = `${idPrefix}${newNum}`;

    // 2. Generate enrollment verification tracking token identifier (prefixed with ENR-26- + 4 random alphanumeric chars)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 4; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const enrollment_id = `ENR-26-${randomStr}`;
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Get next primary key id values manually (due to lack of AUTO_INCREMENT in TiDB schema)
    const [maxStudentIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM students FOR UPDATE");
    const studentTableId = maxStudentIdRows[0].maxId + 1;

    const [maxEnrollmentIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM enrollments FOR UPDATE");
    const enrollmentTableId = maxEnrollmentIdRows[0].maxId + 1;

    const [maxUserSettingsIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM user_settings FOR UPDATE");
    const userSettingsTableId = maxUserSettingsIdRows[0].maxId + 1;

    // 4. Insert into students table (role='student', is_verified=1 by default)
    const studentSql = `
      INSERT INTO students (
        id, student_id, lrn, first_name, middle_name, last_name, suffix, 
        gender, dob, email, mobile_no, verification_token, role, is_verified, profile_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', 1, 'default.png')
    `;

    await connection.query(studentSql, [
      studentTableId,
      student_id,
      lrn || null,
      first_name,
      middle_name || null,
      last_name,
      suffix || null,
      gender || null,
      dob || null,
      email,
      mobile_no || null,
      token
    ]);

    // 5. Insert into enrollments table (status='Pending')
    const enrollSql = `
      INSERT INTO enrollments (
        id, enrollment_id, student_id, school_year, enrollment_type, grade_level, program_id, section_id, payment_plan, status
      ) VALUES (?, ?, ?, ?, 'New', ?, ?, ?, ?, 'Pending')
    `;

    await connection.query(enrollSql, [
      enrollmentTableId,
      enrollment_id,
      student_id,
      school_year,
      grade_level,
      program_id ? parseInt(program_id, 10) : null,
      section_id ? parseInt(section_id, 10) : null,
      payment_plan
    ]);

    // 6. Insert default user settings to avoid null settings reference errors
    const settingsSql = `
      INSERT INTO user_settings (
        id, user_id, user_role, dark_mode, theme_color, email_notifications
      ) VALUES (?, ?, 'student', 0, '#2563eb', 1)
    `;

    await connection.query(settingsSql, [
      userSettingsTableId,
      student_id
    ]);

    await connection.commit();

    // Build the full name
    const full_name = `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}${suffix ? ' ' + suffix : ''}`.trim();

    return res.status(201).json({
      success: true,
      student_id: student_id,
      enrollment_id: enrollment_id,
      full_name: full_name
    });

  } catch (error) {
    await connection.rollback();
    console.error("Register student transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Database transaction error: " + error.message
    });
  } finally {
    connection.release();
  }
};

export default registerStudent;
