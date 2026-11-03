import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';
import { ensureClassAnnouncementsTable } from '../teacher/announcementsController.js';

const getStudentAnnouncements = async (req, res) => {
  const { student_id: rawStudentId } = req.query;

  if (!rawStudentId) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    await ensureClassAnnouncementsTable();
    const canonicalStudentId = await resolveStudentId(rawStudentId);
    try {
      await syncStudentEnrolledClasses(canonicalStudentId);
    } catch (_) {}

    // Find student's numeric id, string student_id, and enrolled class_ids / section_id
    const [studentRows] = await pool.query(
      "SELECT id, student_id FROM students WHERE student_id = ? OR id = ? LIMIT 1",
      [canonicalStudentId, rawStudentId]
    );
    const studentObj = studentRows[0] || { id: rawStudentId, student_id: canonicalStudentId };
    const idCandidates = Array.from(new Set([
      String(rawStudentId),
      String(canonicalStudentId),
      String(studentObj.id || ''),
      String(studentObj.student_id || '')
    ].filter(Boolean)));

    // 1. Fetch Class Announcements for classes the student is enrolled in (via enrolled_classes or section enrollments)
    const [classIdsRows] = await pool.query(
      `SELECT DISTINCT ca.id as class_id
       FROM class_assignments ca
       LEFT JOIN enrolled_classes ec ON ec.class_assignment_id = ca.id
       LEFT JOIN enrollments e ON e.section_id = ca.section_id AND e.status = 'Enrolled'
       WHERE ec.student_id IN (?) OR e.student_id IN (?)`,
      [idCandidates, idCandidates]
    );
    const classIds = classIdsRows.map(r => r.class_id);

    let classAnnouncements = [];
    if (classIds.length > 0) {
      const [caRows] = await pool.query(
        `SELECT 
           ca.id,
           ca.class_id,
           ca.title,
           ca.message,
           ca.type,
           ca.created_at,
           DATE_FORMAT(ca.created_at, '%M %d, %Y') as date_posted,
           s.subject_code,
           s.subject_description,
           COALESCE(
             NULLIF(TRIM(u.full_name), ''),
             NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
             'Teacher'
           ) as sender_name
         FROM class_announcements ca
         LEFT JOIN class_assignments c_assign ON ca.class_id = c_assign.id
         LEFT JOIN subjects s ON c_assign.subject_id = s.id
         LEFT JOIN users u ON ca.teacher_id = u.id
         WHERE ca.class_id IN (?)
         ORDER BY ca.created_at DESC
         LIMIT 15`,
        [classIds]
      );
      classAnnouncements = caRows.map(r => {
        const subjectLabel = r.subject_description || r.subject_code || '';
        const formattedTitle = subjectLabel && !String(r.title).includes(subjectLabel)
          ? `[${subjectLabel}] ${r.title}`
          : r.title;
        return {
          id: `ca_${r.id}`,
          class_id: r.class_id,
          title: formattedTitle,
          message: r.message,
          type: r.type || 'Announcement',
          subject: subjectLabel,
          sender_name: r.sender_name,
          date_posted: r.date_posted,
          created_at: r.created_at
        };
      });
    }

    // 2. Fetch General & Direct Student Notifications
    const [notifRows] = await pool.query(
      `SELECT DISTINCT
          n.id,
          n.title, 
          n.message, 
          n.type, 
          n.created_at,
          DATE_FORMAT(n.created_at, '%M %d, %Y') as date_posted,
          COALESCE(
            NULLIF(TRIM(u.full_name), ''),
            NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
            'School Admin'
          ) as sender_name
       FROM notifications n
       INNER JOIN notification_recipients nr ON n.id = nr.notification_id
       LEFT JOIN users u ON n.sender_id = u.id
       WHERE (nr.recipient_id IN (?) AND nr.recipient_role = 'student')
          OR (LOWER(nr.recipient_id) = 'all' AND (nr.recipient_role = 'student' OR nr.recipient_role = 'all'))
       ORDER BY n.created_at DESC 
       LIMIT 15`,
      [idCandidates]
    );

    // Combine & deduplicate by (title + message) so class announcements mirrored into notifications don't appear twice
    const combined = [];
    const seenKeys = new Set();

    for (const item of classAnnouncements) {
      const key = `${String(item.title).trim().toLowerCase()}|${String(item.message).trim().toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        combined.push(item);
      }
    }

    for (const n of notifRows) {
      const key = `${String(n.title).trim().toLowerCase()}|${String(n.message).trim().toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        combined.push({
          id: `notif_${n.id}`,
          class_id: null,
          title: n.title,
          message: n.message,
          type: n.type || 'Announcement',
          subject: null,
          sender_name: n.sender_name,
          date_posted: n.date_posted,
          created_at: n.created_at
        });
      }
    }

    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      data: combined.slice(0, 15)
    });

  } catch (error) {
    console.error("Get student announcements error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default getStudentAnnouncements;
