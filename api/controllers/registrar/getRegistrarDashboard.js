import pool from '../../config/db.js';

const getRegistrarDashboard = async (req, res) => {
  try {
    // Run all stat queries in parallel for performance
    const [
      [totalStudentsRows],
      [totalEnrolledRows],
      [pendingRegRows],
      [awaitingPayRows],
      [pendingReqRows],
      [totalRevenueRows],
      [gradeStatsRows],
      [recentRows]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS count FROM students"),
      pool.query("SELECT COUNT(*) AS count FROM enrollments WHERE status = 'Enrolled'"),
      pool.query("SELECT COUNT(*) AS count FROM enrollments WHERE status = 'Pending'"),
      pool.query("SELECT COUNT(*) AS count FROM enrollments WHERE status = 'Assessed'"),
      pool.query("SELECT COUNT(*) AS count FROM service_requests WHERE status != 'Released'"),
      pool.query("SELECT COALESCE(SUM(paid_amount), 0) AS total FROM student_billing"),
      pool.query("SELECT grade_level, COUNT(*) AS count FROM enrollments GROUP BY grade_level"),
      pool.query(`
        SELECT s.first_name, s.last_name, e.status, e.created_at
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        ORDER BY e.id DESC LIMIT 5
      `)
    ]);

    const recentActivities = recentRows.map(row => ({
      first_name: row.first_name,
      last_name: row.last_name,
      status: row.status,
      date_added: row.created_at
    }));

    return res.status(200).json({
      success: true,
      stats: {
        total_students:   parseInt(totalStudentsRows[0].count, 10),
        total_enrolled:   parseInt(totalEnrolledRows[0].count, 10),
        pending_registrar: parseInt(pendingRegRows[0].count, 10),
        awaiting_payment: parseInt(awaitingPayRows[0].count, 10),
        pending_requests: parseInt(pendingReqRows[0].count, 10),
        total_revenue:    parseFloat(totalRevenueRows[0].total)
      },
      grade_distribution: gradeStatsRows,
      recent_activities: recentActivities
    });

  } catch (error) {
    console.error('getRegistrarDashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
};

export default getRegistrarDashboard;
