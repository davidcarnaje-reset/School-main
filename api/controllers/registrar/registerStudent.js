import pool from '../../config/db.js';
import crypto from 'crypto';

/**
 * Migrated from add_student.php / process_enrollment.php
 * Registers a new student and initializes their enrollment records in a transaction.
 */
const registerStudent = async (req, res) => {
  const {
    email,
    last_name,
    first_name,
    middle_name = '',
    lrn = '',
    suffix = '',
    nickname = '',
    gender = null,
    dob = null,
    place_of_birth = '',
    nationality = 'Filipino',
    religion = '',
    civil_status = 'Single',
    mobile_no = null,
    alt_mobile_no = '',
    address_house = '',
    address_brgy = '',
    address_city = '',
    address_province = '',
    address_zip = '',
    father_name = '',
    father_occ = '',
    father_contact = '',
    mother_name = '',
    mother_occ = '',
    mother_contact = '',
    guardian_name = '',
    guardian_rel = '',
    guardian_contact = '',
    guardian_address = '',
    school_year,
    enrollment_type,
    grade_level,
    program_id = null,
    payment_plan = 'Full Payment'
  } = req.body;

  if (!email || !last_name || !first_name) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Generate unique student_id (format: YYYY-NNNN)
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

    // 2. Generate Enrollment ID & Token
    const yy = String(currentYear).slice(-2);
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const enroll_id = `ENR-${yy}-${randomHex}`;
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Get next primary key id values manually (due to lack of AUTO_INCREMENT on this TiDB schema)
    const [maxStudentIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM students FOR UPDATE");
    const studentTableId = maxStudentIdRows[0].maxId + 1;

    const [maxEnrollmentIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM enrollments FOR UPDATE");
    const enrollmentTableId = maxEnrollmentIdRows[0].maxId + 1;

    const [maxUserSettingsIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM user_settings FOR UPDATE");
    const userSettingsTableId = maxUserSettingsIdRows[0].maxId + 1;

    // 4. Insert into students table
    const studentSql = `
      INSERT INTO students (
        id, student_id, lrn, first_name, middle_name, last_name, suffix, nickname, 
        gender, dob, place_of_birth, nationality, religion, civil_status, email, mobile_no, 
        alt_mobile_no, address_house, address_brgy, address_city, address_province, address_zip,
        father_name, father_occ, father_contact, mother_name, mother_occ, mother_contact,
        guardian_name, guardian_rel, guardian_contact, guardian_address, verification_token, profile_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'default.png')
    `;

    await connection.query(studentSql, [
      studentTableId,
      student_id,
      lrn || null,
      first_name,
      middle_name || null,
      last_name,
      suffix || null,
      nickname || null,
      gender || null,
      dob || null,
      place_of_birth || null,
      nationality || 'Filipino',
      religion || null,
      civil_status || 'Single',
      email,
      mobile_no || null,
      alt_mobile_no || null,
      address_house || null,
      address_brgy || null,
      address_city || null,
      address_province || null,
      address_zip || null,
      father_name || null,
      father_occ || null,
      father_contact || null,
      mother_name || null,
      mother_occ || null,
      mother_contact || null,
      guardian_name || null,
      guardian_rel || null,
      guardian_contact || null,
      guardian_address || null,
      token
    ]);

    // 5. Insert into enrollments table
    const enrollSql = `
      INSERT INTO enrollments (
        id, enrollment_id, student_id, school_year, enrollment_type, grade_level, program_id, payment_plan, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;

    await connection.query(enrollSql, [
      enrollmentTableId,
      enroll_id,
      student_id,
      school_year,
      enrollment_type,
      grade_level,
      program_id ? parseInt(program_id, 10) : null,
      payment_plan
    ]);

    // 6. Insert default user settings
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

    return res.json({
      success: true,
      student_id: student_id
    });

  } catch (error) {
    await connection.rollback();
    console.error("Register student error:", error);
    return res.status(500).json({
      success: false,
      message: "Process Error: " + error.message
    });
  } finally {
    connection.release();
  }
};

export default registerStudent;
