import pool from '../config/db.js';

/**
 * Resolves a student identifier (could be student_id, email, or id) to the canonical student_id
 */
export const resolveStudentId = async (identifier) => {
  if (!identifier) return null;
  try {
    const [rows] = await pool.query(
      "SELECT student_id FROM students WHERE student_id = ? OR email = ? OR id = ? LIMIT 1",
      [identifier, identifier, identifier]
    );
    if (rows.length > 0) return rows[0].student_id;
    return identifier;
  } catch (err) {
    console.error("Error resolving student ID:", err);
    return identifier;
  }
};

/**
 * Automatically synchronizes a student's enrolled classes from their official section
 * and custom subject assignments into enrolled_classes table.
 */
export const syncStudentEnrolledClasses = async (identifier) => {
  const studentId = await resolveStudentId(identifier);
  if (!studentId) return { success: false, message: 'Invalid student identifier' };

  try {
    // 1. Get student's latest active enrollment
    const [enrRows] = await pool.query(
      `SELECT e.id, e.student_id, e.section_id, e.grade_level, e.program_id, e.school_year, e.status, sec.section_name, sec.adviser_id
       FROM enrollments e
       LEFT JOIN sections sec ON e.section_id = sec.id
       WHERE e.student_id = ?
       ORDER BY e.id DESC LIMIT 1`,
      [studentId]
    );

    if (enrRows.length === 0) {
      return { success: true, count: 0, message: 'No enrollment record found' };
    }

    const enrollment = enrRows[0];
    const sectionId = enrollment.section_id;

    let targetClassAssignmentIds = [];

    // 2. If student is assigned to a section
    if (sectionId) {
      // Check existing active class assignments for this section
      const [secClasses] = await pool.query(
        "SELECT id FROM class_assignments WHERE section_id = ? AND is_active = 1",
        [sectionId]
      );

      // If this section has classes, collect their IDs
      if (secClasses.length > 0) {
        targetClassAssignmentIds.push(...secClasses.map(c => c.id));
      } else {
        // If section has NO class assignments yet, auto-provision from curriculum subjects
        console.log(`[LMS SYNC] Section ${sectionId} (${enrollment.section_name}) has no class assignments. Auto-provisioning...`);
        
        let subjQuery = `SELECT id, subject_code, subject_description, level_category FROM subjects WHERE 1=1`;
        const subjParams = [];

        if (enrollment.grade_level) {
          subjQuery += ` AND (grade_level_applicable = ? OR grade_level_applicable IS NULL)`;
          subjParams.push(enrollment.grade_level);
        }

        if (enrollment.program_id) {
          subjQuery += ` AND (program_id = ? OR program_id IS NULL)`;
          subjParams.push(enrollment.program_id);
        }

        subjQuery += ` ORDER BY id ASC LIMIT 8`;

        const [matchingSubs] = await pool.query(subjQuery, subjParams);

        if (matchingSubs.length > 0) {
          const sampleSchedules = [
            { schedule: 'MWF 08:00 AM - 08:45 AM', days: 'M,W,F', start_time: '08:00:00', end_time: '08:45:00' },
            { schedule: 'MWF 08:45 AM - 09:30 AM', days: 'M,W,F', start_time: '08:45:00', end_time: '09:30:00' },
            { schedule: 'MWF 09:45 AM - 10:30 AM', days: 'M,W,F', start_time: '09:45:00', end_time: '10:30:00' },
            { schedule: 'MWF 10:30 AM - 11:15 AM', days: 'M,W,F', start_time: '10:30:00', end_time: '11:15:00' },
            { schedule: 'TTh 08:00 AM - 08:45 AM', days: 'T,Th', start_time: '08:00:00', end_time: '08:45:00' },
            { schedule: 'TTh 08:45 AM - 09:30 AM', days: 'T,Th', start_time: '08:45:00', end_time: '09:30:00' },
            { schedule: 'TTh 09:45 AM - 10:30 AM', days: 'T,Th', start_time: '09:45:00', end_time: '10:30:00' },
            { schedule: 'TTh 10:30 AM - 11:15 AM', days: 'T,Th', start_time: '10:30:00', end_time: '11:15:00' }
          ];

          for (let i = 0; i < matchingSubs.length; i++) {
            const sub = matchingSubs[i];
            const slot = sampleSchedules[i % sampleSchedules.length];
            const [maxCaId] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM class_assignments");
            const newCaId = maxCaId[0].nextId;

            await pool.query(
              `INSERT INTO class_assignments 
                (id, teacher_id, subject_id, section_id, room_id, schedule, days, start_time, end_time, school_year, is_active, delivery_mode)
               VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 1, 'Face-to-Face')`,
              [
                newCaId,
                null,
                sub.id,
                sectionId,
                slot.schedule,
                slot.days,
                slot.start_time,
                slot.end_time,
                enrollment.school_year || '2026-2027'
              ]
            );
            targetClassAssignmentIds.push(newCaId);
          }
        }
      }
    }

    // 3. Also check custom subjects from student_subjects table (for irregular students)
    const [customSubs] = await pool.query(
      `SELECT ca.id 
       FROM student_subjects ss
       JOIN class_assignments ca ON ss.subject_id = ca.subject_id
       WHERE ss.student_id = ? AND ca.is_active = 1`,
      [studentId]
    );
    if (customSubs.length > 0) {
      customSubs.forEach(c => {
        if (!targetClassAssignmentIds.includes(c.id)) {
          targetClassAssignmentIds.push(c.id);
        }
      });
    }

    // 4. Ensure each class is inserted into enrolled_classes with status = 'Enrolled'
    let insertedCount = 0;
    for (const caId of targetClassAssignmentIds) {
      const [existing] = await pool.query(
        "SELECT id, status FROM enrolled_classes WHERE student_id = ? AND class_assignment_id = ?",
        [studentId, caId]
      );

      if (existing.length === 0) {
        const [maxEcId] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM enrolled_classes");
        await pool.query(
          "INSERT INTO enrolled_classes (id, student_id, class_assignment_id, status, date_enrolled) VALUES (?, ?, ?, 'Enrolled', NOW())",
          [maxEcId[0].nextId, studentId, caId]
        );
        insertedCount++;
      } else if (existing[0].status !== 'Enrolled') {
        await pool.query(
          "UPDATE enrolled_classes SET status = 'Enrolled' WHERE id = ?",
          [existing[0].id]
        );
      }
    }

    return {
      success: true,
      student_id: studentId,
      synced_classes: targetClassAssignmentIds.length,
      newly_inserted: insertedCount
    };

  } catch (error) {
    console.error(`[LMS SYNC ERROR] Failed to sync classes for ${studentId}:`, error);
    return { success: false, error: error.message };
  }
};
