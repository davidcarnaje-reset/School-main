import pool from '../../config/db.js';

export const ensureClassAnnouncementsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      teacher_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'Announcement',
      attachment_url TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// 1. GET TEACHER/STAFF ANNOUNCEMENTS
export const getAnnouncements = async (req, res) => {
  const userId = req.query.user_id;
  const role = req.query.role || 'teacher';
  const fetchType = req.query.fetch_type || 'both';

  if (!userId) {
    return res.status(400).json({ status: "error", message: "User ID is required." });
  }

  try {
    let whereClause = "";
    const params = [userId, role, userId, role];

    if (fetchType === 'general') {
      whereClause = "(nr.recipient_role = ? OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all'";
      params.push(role);
    } else if (fetchType === 'specific') {
      whereClause = "nr.recipient_id = ? AND nr.recipient_role = ? AND LOWER(nr.recipient_id) != 'all'";
      params.push(userId, role);
    } else {
      whereClause = `(nr.recipient_id = ? AND nr.recipient_role = ? AND LOWER(nr.recipient_id) != 'all') 
                     OR ((nr.recipient_role = ? OR nr.recipient_role = 'all') AND LOWER(nr.recipient_id) = 'all')`;
      params.push(userId, role, role);
    }

    const query = `
      SELECT DISTINCT
        n.id, 
        n.title, 
        n.message, 
        n.type, 
        n.sender_role, 
        n.created_at,
        n.attachment,
        nr.recipient_id,
        u.full_name as sender_name,
        u.profile_image as sender_image,
        IF(n_read.id IS NOT NULL, 1, 0) as is_read,
        n_react.reaction
      FROM notifications n
      JOIN notification_recipients nr ON n.id = nr.notification_id
      LEFT JOIN users u ON n.sender_id = u.id
      
      LEFT JOIN notification_reads n_read 
        ON n.id = n_read.notification_id 
        AND n_read.user_id = ? 
        AND n_read.user_role = ?
          
      LEFT JOIN notification_reactions n_react 
        ON n.id = n_react.notification_id 
        AND n_react.user_id = ? 
        AND n_react.user_role = ?
          
      WHERE ${whereClause}
      ORDER BY n.created_at DESC 
      LIMIT 50
    `;

    const [announcements] = await pool.query(query, params);

    return res.json({
      status: "success",
      data: announcements || []
    });

  } catch (error) {
    console.error("Get announcements error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// 2. MARK NOTIFICATIONS AS READ
export const markNotificationsRead = async (req, res) => {
  const { user_id: userId, role } = req.body;
  const userRole = role || 'teacher';

  if (!userId) {
    return res.status(400).json({ status: "error", message: "User ID is required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Mark specific records as read
    await connection.query(
      `UPDATE notification_recipients 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE recipient_id = ? AND is_read = 0`,
      [userId]
    );

    // Mark general records (where recipient_id is 'all') as read
    await connection.query(
      `UPDATE notification_recipients 
       SET is_read = 1, read_at = CURRENT_TIMESTAMP 
       WHERE recipient_id = 'all' AND (recipient_role = ? OR recipient_role = 'all') AND is_read = 0`,
      [userRole]
    );

    await connection.commit();

    return res.json({
      status: "success",
      message: "All notifications marked as read."
    });

  } catch (error) {
    await connection.rollback();
    console.error("Mark notifications read error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

// 3. GET CLASS ANNOUNCEMENTS FOR A SPECIFIC CLASS STREAM
export const getClassAnnouncements = async (req, res) => {
  const { class_id } = req.query;
  if (!class_id) {
    return res.status(400).json({ status: "error", message: "Class ID is required." });
  }

  try {
    await ensureClassAnnouncementsTable();

    const [rows] = await pool.query(
      `SELECT 
         ca.id,
         ca.class_id,
         ca.teacher_id,
         ca.title,
         ca.message,
         ca.type,
         ca.attachment_url,
         ca.created_at,
         DATE_FORMAT(ca.created_at, '%M %d, %Y') as date_posted,
         DATE_FORMAT(ca.created_at, '%h:%i %p') as time_posted,
         COALESCE(
           NULLIF(TRIM(u.full_name), ''),
           NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''),
           'Subject Teacher'
         ) as teacher_name,
         u.profile_image as teacher_image,
         s.subject_code,
         s.subject_description,
         sec.section_name
       FROM class_announcements ca
       LEFT JOIN users u ON ca.teacher_id = u.id
       LEFT JOIN class_assignments c_assign ON ca.class_id = c_assign.id
       LEFT JOIN subjects s ON c_assign.subject_id = s.id
       LEFT JOIN sections sec ON c_assign.section_id = sec.id
       WHERE ca.class_id = ?
       ORDER BY ca.created_at DESC`,
      [class_id]
    );

    return res.json({
      status: "success",
      data: rows || []
    });
  } catch (error) {
    console.error("Get class announcements error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

// 4. CREATE CLASS ANNOUNCEMENT & NOTIFY STUDENTS
export const createClassAnnouncement = async (req, res) => {
  const { class_id, teacher_id, title, message, type = 'Announcement', attachment_url = null } = req.body;

  if (!class_id || !message || !String(message).trim()) {
    return res.status(400).json({ status: "error", message: "Class ID and announcement message are required." });
  }

  const connection = await pool.getConnection();
  try {
    await ensureClassAnnouncementsTable();
    await connection.beginTransaction();

    // Fetch class subject & section info
    const [classInfoRows] = await connection.query(
      `SELECT ca.id, ca.section_id, ca.teacher_id, s.subject_code, s.subject_description, sec.section_name
       FROM class_assignments ca
       LEFT JOIN subjects s ON ca.subject_id = s.id
       LEFT JOIN sections sec ON ca.section_id = sec.id
       WHERE ca.id = ? LIMIT 1`,
      [class_id]
    );
    const classInfo = classInfoRows[0] || {};
    const effectiveTeacherId = teacher_id || classInfo.teacher_id || 1;
    const subjectLabel = classInfo.subject_description || classInfo.subject_code || 'Class';
    const cleanTitle = (title && String(title).trim()) ? String(title).trim() : `${subjectLabel} Announcement`;
    const cleanMessage = String(message).trim();

    // 1. Insert into class_announcements
    const [insertRes] = await connection.query(
      `INSERT INTO class_announcements (class_id, teacher_id, title, message, type, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id, effectiveTeacherId, cleanTitle, cleanMessage, type, attachment_url]
    );
    const announcementId = insertRes.insertId;

    // 2. Find all students enrolled in this class (from enrolled_classes OR enrollments for the section)
    const studentIdsSet = new Set();

    const [ecStudents] = await connection.query(
      `SELECT DISTINCT s.student_id, s.id as numeric_id
       FROM enrolled_classes ec
       JOIN students s ON (ec.student_id = s.id OR ec.student_id = s.student_id)
       WHERE ec.class_assignment_id = ?`,
      [class_id]
    );
    for (const st of ecStudents) {
      if (st.student_id) studentIdsSet.add(String(st.student_id));
      if (st.numeric_id) studentIdsSet.add(String(st.numeric_id));
    }

    if (classInfo.section_id) {
      const [secStudents] = await connection.query(
        `SELECT DISTINCT s.student_id, s.id as numeric_id
         FROM enrollments e
         JOIN students s ON (e.student_id = s.student_id OR e.student_id = s.id)
         WHERE e.section_id = ? AND e.status = 'Enrolled'`,
        [classInfo.section_id]
      );
      for (const st of secStudents) {
        if (st.student_id) studentIdsSet.add(String(st.student_id));
        if (st.numeric_id) studentIdsSet.add(String(st.numeric_id));
      }
    }

    // 3. Also create a notification record so students see it in Notification Bell & Student Dashboard Bulletin
    const notifTitle = cleanTitle.includes(subjectLabel) ? cleanTitle : `[${subjectLabel}] ${cleanTitle}`;
    const [notifRes] = await connection.query(
      `INSERT INTO notifications (sender_id, sender_role, type, title, message, attachment, created_at)
       VALUES (?, 'teacher', ?, ?, ?, ?, NOW())`,
      [effectiveTeacherId, type || 'Announcement', notifTitle, cleanMessage, attachment_url]
    );
    const notificationId = notifRes.insertId;

    if (studentIdsSet.size > 0) {
      const recipientValues = Array.from(studentIdsSet).map(sid => [notificationId, sid, 'student', 0]);
      await connection.query(
        `INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES ?`,
        [recipientValues]
      );
    } else {
      // Fallback if section has no linked student rows yet so students still see it
      await connection.query(
        `INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES (?, 'all', 'student', 0)`,
        [notificationId]
      );
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Class announcement posted and shared with students!",
      announcement_id: announcementId,
      notified_count: studentIdsSet.size
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create class announcement error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

// 5. DELETE CLASS ANNOUNCEMENT
export const deleteClassAnnouncement = async (req, res) => {
  const { id, class_id } = req.body;
  if (!id) {
    return res.status(400).json({ status: "error", message: "Announcement ID is required." });
  }

  try {
    await ensureClassAnnouncementsTable();
    await pool.query(
      `DELETE FROM class_announcements WHERE id = ? ${class_id ? 'AND class_id = ?' : ''}`,
      class_id ? [id, class_id] : [id]
    );
    return res.json({
      status: "success",
      message: "Announcement removed."
    });
  } catch (error) {
    console.error("Delete class announcement error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default {
  getAnnouncements,
  markNotificationsRead,
  getClassAnnouncements,
  createClassAnnouncement,
  deleteClassAnnouncement,
  ensureClassAnnouncementsTable
};
