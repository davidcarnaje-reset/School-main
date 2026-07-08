import pool from '../../config/db.js';
import { uploadToR2 } from '../../utils/storageEngine.js';

const submitScholarshipApplication = async (req, res) => {
  const { email, scholarship_id } = req.body;

  if (!email || !scholarship_id) {
    return res.status(400).json({ status: "error", message: "Missing required fields (email, scholarship_id)." });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ status: "error", message: "No files uploaded." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch student_id and current school_year
    const [studentRows] = await connection.query(`
      SELECT s.student_id, e.school_year 
      FROM students s 
      LEFT JOIN enrollments e ON s.student_id = e.student_id 
      WHERE s.email = ? 
      ORDER BY e.id DESC LIMIT 1
    `, [email]);

    if (studentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: "error", message: "Student not found." });
    }

    const { student_id, school_year } = studentRows[0];
    const current_sy = school_year || '2026-2027';

    // 2. Anti-spam: Check for existing pending or approved application
    const [checkRows] = await connection.query(
      "SELECT id FROM scholarship_applications WHERE student_id = ? AND scholarship_id = ? AND status IN ('Pending', 'Approved')",
      [student_id, parseInt(scholarship_id, 10)]
    );

    if (checkRows.length > 0) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "You already have an active or pending application for this scholarship." });
    }

    // 3. Upload files to Cloudflare R2
    const uploadedUrls = [];
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const extension = file.originalname.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        await connection.rollback();
        return res.status(400).json({ status: "error", message: "Invalid file type. Only PDF, JPG, and PNG are allowed." });
      }

      const fileKey = `requirements/REQ_${student_id}_${Date.now()}_${i}.${extension}`;
      const fileUrl = await uploadToR2(file.buffer, fileKey, file.mimetype);
      uploadedUrls.push(fileUrl);
    }

    // 4. Manual ID lookup for TiDB
    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM scholarship_applications FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    // 5. Insert application
    const files_string = uploadedUrls.join(',');
    const insertSql = `
      INSERT INTO scholarship_applications 
        (id, student_id, scholarship_id, sy, requirements_file, status, date_applied) 
      VALUES (?, ?, ?, ?, ?, 'Pending', NOW())
    `;
    await connection.query(insertSql, [
      nextId,
      student_id,
      parseInt(scholarship_id, 10),
      current_sy,
      files_string
    ]);

    await connection.commit();
    return res.status(201).json({
      status: "success",
      message: "Application submitted successfully! Please wait for registrar verification."
    });

  } catch (error) {
    await connection.rollback();
    console.error("submitScholarshipApplication error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export default submitScholarshipApplication;
