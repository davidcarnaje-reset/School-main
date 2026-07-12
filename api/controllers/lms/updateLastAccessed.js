import pool from '../../config/db.js';

export const updateLastAccessed = async (req, res) => {
  const studentId = req.body.student_id;
  const classId = req.body.class_id;

  if (!studentId || !classId) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters' });
  }

  try {
    const query = `
      UPDATE enrolled_classes 
      SET last_accessed = NOW() 
      WHERE student_id = ? AND class_assignment_id = ?
    `;

    await pool.query(query, [studentId, classId]);

    return res.json({ status: 'success' });

  } catch (error) {
    console.error("Update last accessed error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default updateLastAccessed;
