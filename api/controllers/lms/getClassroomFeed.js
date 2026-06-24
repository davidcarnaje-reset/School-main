import pool from '../../config/db.js';

const getClassroomFeed = async (req, res) => {
  const { student_id, class_id } = req.query;

  if (!student_id || !class_id) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    // ==========================================
    // ARCHITECT FIX 1: UPDATE LAST ACCESSED PARA PUMUNTA SA UNAHAN NG DASHBOARD
    // ==========================================
    await pool.query(
      "UPDATE enrolled_classes SET last_accessed = NOW() WHERE student_id = ? AND class_assignment_id = ?",
      [student_id, class_id]
    );

    // ==========================================
    // ARCHITECT FIX 2: KUNIN ANG SUBJECT AT TEACHER INFO PARA WALA NANG "TBA" SA FRONTEND HEADER
    // ==========================================
    const infoQuery = `
      SELECT 
          s.subject_code as tag, 
          s.subject_description as title, 
          CONCAT(u.first_name, ' ', u.last_name) as teacher
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      WHERE ca.id = ?
    `;
    const [infoRows] = await pool.query(infoQuery, [class_id]);
    const courseInfo = infoRows[0] || null;

    // ==========================================
    // 1. FETCH MAIN FEED (Activities + Modules using UNION)
    // ==========================================
    const feedQuery = `
      SELECT 
          CONCAT('act_', a.id) as id,
          CASE 
              WHEN a.category IN ('exam', 'prelim', 'midterm', 'finals') THEN 'exam'
              ELSE 'activity'
          END as type,
          a.title,
          a.description as desc_text,
          DATE_FORMAT(a.created_at, '%M %d, %Y') as date,
          DATE_FORMAT(a.created_at, '%h:%i %p') as time,
          a.created_at as sort_date,
          a.max_score as total,
          sas.score,
          sas.status as submission_status,
          COALESCE(sas.attempts, 0) as attempts,
          COALESCE(a.max_attempts, 1) as max_attempts
      FROM activities a
      LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ?
      WHERE a.class_id = ?

      UNION ALL

      SELECT 
          CONCAT('mod_', m.id) as id,
          'lecture' as type,
          m.title,
          'Uploaded Document/Module' as desc_text,
          DATE_FORMAT(m.created_at, '%M %d, %Y') as date,
          DATE_FORMAT(m.created_at, '%h:%i %p') as time,
          m.created_at as sort_date,
          NULL as total,
          NULL as score,
          NULL as submission_status,
          NULL as attempts,
          NULL as max_attempts
      FROM classroom_modules m
      WHERE m.class_id = ?

      ORDER BY sort_date DESC
    `;

    const [feedRows] = await pool.query(feedQuery, [student_id, class_id, class_id]);

    const feed = feedRows.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      desc: item.desc_text,
      date: item.date,
      time: item.time,
      score: item.score,
      total: item.total !== null && item.total !== undefined ? parseInt(item.total, 10) : null,
      status: item.submission_status,
      attempts: item.attempts !== null && item.attempts !== undefined ? parseInt(item.attempts, 10) : null,
      max_attempts: item.max_attempts !== null && item.max_attempts !== undefined ? parseInt(item.max_attempts, 10) : null
    }));

    // ==========================================
    // 2. FETCH DUE SOON (Upcoming Deadlines mula sa activities table)
    // ==========================================
    const dueQuery = `
      SELECT 
          id, 
          title, 
          DATE_FORMAT(due_date, '%M %d, %Y') as date,
          DATE_FORMAT(due_date, '%h:%i %p') as time
      FROM activities 
      WHERE class_id = ? 
        AND due_date > NOW() 
      ORDER BY due_date ASC 
      LIMIT 3
    `;
    const [dueSoonRows] = await pool.query(dueQuery, [class_id]);

    // ==========================================
    // 3. FETCH RECENT GRADES (Mula sa student_activity_scores)
    // ==========================================
    const gradesQuery = `
      SELECT 
          a.id, 
          a.title, 
          CASE 
              WHEN a.category IN ('exam', 'prelim', 'midterm', 'finals') THEN 'exam'
              ELSE 'activity'
          END as type,
          sas.score, 
          a.max_score as total, 
          DATE_FORMAT(sas.date_graded, '%M %d, %Y') as date
      FROM student_activity_scores sas
      JOIN activities a ON sas.activity_id = a.id
      WHERE a.class_id = ? 
        AND sas.student_id = ?
        AND sas.status = 'Graded'
      ORDER BY sas.date_graded DESC 
      LIMIT 5
    `;
    const [gradesRows] = await pool.query(gradesQuery, [class_id, student_id]);

    // ==========================================
    // 4. GET QUARTER STANDING (Mula sa student_grades table)
    // ==========================================
    const standingQuery = `
      SELECT final_grade, remarks 
      FROM student_grades 
      WHERE class_id = ? AND student_id = ? 
      ORDER BY last_updated DESC LIMIT 1
    `;
    const [standingRows] = await pool.query(standingQuery, [class_id, student_id]);
    const gradeRecord = standingRows[0];

    const standing = {
      status: gradeRecord && gradeRecord.remarks ? gradeRecord.remarks : "Evaluating",
      grade: gradeRecord ? parseFloat(gradeRecord.final_grade) : 0
    };

    return res.json({
      status: "success",
      course_info: courseInfo,
      feed: feed,
      due_soon: dueSoonRows,
      recent_grades: gradesRows,
      standing: standing
    });

  } catch (error) {
    console.error("Classroom Feed Error:", error);
    return res.status(500).json({ status: "error", message: "Database error" });
  }
};

export default getClassroomFeed;
