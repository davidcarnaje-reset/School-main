import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

/**
 * Encodes subjects for a student's enrollment record by bulk inserting them into the student_subjects table.
 */
const encodeSubjects = async (req, res) => {
  const { student_id, enrollment_id, subject_ids } = req.body;

  if (!student_id || !enrollment_id || !Array.isArray(subject_ids) || subject_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields or subject_ids is not a non-empty array."
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the starting id for the student_subjects table (manually incremented due to no AUTO_INCREMENT)
    const [maxIdRows] = await connection.query(
      "SELECT COALESCE(MAX(id), 0) AS maxId FROM student_subjects FOR UPDATE"
    );
    let currentId = maxIdRows[0].maxId;

    // 2. Prepare the values for bulk insert
    const insertValues = subject_ids.map((subId) => {
      currentId++;
      return [currentId, student_id, parseInt(subId, 10), enrollment_id];
    });

    // 3. Execute bulk insert query
    const sql = "INSERT INTO student_subjects (id, student_id, subject_id, enrollment_id) VALUES ?";
    await connection.query(sql, [insertValues]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "ENCODE_SUBJECTS",
      `Encoded ${subject_ids.length} subjects for Student ID: ${student_id}, Enrollment ID: ${enrollment_id}`,
      req
    );

    return res.json({
      success: true,
      message: "Subjects encoded successfully."
    });

  } catch (error) {
    await connection.rollback();
    console.error("Encode subjects error:", error);
    return res.status(500).json({
      success: false,
      message: "Database Error: " + error.message
    });
  } finally {
    connection.release();
  }
};

export default encodeSubjects;
