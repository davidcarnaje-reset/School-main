import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const getClassAssignData = async (req, res) => {
  try {
    const [teachers] = await pool.query(`
      SELECT 
        u.id, 
        COALESCE(NULLIF(u.full_name, ''), CONCAT(u.first_name, ' ', u.last_name)) AS full_name,
        u.first_name,
        u.last_name,
        (
          SELECT e.department 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS department,
        (
          SELECT e.position 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS position,
        (
          SELECT e.assigned_levels 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS assigned_levels,
        (
          SELECT e.assigned_roles 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS assigned_roles,
        (
          SELECT e.assignments_json 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS assignments_json,
        (
          SELECT e.employee_type 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS employee_type,
        (
          SELECT e.status 
          FROM employees e 
          WHERE (u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))) 
          LIMIT 1
        ) AS emp_status
      FROM users u
      WHERE (
        u.role IN ('teacher', 'Teacher', 'Faculty', 'faculty', 'instructor', 'Instructor', 'professor', 'Professor')
        OR EXISTS (
          SELECT 1 FROM employees e 
          WHERE ((u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
             OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))))
          AND (e.department LIKE '%Faculty%' OR e.position LIKE '%Teacher%' OR e.position LIKE '%Instructor%' OR e.position LIKE '%Professor%' OR e.position LIKE '%Faculty%')
        )
      ) 
      AND (u.status = 'Active' OR u.status IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM employees e 
        WHERE ((u.email IS NOT NULL AND e.email IS NOT NULL AND LOWER(TRIM(u.email)) = LOWER(TRIM(e.email)))
           OR (LOWER(TRIM(u.first_name)) = LOWER(TRIM(e.first_name)) AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(e.last_name))))
        AND (e.status IN ('Inactive', 'inactive', 'Archived', 'archived', 'Resigned', 'resigned', 'Terminated', 'terminated'))
      )
      ORDER BY u.last_name ASC, u.first_name ASC
    `);
    const [subjects] = await pool.query(
      "SELECT id, subject_code, subject_description, units, lec_units, lab_units, grade_level_applicable, program_id, level_category, minutes_per_session FROM subjects ORDER BY subject_code ASC"
    );
    const [sections] = await pool.query(`
      SELECT 
        s.id, 
        s.section_name, 
        s.grade_level, 
        s.department, 
        s.program_id,
        ap.program_code,
        ap.program_description,
        ap.major,
        COALESCE(NULLIF(s.adviser_name, ''), NULLIF(u.full_name, ''), CONCAT(u.first_name, ' ', u.last_name)) AS adviser_name
      FROM sections s 
      LEFT JOIN academic_programs ap ON s.program_id = ap.id
      LEFT JOIN users u ON s.adviser_id = u.id
      WHERE s.status = 'Active' 
      ORDER BY s.grade_level ASC, s.section_name ASC
    `);
    const [rooms] = await pool.query(
      "SELECT id, room_name, room_number, room_type, capacity FROM rooms WHERE status = 'Active' ORDER BY room_name ASC, room_number ASC"
    );

    const sql_assignments = `
      SELECT 
        ca.id, 
        ca.teacher_id, 
        ca.subject_id, 
        ca.section_id, 
        ca.room_id, 
        ca.days,
        ca.start_time,
        ca.end_time,
        ca.schedule, 
        ca.school_year,
        ca.delivery_mode,
        ca.meeting_link,
        ca.online_platform,
        u.full_name as teacher_name, 
        sub.subject_description as subject_name,
        sub.subject_code,
        sub.units,
        sec.section_name,
        sec.grade_level,
        sec.department,
        sec.program_id,
        ap.program_code,
        r.room_name,
        r.room_number,
        CONCAT(IF(LOWER(TRIM(r.room_name)) = 'room' AND r.room_number IS NOT NULL AND TRIM(r.room_number) != '', CONCAT('Room ', r.room_number), IF(r.room_number IS NOT NULL AND TRIM(r.room_number) != '', CONCAT(r.room_name, ' (', r.room_number, ')'), r.room_name))) as room 
      FROM class_assignments ca
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN academic_programs ap ON sec.program_id = ap.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.is_active = 1
      ORDER BY ca.id DESC
    `;
    const [assignments] = await pool.query(sql_assignments);

    return res.status(200).json({
      success: true,
      teachers: teachers || [],
      subjects: subjects || [],
      sections: sections || [],
      rooms: rooms || [],
      assignments: assignments || []
    });
  } catch (error) {
    console.error("getClassAssignData error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

const buildDayQueryPart = (days) => {
  // days is a string like "M,W,F" or array
  const arr = Array.isArray(days) ? days : String(days).split(',');
  const cleanDays = arr.map(d => String(d).replace(/[^a-zA-Z]/g, '')).filter(Boolean);
  if (cleanDays.length === 0) return '1=0';
  return "(" + cleanDays.map(d => `FIND_IN_SET('${d}', ca.days) > 0`).join(" OR ") + ")";
};

export const addClassAssign = async (req, res) => {
  const { 
    teacher_id, 
    subject_id, 
    section_id, 
    start_time, 
    end_time, 
    days, 
    room_id, 
    school_year, 
    schedule,
    delivery_mode = 'Face-to-Face',
    meeting_link = null,
    online_platform = 'Google Meet'
  } = req.body;

  const isOnline = delivery_mode === 'Online';
  const cleanTeacherId = teacher_id && parseInt(teacher_id, 10) > 0 ? parseInt(teacher_id, 10) : null;

  if (!subject_id || !section_id || !start_time || !days || (!isOnline && !room_id)) {
    return res.status(400).json({ success: false, message: isOnline ? "Please complete subject and schedule details." : "Please complete all schedule details including the Room." });
  }

  // Time Validation
  const tStart = new Date(`1970-01-01T${start_time}`);
  const tEnd = new Date(`1970-01-01T${end_time}`);
  if (tStart >= tEnd) {
    return res.status(400).json({ success: false, message: "Invalid Schedule: End time must be after start time." });
  }
  const tLimitStart = new Date(`1970-01-01T06:00:00`);
  const tLimitEnd = new Date(`1970-01-01T22:00:00`);
  if (tStart < tLimitStart || tEnd > tLimitEnd) {
    return res.status(400).json({ success: false, message: "Invalid Schedule: Classes must be between 6:00 AM and 10:00 PM." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Conflict Check
    const dayQueryPart = buildDayQueryPart(days);
    const check_sql = `
      SELECT ca.*, u.full_name as teacher, sub.subject_code, sec.section_name, r.room_name 
      FROM class_assignments ca
      LEFT JOIN users u ON ca.teacher_id = u.id
      JOIN subjects sub ON ca.subject_id = sub.id
      JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.is_active = 1 
      AND ${dayQueryPart} 
      AND (? < ca.end_time AND ? > ca.start_time)
      AND (
        (? IS NOT NULL AND ca.teacher_id = ?) 
        OR (? > 0 AND ca.room_id = ?) 
        OR ca.section_id = ?
      )
    `;

    const [conflicts] = await connection.query(check_sql, [
      start_time,
      end_time,
      cleanTeacherId,
      cleanTeacherId,
      isOnline ? 0 : (parseInt(room_id, 10) || 0),
      isOnline ? 0 : (parseInt(room_id, 10) || 0),
      parseInt(section_id, 10)
    ]);

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      let reason = "";
      if (cleanTeacherId && conflict.teacher_id === cleanTeacherId) {
        reason = "Teacher " + (conflict.teacher || 'Selected Teacher') + " is already busy.";
      } else if (!isOnline && conflict.room_id === parseInt(room_id, 10)) {
        reason = "Room " + (conflict.room_name || 'Selected Room') + " is already occupied.";
      } else if (conflict.section_id === parseInt(section_id, 10)) {
        reason = "Section " + conflict.section_name + " already has a class.";
      }

      await connection.rollback();
      return res.status(200).json({
        success: false,
        message: "CONFLICT: " + reason + " (Time: " + conflict.schedule + ")"
      });
    }

    // 2. Manual ID lookup for TiDB
    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM class_assignments FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    // 3. Save assignment
    const insert_sql = `
      INSERT INTO class_assignments 
        (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year, delivery_mode, meeting_link, online_platform) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insert_sql, [
      nextId,
      cleanTeacherId,
      parseInt(subject_id, 10),
      parseInt(section_id, 10),
      isOnline ? null : (parseInt(room_id, 10) || null),
      schedule,
      days,
      start_time,
      end_time,
      school_year || '2026-2027',
      delivery_mode,
      meeting_link || null,
      online_platform || 'Google Meet'
    ]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "ADD_CLASS_ASSIGNMENT",
      `Created class assignment (${delivery_mode}) for subject ID: ${subject_id}, section ID: ${section_id}${cleanTeacherId ? '' : ' (Waiting For Teacher)'}`,
      req
    );
    return res.status(201).json({ success: true, message: "Class assignment saved successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("addClassAssign error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const updateClassAssign = async (req, res) => {
  const { 
    id, 
    teacher_id, 
    subject_id, 
    section_id, 
    room_id, 
    schedule, 
    days, 
    start_time, 
    end_time,
    delivery_mode = 'Face-to-Face',
    meeting_link = null,
    online_platform = 'Google Meet'
  } = req.body;

  const isOnline = delivery_mode === 'Online';
  const cleanTeacherId = teacher_id && parseInt(teacher_id, 10) > 0 ? parseInt(teacher_id, 10) : null;

  if (!id || !subject_id || !section_id || (!isOnline && !room_id)) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const sql = `
      UPDATE class_assignments SET 
        teacher_id = ?, 
        subject_id = ?, 
        section_id = ?, 
        room_id = ?, 
        schedule = ?, 
        days = ?, 
        start_time = ?, 
        end_time = ?,
        delivery_mode = ?,
        meeting_link = ?,
        online_platform = ?
      WHERE id = ?
    `;
    await pool.query(sql, [
      cleanTeacherId,
      parseInt(subject_id, 10),
      parseInt(section_id, 10),
      isOnline ? null : (parseInt(room_id, 10) || null),
      schedule,
      days,
      start_time,
      end_time,
      delivery_mode,
      meeting_link || null,
      online_platform || 'Google Meet',
      parseInt(id, 10)
    ]);

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "UPDATE_CLASS_ASSIGNMENT",
      `Updated class assignment ID: ${id} (${delivery_mode})`,
      req
    );
    return res.status(200).json({ success: true, message: "Class assignment updated successfully." });
  } catch (error) {
    console.error("updateClassAssign error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const deleteClassAssign = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Class ID is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Delete student enrolled classes Cascade
    await connection.query("DELETE FROM enrolled_classes WHERE class_assignment_id = ?", [parseInt(id, 10)]);

    // 2. Delete assignments
    await connection.query("DELETE FROM class_assignments WHERE id = ?", [parseInt(id, 10)]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "DELETE_CLASS_ASSIGNMENT",
      `Deleted class assignment ID: ${id}`,
      req
    );
    return res.status(200).json({ success: true, message: "Class Schedule and related enrollments deleted!" });
  } catch (error) {
    await connection.rollback();
    console.error("deleteClassAssign error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

const formatTimeAmPm = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const bulkAddClassAssign = async (req, res) => {
  const { drafts, section_id, school_year = '2026-2027' } = req.body;

  if (!Array.isArray(drafts) || drafts.length === 0 || !section_id) {
    return res.status(400).json({ success: false, message: "No data provided." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const draft of drafts) {
      const { 
        teacher_id, 
        room_id, 
        subject_id, 
        subject_code, 
        days: days_arr, 
        start_time, 
        end_time,
        delivery_mode = 'Face-to-Face',
        meeting_link = null,
        online_platform = 'Google Meet'
      } = draft;

      const isOnline = delivery_mode === 'Online';
      const cleanTeacherId = teacher_id && parseInt(teacher_id, 10) > 0 ? parseInt(teacher_id, 10) : null;
      const days = days_arr.join(',');
      const display_days = days_arr.join('');

      // Time verification
      const tStart = new Date(`1970-01-01T${start_time}`);
      const tEnd = new Date(`1970-01-01T${end_time}`);
      if (tStart >= tEnd) {
        await connection.rollback();
        return res.status(200).json({ success: false, message: `Invalid Schedule in ${subject_code}: End time must be after start time.` });
      }
      const tLimitStart = new Date(`1970-01-01T06:00:00`);
      const tLimitEnd = new Date(`1970-01-01T22:00:00`);
      if (tStart < tLimitStart || tEnd > tLimitEnd) {
        await connection.rollback();
        return res.status(200).json({ success: false, message: `Invalid Schedule in ${subject_code}: Classes must be between 6:00 AM and 10:00 PM.` });
      }

      const schedule_str = `${display_days} ${formatTimeAmPm(start_time)} - ${formatTimeAmPm(end_time)}`;
      const dayQueryPart = buildDayQueryPart(days_arr);

      // Conflict Check (Only check room conflict if NOT pure online)
      const check_sql = `
        SELECT ca.*, u.full_name as teacher, r.room_name 
        FROM class_assignments ca
        LEFT JOIN users u ON ca.teacher_id = u.id
        LEFT JOIN rooms r ON ca.room_id = r.id
        WHERE ca.is_active = 1 
        AND ${dayQueryPart} 
        AND (? < ca.end_time AND ? > ca.start_time)
        AND ((? IS NOT NULL AND ca.teacher_id = ?) OR (? > 0 AND ca.room_id = ?) OR ca.section_id = ?)
      `;

      const [conflicts] = await connection.query(check_sql, [
        start_time,
        end_time,
        cleanTeacherId,
        cleanTeacherId,
        isOnline ? 0 : (parseInt(room_id, 10) || 0),
        isOnline ? 0 : (parseInt(room_id, 10) || 0),
        parseInt(section_id, 10)
      ]);

      if (conflicts.length > 0) {
        await connection.rollback();
        const conflict = conflicts[0];
        let reason = "";
        if (cleanTeacherId && conflict.teacher_id === cleanTeacherId) {
          reason = "Teacher " + (conflict.teacher || 'Selected Teacher') + " is busy.";
        } else if (!isOnline && conflict.room_id === parseInt(room_id, 10)) {
          reason = "Room " + (conflict.room_name || 'Selected Room') + " is occupied.";
        } else if (conflict.section_id === parseInt(section_id, 10)) {
          reason = "This section already has a class.";
        }

        return res.status(200).json({
          success: false,
          message: `CONFLICT in ${subject_code}: ${reason} (Time blocked: ${conflict.schedule}). Save cancelled.`
        });
      }

      // Query manual ID for TiDB
      const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM class_assignments FOR UPDATE");
      const nextId = maxIdRows[0].maxId + 1;

      const sql_insert = `
        INSERT INTO class_assignments 
          (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year, delivery_mode, meeting_link, online_platform) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(sql_insert, [
        nextId,
        cleanTeacherId,
        parseInt(subject_id, 10),
        parseInt(section_id, 10),
        isOnline ? null : (parseInt(room_id, 10) || null),
        schedule_str,
        days,
        start_time,
        end_time,
        school_year,
        delivery_mode,
        meeting_link || null,
        online_platform || 'Google Meet'
      ]);
    }

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "BULK_ADD_CLASS_ASSIGNMENT",
      `Assigned ${drafts.length} classes for Section ID: ${section_id}`,
      req
    );
    return res.status(200).json({ success: true, message: "All curriculum subjects successfully assigned!" });
  } catch (error) {
    await connection.rollback();
    console.error("bulkAddClassAssign error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Assignment ID is missing." });
  }

  try {
    const sql = "UPDATE teacher_assignments SET is_active = 0 WHERE id = ?";
    await pool.query(sql, [parseInt(id, 10)]);
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "DEACTIVATE_CLASS_ASSIGNMENT",
      `Deactivated class assignment ID: ${id}`,
      req
    );
    return res.status(200).json({ success: true, message: "Class assignment has been successfully deactivated." });
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const autoScheduleGradeLevel = async (req, res) => {
  const {
    grade_level,
    department,
    program_id = null,
    section_ids = [],
    teacher_tags = {},
    start_time = "08:00",
    dismissal_time = "15:00", // Class dismissal / end time limit (default 3:00 PM)
    session_duration = 45, // in minutes (standard elementary period)
    schedule_pattern = "alternating", // 'alternating' (MWF / TTh) | 'daily' (M-F)
    recess_after_slot = 2,
    recess_duration = 15,
    lunch_after_slot = 4,
    lunch_duration = 60,
    days = ['M', 'T', 'W', 'Th', 'F'],
    delivery_mode = 'Face-to-Face',
    room_ids = [],
    school_year = '2026-2027',
    clear_existing = false
  } = req.body;

  if (!grade_level || !Array.isArray(section_ids) || section_ids.length === 0) {
    return res.status(400).json({ success: false, message: "Grade Level and at least one section are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch sections to verify
    const [targetSections] = await connection.query(
      `SELECT s.id, s.section_name, s.grade_level, s.department, s.program_id 
       FROM sections s 
       WHERE s.id IN (?) AND s.status = 'Active'
       ORDER BY s.id ASC`,
      [section_ids]
    );

    if (targetSections.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "No active sections found." });
    }

    // 2. Fetch subjects STRICTLY applicable to this grade_level (NO %Grade 1% wildcard to prevent matching Grade 10, 11, 12!)
    let subQuery = "SELECT * FROM subjects WHERE ";
    let subParams = [];
    if (program_id) {
      subQuery += "(program_id = ? OR program_id IS NULL) AND (TRIM(grade_level_applicable) = ? OR FIND_IN_SET(?, REPLACE(grade_level_applicable, ', ', ',')) > 0 OR grade_level_applicable = 'All') ";
      subParams.push(parseInt(program_id, 10), grade_level, grade_level);
    } else {
      subQuery += "(TRIM(grade_level_applicable) = ? OR FIND_IN_SET(?, REPLACE(grade_level_applicable, ', ', ',')) > 0 OR grade_level_applicable = 'All') ";
      subParams.push(grade_level, grade_level);
    }
    if (department && department !== 'ALL' && department !== 'All') {
      subQuery += "AND (level_category = ? OR level_category = 'All' OR level_category IS NULL) ";
      subParams.push(department);
    }
    subQuery += "ORDER BY id ASC";

    const [applicableSubjects] = await connection.query(subQuery, subParams);

    if (applicableSubjects.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `No subjects found strictly for ${grade_level}${department ? ` (${department})` : ''}. Please check Subject Management.` 
      });
    }

    // Optionally clear existing assignments for these sections in this school_year
    if (clear_existing) {
      await connection.query(
        "DELETE FROM class_assignments WHERE section_id IN (?) AND school_year = ?",
        [section_ids, school_year]
      );
    }

    // 3. Build teacher-to-subject lookup
    // Normalize teacher_tags: subjectToTeachers: { [subject_id]: Set of teacher_ids }
    const subjectToTeachers = {};
    for (const sub of applicableSubjects) {
      subjectToTeachers[sub.id] = new Set();
    }

    if (typeof teacher_tags === 'object' && teacher_tags !== null) {
      for (const [key, val] of Object.entries(teacher_tags)) {
        const numKey = parseInt(key, 10);
        if (Array.isArray(val)) {
          val.forEach(item => {
            const numItem = parseInt(item, 10);
            if (subjectToTeachers[numItem]) {
              subjectToTeachers[numItem].add(numKey);
            } else if (subjectToTeachers[numKey]) {
              subjectToTeachers[numKey].add(numItem);
            }
          });
        }
      }
    }

    // 4. Fetch all active existing assignments to check live conflicts
    const [allExistingAssignments] = await connection.query(
      `SELECT ca.id, ca.teacher_id, ca.section_id, ca.room_id, ca.days, ca.start_time, ca.end_time 
       FROM class_assignments ca 
       WHERE ca.is_active = 1 AND ca.school_year = ?`,
      [school_year]
    );

    const currentAssignments = [...allExistingAssignments];

    const timeToMinutes = (tStr) => {
      const parts = String(tStr).split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
    };

    const minutesToTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    };

    const formatTimeAmPm = (timeStr) => {
      if (!timeStr) return '';
      const parts = String(timeStr).split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1] || '00';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const hasDayOverlap = (days1Arr, days2Str) => {
      if (!days2Str) return false;
      const d2 = days2Str.split(',').map(s => s.trim());
      return days1Arr.some(d => d2.includes(d));
    };

    const hasTimeOverlap = (s1Mins, e1Mins, s2Str, e2Str) => {
      const s2Mins = timeToMinutes(s2Str);
      const e2Mins = timeToMinutes(e2Str);
      return s1Mins < e2Mins && e1Mins > s2Mins;
    };

    const maxDismissalMins = timeToMinutes(dismissal_time || "15:00");
    const teacherLoad = {};

    // Get max ID
    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM class_assignments FOR UPDATE");
    let nextId = maxIdRows[0].maxId + 1;

    const createdAssignments = [];
    let assignedTeacherCount = 0;
    let waitingTeacherCount = 0;

    // Available rooms pool
    const [activeRooms] = await connection.query(
      "SELECT id, room_name, room_number FROM rooms WHERE status = 'Active' ORDER BY id ASC"
    );
    const roomPool = room_ids && room_ids.length > 0
      ? activeRooms.filter(r => room_ids.includes(r.id))
      : activeRooms;

    // 5. Partition subjects based on schedule_pattern
    // Options:
    // - 'part_by_part' (or 'alternating'): Major subjects on MWF (3 days), Other subjects on T-Th (2 days)
    // - 'dynamic_daily' (or 'daily'): All subjects scheduled everyday, dynamically fitted before dismissal_time!
    let dayBatches = [];

    const isMajorSubject = (sub) => {
      const code = (sub.subject_code || '').toUpperCase();
      const desc = (sub.subject_description || '').toLowerCase();
      if (/^(MATH|ENG|SCI|FIL|MTB)/.test(code)) return true;
      if (desc.includes('math') || desc.includes('english') || desc.includes('science') || desc.includes('filipino') || desc.includes('mother tongue')) return true;
      return false;
    };

    if (schedule_pattern === 'part_by_part' || schedule_pattern === 'alternating') {
      const majorSubs = applicableSubjects.filter(isMajorSubject);
      const otherSubs = applicableSubjects.filter(s => !isMajorSubject(s));

      let mwfSubs = majorSubs;
      let tthSubs = otherSubs;

      // Balanced fallback if all or none matched
      if (mwfSubs.length === 0 || tthSubs.length === 0) {
        const mid = Math.ceil(applicableSubjects.length / 2);
        mwfSubs = applicableSubjects.slice(0, mid);
        tthSubs = applicableSubjects.slice(mid);
      }

      const defaultPartDuration = parseInt(session_duration, 10) || 50;

      if (mwfSubs.length > 0) {
        dayBatches.push({
          daysArr: ['M', 'W', 'F'],
          daysStr: 'M,W,F',
          displayDays: 'MWF',
          batchLabel: 'Major Subjects (MWF)',
          subjects: mwfSubs,
          duration: defaultPartDuration
        });
      }
      if (tthSubs.length > 0) {
        dayBatches.push({
          daysArr: ['T', 'Th'],
          daysStr: 'T,Th',
          displayDays: 'TTh',
          batchLabel: 'Other Subjects (T-Th)',
          subjects: tthSubs,
          duration: defaultPartDuration
        });
      }
    } else {
      // Dynamic Daily Fit: All subjects everyday, dynamically proportioned to fit before dismissal_time!
      const startMins = timeToMinutes(start_time || "08:00");
      const endMins = timeToMinutes(dismissal_time || "15:00");
      const totalAvailableMins = Math.max(endMins - startMins, 180);

      // Breaks calculation
      let totalBreakMins = 0;
      const numSubs = applicableSubjects.length;
      if (recess_after_slot && recess_after_slot < numSubs) {
        totalBreakMins += (parseInt(recess_duration, 10) || 15);
      }
      if (lunch_after_slot && lunch_after_slot < numSubs) {
        totalBreakMins += (parseInt(lunch_duration, 10) || 45);
      }

      const netClassMins = Math.max(totalAvailableMins - totalBreakMins, numSubs * 30);
      let calculatedDuration = Math.floor(netClassMins / numSubs);
      if (calculatedDuration > 60) calculatedDuration = 60;
      if (calculatedDuration < 30) calculatedDuration = 30;

      const daysArr = Array.isArray(days) && days.length > 0 ? days : ['M', 'T', 'W', 'Th', 'F'];
      dayBatches.push({
        daysArr,
        daysStr: daysArr.join(','),
        displayDays: daysArr.join(''),
        batchLabel: 'All Subjects (Daily)',
        subjects: applicableSubjects,
        duration: calculatedDuration
      });
    }

    // 6. Generate schedule per section with subject rotation to avoid teacher conflicts!
    for (let secIdx = 0; secIdx < targetSections.length; secIdx++) {
      const section = targetSections[secIdx];
      
      let sectionRoomId = null;
      if (delivery_mode !== 'Online' && roomPool.length > 0) {
        sectionRoomId = roomPool[secIdx % roomPool.length].id;
      }

      for (const batch of dayBatches) {
        let currentMinute = timeToMinutes(start_time);

        // Subject rotation: Rotate subjects order by secIdx so section 1 and section 2 don't take the exact same subject at the exact same hour!
        const batchSubjects = [...batch.subjects];
        const offset = secIdx % batchSubjects.length;
        const rotatedSubjects = [...batchSubjects.slice(offset), ...batchSubjects.slice(0, offset)];

        for (let subIdx = 0; subIdx < rotatedSubjects.length; subIdx++) {
          const subject = rotatedSubjects[subIdx];
          const duration = batch.duration || (subject.minutes_per_session && subject.minutes_per_session >= 30
            ? parseInt(subject.minutes_per_session, 10)
            : (parseInt(session_duration, 10) || 45));

          let slotStartMins = currentMinute;
          let slotEndMins = currentMinute + duration;

          const slotStartStr = minutesToTime(slotStartMins);
          const slotEndStr = minutesToTime(slotEndMins);

          // Advance currentMinute for next subject
          currentMinute = slotEndMins;

          // Check break / recess / lunch
          const subjectNum = subIdx + 1;
          if (recess_after_slot && subjectNum === parseInt(recess_after_slot, 10)) {
            currentMinute += parseInt(recess_duration, 10) || 15;
          } else if (lunch_after_slot && subjectNum === parseInt(lunch_after_slot, 10)) {
            currentMinute += parseInt(lunch_duration, 10) || 45;
          }

          // Find available candidate teacher
          const candidateTeacherIds = Array.from(subjectToTeachers[subject.id] || []);
          let assignedTeacherId = null;

          // Filter out teachers who have conflict at this slot on these days
          const availableTeachers = candidateTeacherIds.filter(tId => {
            const hasConflict = currentAssignments.some(asgn => {
              if (asgn.teacher_id === tId && hasDayOverlap(batch.daysArr, asgn.days)) {
                return hasTimeOverlap(slotStartMins, slotEndMins, asgn.start_time, asgn.end_time);
              }
              return false;
            });
            return !hasConflict;
          });

          if (availableTeachers.length > 0) {
            // Sort by current load to balance assignments
            availableTeachers.sort((a, b) => (teacherLoad[a] || 0) - (teacherLoad[b] || 0));
            assignedTeacherId = availableTeachers[0];
            teacherLoad[assignedTeacherId] = (teacherLoad[assignedTeacherId] || 0) + 1;
            assignedTeacherCount++;
          } else {
            // If all candidate teachers are busy or none tagged -> Waiting For Teacher! (Wala muna, no conflict forced)
            assignedTeacherId = null;
            waitingTeacherCount++;
          }

          // Room conflict check
          let chosenRoomId = sectionRoomId;
          if (chosenRoomId && delivery_mode !== 'Online') {
            const roomConflict = currentAssignments.some(asgn => {
              if (asgn.room_id === chosenRoomId && hasDayOverlap(batch.daysArr, asgn.days)) {
                return hasTimeOverlap(slotStartMins, slotEndMins, asgn.start_time, asgn.end_time);
              }
              return false;
            });
            if (roomConflict) {
              const freeRoom = roomPool.find(r => {
                return !currentAssignments.some(asgn => 
                  asgn.room_id === r.id && hasDayOverlap(batch.daysArr, asgn.days) && hasTimeOverlap(slotStartMins, slotEndMins, asgn.start_time, asgn.end_time)
                );
              });
              chosenRoomId = freeRoom ? freeRoom.id : null;
            }
          }

          const schedStr = `${batch.displayDays} ${formatTimeAmPm(slotStartStr.substring(0, 5))} - ${formatTimeAmPm(slotEndStr.substring(0, 5))}`;

          const newAssignment = {
            id: nextId++,
            teacher_id: assignedTeacherId,
            subject_id: subject.id,
            section_id: section.id,
            room_id: chosenRoomId,
            days: batch.daysStr,
            start_time: slotStartStr,
            end_time: slotEndStr,
            schedule: schedStr,
            school_year,
            delivery_mode,
            meeting_link: null,
            online_platform: delivery_mode === 'Online' ? 'Google Meet' : null
          };

          await connection.query(
            `INSERT INTO class_assignments 
              (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year, delivery_mode, meeting_link, online_platform)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newAssignment.id,
              newAssignment.teacher_id,
              newAssignment.subject_id,
              newAssignment.section_id,
              newAssignment.room_id,
              newAssignment.schedule,
              newAssignment.days,
              newAssignment.start_time,
              newAssignment.end_time,
              newAssignment.school_year,
              newAssignment.delivery_mode,
              newAssignment.meeting_link,
              newAssignment.online_platform
            ]
          );

          currentAssignments.push(newAssignment);
          createdAssignments.push({
            ...newAssignment,
            subject_code: subject.subject_code,
            subject_name: subject.subject_description,
            section_name: section.section_name
          });
        }
      }
    }

    await connection.commit();

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "AUTO_SCHEDULE_GENERATED",
      `Auto-generated schedule for ${grade_level} (${targetSections.map(s => s.section_name).join(', ')}). Created: ${createdAssignments.length}, Assigned: ${assignedTeacherCount}, Waiting For Teacher: ${waitingTeacherCount}`,
      req
    );

    return res.status(200).json({
      success: true,
      message: `Successfully generated schedule for ${grade_level}! (${createdAssignments.length} classes scheduled, dismissal by ${dismissal_time})`,
      summary: {
        total_classes: createdAssignments.length,
        assigned_teachers: assignedTeacherCount,
        waiting_for_teacher: waitingTeacherCount,
        sections_scheduled: targetSections.length
      },
      assignments: createdAssignments
    });
  } catch (error) {
    await connection.rollback();
    console.error("autoScheduleGradeLevel error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};
