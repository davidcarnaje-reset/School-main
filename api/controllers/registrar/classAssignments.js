import pool from '../../config/db.js';

export const getClassAssignData = async (req, res) => {
  try {
    const [teachers] = await pool.query(
      "SELECT id, full_name FROM users WHERE role = 'teacher' AND status = 'Active' ORDER BY full_name ASC"
    );
    const [subjects] = await pool.query(
      "SELECT id, subject_code, subject_description, grade_level_applicable, program_id, level_category FROM subjects ORDER BY subject_code ASC"
    );
    const [sections] = await pool.query(
      "SELECT id, section_name, grade_level, department, program_id FROM sections WHERE status = 'Active' ORDER BY grade_level ASC, section_name ASC"
    );
    const [rooms] = await pool.query(
      "SELECT id, room_name, room_type, capacity FROM rooms WHERE status = 'Active' ORDER BY room_name ASC"
    );

    const sql_assignments = `
      SELECT 
        ca.id, 
        ca.teacher_id, 
        ca.subject_id, 
        ca.section_id, 
        ca.room_id, 
        ca.schedule, 
        ca.school_year,
        u.full_name as teacher_name, 
        sub.subject_description as subject_name,
        sub.subject_code,
        sec.section_name,
        sec.grade_level,
        r.room_name as room 
      FROM class_assignments ca
      LEFT JOIN users u ON ca.teacher_id = u.id
      LEFT JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
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
  const { teacher_id, subject_id, section_id, start_time, end_time, days, room_id, school_year, schedule } = req.body;

  if (!teacher_id || !subject_id || !section_id || !start_time || !days || !room_id) {
    return res.status(400).json({ success: false, message: "Please complete all schedule details including the Room." });
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
      JOIN users u ON ca.teacher_id = u.id
      JOIN subjects sub ON ca.subject_id = sub.id
      JOIN sections sec ON ca.section_id = sec.id
      LEFT JOIN rooms r ON ca.room_id = r.id
      WHERE ca.is_active = 1 
      AND ${dayQueryPart} 
      AND (? < ca.end_time AND ? > ca.start_time)
      AND (ca.teacher_id = ? OR ca.room_id = ? OR ca.section_id = ?)
    `;

    const [conflicts] = await connection.query(check_sql, [
      start_time,
      end_time,
      parseInt(teacher_id, 10),
      parseInt(room_id, 10),
      parseInt(section_id, 10)
    ]);

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      let reason = "";
      if (conflict.teacher_id === parseInt(teacher_id, 10)) {
        reason = "Teacher " + conflict.teacher + " is already busy.";
      } else if (conflict.room_id === parseInt(room_id, 10)) {
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
        (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insert_sql, [
      nextId,
      parseInt(teacher_id, 10),
      parseInt(subject_id, 10),
      parseInt(section_id, 10),
      parseInt(room_id, 10),
      schedule,
      days,
      start_time,
      end_time,
      school_year
    ]);

    await connection.commit();
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
  const { id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time } = req.body;

  if (!id || !teacher_id || !subject_id || !section_id || !room_id) {
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
        end_time = ? 
      WHERE id = ?
    `;
    await pool.query(sql, [
      parseInt(teacher_id, 10),
      parseInt(subject_id, 10),
      parseInt(section_id, 10),
      parseInt(room_id, 10),
      schedule,
      days,
      start_time,
      end_time,
      parseInt(id, 10)
    ]);

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
      const { teacher_id, room_id, subject_id, subject_code, days: days_arr, start_time, end_time } = draft;

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

      // Conflict Check
      const check_sql = `
        SELECT ca.*, u.full_name as teacher, r.room_name 
        FROM class_assignments ca
        JOIN users u ON ca.teacher_id = u.id
        LEFT JOIN rooms r ON ca.room_id = r.id
        WHERE ca.is_active = 1 
        AND ${dayQueryPart} 
        AND (? < ca.end_time AND ? > ca.start_time)
        AND (ca.teacher_id = ? OR ca.room_id = ? OR ca.section_id = ?)
      `;

      const [conflicts] = await connection.query(check_sql, [
        start_time,
        end_time,
        parseInt(teacher_id, 10),
        parseInt(room_id, 10),
        parseInt(section_id, 10)
      ]);

      if (conflicts.length > 0) {
        await connection.rollback();
        const conflict = conflicts[0];
        let reason = "";
        if (conflict.teacher_id === parseInt(teacher_id, 10)) {
          reason = "Teacher " + conflict.teacher + " is busy.";
        } else if (conflict.room_id === parseInt(room_id, 10)) {
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
          (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(sql_insert, [
        nextId,
        parseInt(teacher_id, 10),
        parseInt(subject_id, 10),
        parseInt(section_id, 10),
        parseInt(room_id, 10),
        schedule_str,
        days,
        start_time,
        end_time,
        school_year
      ]);
    }

    await connection.commit();
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
    return res.status(200).json({ success: true, message: "Class assignment has been successfully deactivated." });
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};
