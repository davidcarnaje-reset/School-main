import pool from '../../config/db.js';
import { resolveStudentId } from '../../utils/lmsSync.js';
import { ensureClassAnnouncementsTable } from '../teacher/announcementsController.js';

export const ensureClassroomModulesTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS classroom_modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      teacher_id INT DEFAULT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      module_type VARCHAR(50) DEFAULT 'lecture',
      file_url TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const alters = [
    "ALTER TABLE classroom_modules ADD COLUMN teacher_id INT DEFAULT NULL",
    "ALTER TABLE classroom_modules ADD COLUMN description TEXT DEFAULT NULL",
    "ALTER TABLE classroom_modules ADD COLUMN module_type VARCHAR(50) DEFAULT 'lecture'",
    "ALTER TABLE classroom_modules ADD COLUMN file_url TEXT DEFAULT NULL"
  ];
  for (const sql of alters) {
    try { await pool.query(sql); } catch (_) {}
  }
};

const getClassroomFeed = async (req, res) => {
  const { student_id: rawStudentId, class_id } = req.query;

  if (!rawStudentId || !class_id) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    await ensureClassAnnouncementsTable();
    await ensureClassroomModulesTable();
    const student_id = await resolveStudentId(rawStudentId);

    // Also resolve numeric student id in case student_activity_scores uses numeric id
    const [stRows] = await pool.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [student_id, rawStudentId]
    );
    // student_id columns are VARCHAR, so always compare using strings (TiDB errors on varchar = int in UPDATE)
    const stNumericId = String(stRows[0]?.id || student_id);

    // Update last_accessed for student
    await pool.query(
      "UPDATE enrolled_classes SET last_accessed = NOW() WHERE (student_id = ? OR student_id = ?) AND class_assignment_id = ?",
      [student_id, stNumericId, class_id]
    );

    // Fetch official subject, teacher, section, room, and schedule info
    const infoQuery = `
      SELECT 
          ca.section_id,
          s.subject_code as tag, 
          s.subject_description as title, 
          COALESCE(
            NULLIF(TRIM(u.full_name), ''),
            NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
            'To Be Assigned'
          ) as teacher,
          u.email as teacher_email,
          u.profile_image as teacher_image,
          sec.section_name,
          ca.schedule,
          ca.days,
          TIME_FORMAT(ca.start_time, '%h:%i %p') as start_time,
          TIME_FORMAT(ca.end_time, '%h:%i %p') as end_time,
          r.room_name as room
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.id = ?
    `;
    const [infoRows] = await pool.query(infoQuery, [class_id]);
    const courseInfo = infoRows[0] || null;

    // 1. FETCH MAIN FEED (Announcements + Activities + Modules using UNION)
    const feedQuery = `
      SELECT 
          CONCAT('ann_', ca.id) as id,
          'announcement' as type,
          'announcement' as category,
          ca.title,
          ca.message as desc_text,
          DATE_FORMAT(ca.created_at, '%M %d, %Y') as date,
          DATE_FORMAT(ca.created_at, '%h:%i %p') as time,
          ca.created_at as sort_date,
          NULL as total,
          NULL as score,
          ca.type as submission_status,
          NULL as attempts,
          NULL as max_attempts,
          ca.attachment_url as attachment_url,
          NULL as due_date,
          NULL as due_date_formatted,
          NULL as open_date,
          NULL as open_date_formatted,
          0 as is_closed,
          0 as is_not_open_yet,
          0 as question_count,
          NULL as submission_type,
          NULL as submission_content,
          NULL as submission_url,
          NULL as file_url,
          NULL as submitted_at
      FROM class_announcements ca
      WHERE ca.class_id = ?

      UNION ALL

      SELECT 
          CONCAT('act_', a.id) as id,
          CASE 
              WHEN a.category IN ('exam', 'prelim', 'midterm', 'finals', 'quarterly', 'periodical') THEN 'exam'
              ELSE 'activity'
          END as type,
          COALESCE(a.category, 'written') as category,
          a.title,
          a.description as desc_text,
          DATE_FORMAT(a.created_at, '%M %d, %Y') as date,
          DATE_FORMAT(a.created_at, '%h:%i %p') as time,
          a.created_at as sort_date,
          a.max_score as total,
          sas.score,
          COALESCE(
            NULLIF(sas.status, 'Pending'),
            CASE WHEN sub.id IS NOT NULL THEN 'Submitted' ELSE 'Pending' END
          ) as submission_status,
          COALESCE(sas.attempts, CASE WHEN sub.id IS NOT NULL THEN 1 ELSE 0 END) as attempts,
          COALESCE(a.max_attempts, 1) as max_attempts,
          NULL as attachment_url,
          a.due_date as due_date,
          DATE_FORMAT(a.due_date, '%M %d, %Y • %h:%i %p') as due_date_formatted,
          a.open_date as open_date,
          DATE_FORMAT(a.open_date, '%M %d, %Y • %h:%i %p') as open_date_formatted,
          CASE WHEN a.due_date IS NOT NULL AND NOW() > a.due_date THEN 1 ELSE 0 END as is_closed,
          CASE WHEN a.open_date IS NOT NULL AND NOW() < a.open_date THEN 1 ELSE 0 END as is_not_open_yet,
          (SELECT COUNT(*) FROM exam_questions eq WHERE eq.activity_id = a.id) as question_count,
          sub.submission_type,
          sub.submission_content,
          sub.submission_url,
          sub.file_url,
          sub.submitted_at
      FROM activities a
      LEFT JOIN student_activity_scores sas 
        ON a.id = sas.activity_id AND (sas.student_id = ? OR sas.student_id = ?)
      LEFT JOIN student_submissions sub 
        ON a.id = sub.activity_id AND (sub.student_id = ? OR sub.student_id = ?)
      WHERE a.class_id = ?

      UNION ALL

      SELECT 
          CONCAT('mod_', m.id) as id,
          COALESCE(NULLIF(m.module_type, ''), 'lecture') as type,
          'module' as category,
          m.title,
          COALESCE(NULLIF(m.description, ''), 'Uploaded Document / Learning Module') as desc_text,
          DATE_FORMAT(m.created_at, '%M %d, %Y') as date,
          DATE_FORMAT(m.created_at, '%h:%i %p') as time,
          m.created_at as sort_date,
          NULL as total,
          NULL as score,
          NULL as submission_status,
          NULL as attempts,
          NULL as max_attempts,
          m.file_url as attachment_url,
          NULL as due_date,
          NULL as due_date_formatted,
          NULL as open_date,
          NULL as open_date_formatted,
          0 as is_closed,
          0 as is_not_open_yet,
          0 as question_count,
          NULL as submission_type,
          NULL as submission_content,
          NULL as submission_url,
          NULL as file_url,
          NULL as submitted_at
      FROM classroom_modules m
      WHERE m.class_id = ?

      ORDER BY sort_date DESC
    `;

    let feedRows = [];
    try {
      [feedRows] = await pool.query(feedQuery, [class_id, student_id, stNumericId, student_id, stNumericId, class_id, class_id]);
    } catch (unionErr) {
      console.warn("Feed UNION failed, using per-source fallback:", unionErr.message);
      try {
        const [annRows] = await pool.query(
          `SELECT CONCAT('ann_', ca.id) as id, 'announcement' as type, 'announcement' as category, ca.title, ca.message as desc_text,
                  DATE_FORMAT(ca.created_at, '%M %d, %Y') as date, DATE_FORMAT(ca.created_at, '%h:%i %p') as time,
                  ca.created_at as sort_date, NULL as total, NULL as score, ca.type as submission_status,
                  NULL as attempts, NULL as max_attempts, ca.attachment_url as attachment_url,
                  0 as question_count, NULL as submission_type, NULL as submission_content, NULL as submission_url, NULL as submitted_at
           FROM class_announcements ca WHERE ca.class_id = ?`, [class_id]);
        feedRows.push(...annRows);
      } catch (e) { console.error("Feed announcements error:", e.message); }
      try {
        const [actRows] = await pool.query(
          `SELECT a.id as raw_id, COALESCE(a.category, 'written') as category, a.title, a.description as desc_text,
                  DATE_FORMAT(a.created_at, '%M %d, %Y') as date, DATE_FORMAT(a.created_at, '%h:%i %p') as time,
                  a.created_at as sort_date, a.max_score as total, a.max_attempts,
                  a.due_date, DATE_FORMAT(a.due_date, '%M %d, %Y • %h:%i %p') as due_date_formatted,
                  a.open_date, DATE_FORMAT(a.open_date, '%M %d, %Y • %h:%i %p') as open_date_formatted,
                  CASE WHEN a.due_date IS NOT NULL AND NOW() > a.due_date THEN 1 ELSE 0 END as is_closed,
                  CASE WHEN a.open_date IS NOT NULL AND NOW() < a.open_date THEN 1 ELSE 0 END as is_not_open_yet,
                  (SELECT COUNT(*) FROM exam_questions eq WHERE eq.activity_id = a.id) as question_count
           FROM activities a WHERE a.class_id = ?`, [class_id]);
        for (const a of actRows) {
          let sas = null;
          let sub = null;
          try {
            const [s] = await pool.query(
              "SELECT score, status, attempts FROM student_activity_scores WHERE activity_id = ? AND (student_id = ? OR student_id = ?) LIMIT 1",
              [a.raw_id, String(student_id), String(stNumericId)]);
            sas = s[0] || null;
          } catch (e) {}
          try {
            const [sb] = await pool.query(
              "SELECT submission_type, submission_content, submission_url, file_url, submitted_at FROM student_submissions WHERE activity_id = ? AND (student_id = ? OR student_id = ?) LIMIT 1",
              [a.raw_id, String(student_id), String(stNumericId)]);
            sub = sb[0] || null;
          } catch (e) {}

          const subStatus = sas?.status && sas.status !== 'Pending'
            ? sas.status
            : (sub ? 'Submitted' : (sas?.status || 'Pending'));

          feedRows.push({
            id: `act_${a.raw_id}`,
            type: ['exam', 'prelim', 'midterm', 'finals', 'quarterly', 'periodical'].includes(a.category) ? 'exam' : 'activity',
            category: a.category,
            title: a.title, desc_text: a.desc_text, date: a.date, time: a.time, sort_date: a.sort_date,
            total: a.total, score: sas ? sas.score : null, submission_status: subStatus,
            attempts: sas ? (sas.attempts || (sub ? 1 : 0)) : (sub ? 1 : 0), max_attempts: a.max_attempts || 1, attachment_url: null,
            due_date: a.due_date, due_date_formatted: a.due_date_formatted,
            open_date: a.open_date, open_date_formatted: a.open_date_formatted,
            is_closed: a.is_closed, is_not_open_yet: a.is_not_open_yet,
            question_count: a.question_count || 0,
            submission_type: sub?.submission_type || null,
            submission_content: sub?.submission_content || null,
            submission_url: sub?.submission_url || null,
            file_url: sub?.file_url || null,
            submitted_at: sub?.submitted_at || null
          });
        }
      } catch (e) { console.error("Feed activities error:", e.message); }
      try {
        const [modRows] = await pool.query(
          `SELECT CONCAT('mod_', m.id) as id, COALESCE(NULLIF(m.module_type, ''), 'lecture') as type, 'module' as category, m.title,
                  COALESCE(NULLIF(m.description, ''), 'Uploaded Document / Learning Module') as desc_text,
                  DATE_FORMAT(m.created_at, '%M %d, %Y') as date, DATE_FORMAT(m.created_at, '%h:%i %p') as time,
                  m.created_at as sort_date, NULL as total, NULL as score, NULL as submission_status,
                  NULL as attempts, NULL as max_attempts, m.file_url as attachment_url,
                  0 as question_count, NULL as submission_type, NULL as submission_content, NULL as submission_url, NULL as submitted_at
           FROM classroom_modules m WHERE m.class_id = ?`, [class_id]);
        feedRows.push(...modRows);
      } catch (e) { console.error("Feed modules error:", e.message); }
      feedRows.sort((x, y) => new Date(y.sort_date) - new Date(x.sort_date));
    }

    const feed = feedRows.map(item => ({
      id: item.id,
      type: item.type,
      category: item.category || 'written',
      has_questions: Number(item.question_count || 0) > 0,
      question_count: Number(item.question_count || 0),
      title: item.title,
      desc: item.desc_text,
      date: item.date,
      time: item.time,
      score: item.score,
      total: item.total !== null && item.total !== undefined ? parseInt(item.total, 10) : null,
      status: item.submission_status,
      attempts: item.attempts !== null && item.attempts !== undefined ? parseInt(item.attempts, 10) : null,
      max_attempts: item.max_attempts !== null && item.max_attempts !== undefined ? parseInt(item.max_attempts, 10) : null,
      attachment_url: item.attachment_url || null,
      due_date: item.due_date || null,
      due_date_formatted: item.due_date_formatted || null,
      open_date: item.open_date || null,
      open_date_formatted: item.open_date_formatted || null,
      is_closed: Number(item.is_closed) === 1,
      is_not_open_yet: Number(item.is_not_open_yet) === 1,
      submission: (item.submission_content || item.submission_url || item.file_url) ? {
        content: item.submission_content,
        url: item.submission_url,
        file_url: item.file_url,
        type: item.submission_type,
        submitted_at: item.submitted_at
      } : null
    }));

    // 2. FETCH DUE SOON
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

    // 3. FETCH RECENT GRADES
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
        AND (sas.student_id = ? OR sas.student_id = ?)
        AND sas.status = 'Graded'
      ORDER BY sas.date_graded DESC 
      LIMIT 5
    `;
    const [gradesRows] = await pool.query(gradesQuery, [class_id, student_id, stNumericId]);

    // 4. GET QUARTER STANDING
    const standingQuery = `
      SELECT final_grade, descriptive_grade, remarks 
      FROM student_grades 
      WHERE class_id = ? AND (student_id = ? OR student_id = ?) 
      ORDER BY last_updated DESC LIMIT 1
    `;
    const [standingRows] = await pool.query(standingQuery, [class_id, student_id, stNumericId]);
    const gradeRecord = standingRows[0];

    const standing = {
      status: gradeRecord && gradeRecord.remarks
        ? (gradeRecord.descriptive_grade ? `${gradeRecord.descriptive_grade} • ${gradeRecord.remarks}` : gradeRecord.remarks)
        : "Evaluating",
      grade: gradeRecord && Number(gradeRecord.final_grade) > 0 ? parseFloat(gradeRecord.final_grade) : 0
    };

    // 5. FETCH CLASSMATES / PEOPLE IN THIS CLASS
    const classmatesQuery = `
      SELECT DISTINCT
        s.student_id,
        s.first_name,
        s.last_name,
        CONCAT_WS(' ', s.first_name, s.last_name) AS full_name,
        s.profile_image,
        s.gender
      FROM students s
      LEFT JOIN enrolled_classes ec ON (ec.student_id = s.student_id OR ec.student_id = s.id)
      LEFT JOIN enrollments e ON (e.student_id = s.student_id OR e.student_id = s.id)
      WHERE (ec.class_assignment_id = ? AND ec.status = 'Enrolled')
         OR (? IS NOT NULL AND e.section_id = ? AND e.status = 'Enrolled')
      ORDER BY s.last_name ASC, s.first_name ASC
    `;
    const sectionIdParam = courseInfo?.section_id || null;
    const [classmatesRows] = await pool.query(classmatesQuery, [class_id, sectionIdParam, sectionIdParam]);

    return res.json({
      status: "success",
      course_info: courseInfo,
      feed: feed,
      due_soon: dueSoonRows,
      recent_grades: gradesRows,
      standing: standing,
      classmates: classmatesRows || []
    });

  } catch (error) {
    console.error("Classroom Feed Error:", error);
    return res.status(500).json({ status: "error", message: "Database error: " + error.message });
  }
};

export default getClassroomFeed;
