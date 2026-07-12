import pool from '../../config/db.js';

export const trackActivity = async (req, res) => {
  const { student_id: studentId, type } = req.body;

  if (!studentId || !type) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters' });
  }

  // Get date in YYYY-MM-DD format based on local time
  const today = new Date().toLocaleDateString('en-CA'); 

  try {
    // Check if student exists
    const [students] = await pool.query(
      "SELECT lms_login_count, lms_total_minutes, DATE_FORMAT(last_active_date, '%Y-%m-%d') as last_active_date FROM students WHERE student_id = ?",
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    const student = students[0];

    if (type === 'login') {
      if (student.last_active_date !== today) {
        await pool.query(
          "UPDATE students SET lms_login_count = lms_login_count + 1, last_active_date = ? WHERE student_id = ?",
          [today, studentId]
        );
      }
      return res.json({ status: 'success', message: 'Login recorded' });

    } else if (type === 'ping') {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // A. Update overall lms minutes
        await connection.query(
          "UPDATE students SET lms_total_minutes = lms_total_minutes + 1 WHERE student_id = ?",
          [studentId]
        );

        // B. Update daily usage
        await connection.query(
          `INSERT INTO lms_daily_usage (student_id, usage_date, minutes_spent) 
           VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE minutes_spent = minutes_spent + 1`,
          [studentId, today]
        );

        await connection.commit();
        return res.json({ status: 'success', message: '1 minute added to overall and daily tracking' });

      } catch (transError) {
        await connection.rollback();
        throw transError;
      } finally {
        connection.release();
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid tracking type' });
    }

  } catch (error) {
    console.error("Track activity error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
  }
};

export default trackActivity;
