import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// Helper: DO 015, s. 2026 Table 11 Qualitative Descriptors of Numeric Grades
const getDO2026Descriptor = (numGrade) => {
  const g = parseFloat(numGrade);
  if (isNaN(g) || g <= 0) return 'N/A';
  if (g >= 90) return 'Advancing (90-100)';
  if (g >= 80) return 'Benchmarking (80-89)';
  if (g >= 75) return 'Connecting (75-79)';
  if (g >= 65) return 'Developing (65-74)';
  return 'Emerging (0-64)';
};

// ====================================================
// 1. GET SF1: DEPED SCHOOL REGISTER REPORT
// ====================================================
export const getSF1Report = async (req, res) => {
  const { grade_level, section } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id,
        s.lrn,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.suffix,
        s.gender,
        s.dob,
        TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
        CONCAT_WS(', ', COALESCE(s.address_house,''), COALESCE(s.address_brgy,''), COALESCE(s.address_city,''), COALESCE(s.address_province,'')) AS full_address,
        CONCAT_WS(' ', s.father_first_name, s.father_last_name) AS father_name,
        CONCAT_WS(' ', s.mother_first_name, s.mother_last_name) AS mother_name,
        CONCAT_WS(' ', s.guardian_first_name, s.guardian_last_name) AS guardian_name,
        s.guardian_rel,
        s.mobile_no,
        e.grade_level,
        COALESCE(sec.section_name, e.section, 'TBA') AS section,
        COALESCE(ap.program_code, 'K-12 Basic Ed') AS program
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE 1=1
    `;

    const params = [];
    if (grade_level && grade_level !== 'All') {
      sql += ` AND e.grade_level = ?`;
      params.push(grade_level);
    }
    if (section && section !== 'All') {
      sql += ` AND (e.section = ? OR sec.section_name = ?)`;
      params.push(section, section);
    }

    sql += ` ORDER BY s.gender DESC, s.last_name ASC, s.first_name ASC`;

    const [students] = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      grade_level: grade_level || 'All',
      section: section || 'All',
      total_learners: students.length,
      male_count: students.filter(s => s.gender === 'Male').length,
      female_count: students.filter(s => s.gender === 'Female').length,
      data: students
    });
  } catch (error) {
    console.error("getSF1Report Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================
// 2. GET SF5: DEPED REPORT ON PROMOTION & PROFICIENCY
// ====================================================
export const getSF5Report = async (req, res) => {
  const { grade_level, section } = req.query;

  try {
    let sql_students = `
      SELECT 
        s.student_id,
        s.lrn,
        CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name, '')) AS student_name,
        s.gender,
        e.grade_level,
        COALESCE(sec.section_name, e.section, 'TBA') AS section
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      WHERE 1=1
    `;

    const params = [];
    if (grade_level && grade_level !== 'All') {
      sql_students += ` AND e.grade_level = ?`;
      params.push(grade_level);
    }
    if (section && section !== 'All') {
      sql_students += ` AND (e.section = ? OR sec.section_name = ?)`;
      params.push(section, section);
    }

    sql_students += ` ORDER BY s.gender DESC, s.last_name ASC`;

    const [students] = await pool.query(sql_students, params);

    // Compute grades for each student per subject
    const resultData = await Promise.all(students.map(async (st) => {
      const [grades] = await pool.query(`
        SELECT sg.class_id, sg.quarter, sg.final_grade, sg.descriptive_grade, sub.subject_code, sub.subject_description
        FROM student_grades sg
        JOIN class_assignments ca ON sg.class_id = ca.id
        JOIN subjects sub ON ca.subject_id = sub.id
        WHERE sg.student_id = ? AND (sg.final_grade IS NOT NULL OR sg.descriptive_grade IS NOT NULL)
      `, [st.student_id]);

      // Group by subject to compute Final Grade (FG) per learning area
      const bySubject = {};
      grades.forEach(g => {
        const val = parseFloat(g.final_grade || 0);
        if (val > 0) {
          if (!bySubject[g.subject_code]) bySubject[g.subject_code] = [];
          bySubject[g.subject_code].push(val);
        }
      });

      const subjectFGs = Object.values(bySubject).map(vals =>
        Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      );

      let gwa = 0;
      let status = 'Promoted';
      let failedCount = 0;

      if (subjectFGs.length > 0) {
        const total = subjectFGs.reduce((acc, fg) => acc + fg, 0);
        // DO 015, s. 2026 Sec. 53: GA expressed as a whole number (with 2-decimal precision kept for display if needed)
        gwa = Math.round(total / subjectFGs.length);
        
        failedCount = subjectFGs.filter(fg => fg < 75).length;
        if (failedCount >= 3) {
          status = 'Retained';
        } else if (failedCount > 0) {
          status = 'Conditional (Summer Remedial)';
        }
      }

      const level = subjectFGs.length > 0 ? getDO2026Descriptor(gwa) : 'N/A';

      return {
        ...st,
        gwa: subjectFGs.length > 0 ? gwa : 'N/A',
        status,
        failed_count: failedCount,
        proficiency_level: level
      };
    }));

    return res.status(200).json({
      success: true,
      grade_level: grade_level || 'All',
      section: section || 'All',
      summary: {
        total: resultData.length,
        promoted: resultData.filter(r => r.status === 'Promoted').length,
        conditional: resultData.filter(r => r.status.startsWith('Conditional')).length,
        retained: resultData.filter(r => r.status === 'Retained').length
      },
      data: resultData
    });
  } catch (error) {
    console.error("getSF5Report Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================
// 3. GET FORM 138 / SF9 (REPORT CARD)
// ====================================================
export const getForm138ReportCard = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    const q = String(student_id).trim();
    const likeQ = `%${q}%`;

    const [studentRows] = await pool.query(`
      SELECT 
        s.student_id, s.lrn, s.first_name, s.middle_name, s.last_name, s.suffix, s.gender, s.dob,
        TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
        CONCAT_WS(' ', s.first_name, COALESCE(s.middle_name,''), s.last_name, COALESCE(s.suffix,'')) AS name,
        COALESCE(e.grade_level, sec.grade_level, 'Grade 1') AS grade_level, 
        COALESCE(sec.section_name, e.section, 'Section A') AS section, 
        COALESCE(e.school_year, '2026-2027') AS school_year,
        e.section_id,
        CONCAT_WS(' ', adv.first_name, adv.last_name) AS adviser_name,
        COALESCE(ap.program_code, 'Basic Education') AS program,
        CASE
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%College%' OR COALESCE(e.grade_level, '') LIKE '%Year%' THEN 'College'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%11%' OR COALESCE(e.grade_level, sec.grade_level, '') LIKE '%12%' THEN 'SHS'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%Kinder%' THEN 'Kinder'
          ELSE 'K-10'
        END AS department
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN users adv ON sec.adviser_id = adv.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ? 
         OR s.lrn = ? 
         OR CONCAT_WS(' ', s.first_name, s.last_name) LIKE ?
         OR CONCAT_WS(', ', s.last_name, s.first_name) LIKE ?
      ORDER BY e.created_at DESC LIMIT 1
    `, [q, q, likeQ, likeQ]);

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const student = studentRows[0];
    const resolvedId = student.student_id;

    const [grades] = await pool.query(`
      SELECT 
        ca.id AS class_id,
        sub.subject_code,
        sub.subject_description,
        sub.subject_type,
        sub.level_category,
        sub.units,
        sg.quarter,
        sg.written,
        sg.performance,
        sg.exam,
        sg.initial_grade,
        sg.final_grade,
        sg.descriptive_grade,
        sg.descriptor,
        sg.remarks,
        sg.details_json,
        COALESCE(cgl.is_locked, 0) AS is_locked
      FROM class_assignments ca
      JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN student_grades sg ON sg.class_id = ca.id AND sg.student_id = ?
      LEFT JOIN class_grade_locks cgl ON ca.id = cgl.class_id AND sg.quarter = cgl.quarter
      WHERE ca.section_id = ?
         OR ca.id IN (SELECT ec.class_assignment_id FROM enrolled_classes ec WHERE ec.student_id = ?)
         OR ca.id IN (SELECT sg2.class_id FROM student_grades sg2 WHERE sg2.student_id = ?)
      ORDER BY sub.subject_code ASC, sg.quarter ASC
    `, [resolvedId, student.section_id || 0, resolvedId, resolvedId]);

    // Group grades per subject (Q1/T1, Q2/T2, Q3/T3, Q4, Final)
    const subjectMap = {};
    grades.forEach(g => {
      if (!subjectMap[g.subject_code]) {
        subjectMap[g.subject_code] = {
          class_id: g.class_id,
          code: g.subject_code,
          description: g.subject_description,
          subject_type: g.subject_type,
          level_category: g.level_category,
          units: g.units,
          q1: null, q2: null, q3: null, q4: null,
          desc1: null, desc2: null, desc3: null, desc4: null,
          details1: null, details2: null, details3: null, details4: null,
          is_locked: { q1: 0, q2: 0, q3: 0, q4: 0 },
          final_grade: null,
          descriptive_final: null,
          descriptor: null,
          remarks: ''
        };
      }
      const qNum = parseInt(g.quarter, 10);
      const fgNum = parseFloat(g.final_grade);
      const validFg = !isNaN(fgNum) && fgNum > 0 ? Math.round(fgNum) : null;

      if (qNum >= 1 && qNum <= 4) {
        subjectMap[g.subject_code][`q${qNum}`] = validFg;
        subjectMap[g.subject_code][`desc${qNum}`] = g.descriptive_grade || null;
        subjectMap[g.subject_code][`details${qNum}`] = g.details_json || null;
        subjectMap[g.subject_code].is_locked[`q${qNum}`] = g.is_locked;
      } else if (!g.quarter && validFg) {
        subjectMap[g.subject_code].final_grade = validFg;
      }
    });

    const subjectList = Object.values(subjectMap).map(sub => {
      const termVals = [sub.q1, sub.q2, sub.q3, sub.q4].filter(v => v !== null && v > 0);
      if (sub.final_grade === null && termVals.length > 0) {
        // DO 015, s. 2026 Sec. 52: FG is average of TGs, rounded to nearest whole number
        sub.final_grade = Math.round(termVals.reduce((a, b) => a + b, 0) / termVals.length);
      }
      if (sub.final_grade !== null) {
        sub.descriptor = getDO2026Descriptor(sub.final_grade).split(' (')[0];
        sub.remarks = sub.final_grade >= 75 ? 'PASSED' : 'FAILED';
      } else {
        const descVals = [sub.desc3, sub.desc2, sub.desc1].filter(Boolean);
        if (descVals.length > 0) {
          sub.descriptive_final = descVals[0];
          sub.remarks = 'PROMOTED';
        }
      }
      return sub;
    });

    // Compute General Average (DO 015, s. 2026 Sec. 53: whole number)
    let generalAverage = 0;
    const validGrades = subjectList.filter(s => s.final_grade !== null && s.final_grade > 0);
    if (validGrades.length > 0) {
      const sum = validGrades.reduce((acc, curr) => acc + parseFloat(curr.final_grade), 0);
      generalAverage = Math.round(sum / validGrades.length);
    }

    const minFg = validGrades.length > 0 ? Math.min(...validGrades.map(s => parseFloat(s.final_grade))) : 0;
    const hasAcademicExcellence = generalAverage >= 90 && minFg >= 80;

    return res.status(200).json({
      success: true,
      student,
      grades,
      subjects: subjectList,
      general_average: generalAverage > 0 ? generalAverage : 'N/A',
      descriptor: generalAverage > 0 ? getDO2026Descriptor(generalAverage) : 'N/A',
      academic_award: hasAcademicExcellence ? 'Academic Excellence Award' : null,
      promotion_status: generalAverage >= 75 || subjectList.some(s => s.descriptive_final)
        ? 'PROMOTED TO NEXT GRADE LEVEL'
        : (generalAverage > 0 ? 'FOR INTERVENTION / RETAINED' : 'IN PROGRESS')
    });
  } catch (error) {
    console.error("getForm138ReportCard Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================
// 4. GET CERTIFICATE OF ENROLLMENT / REGISTRATION (COE)
// ====================================================
export const getCertificateOfEnrollment = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    const [studentRows] = await pool.query(`
      SELECT 
        s.student_id, s.lrn, s.first_name, s.middle_name, s.last_name, s.suffix, s.gender, s.email, s.mobile_no,
        e.grade_level, COALESCE(sec.section_name, e.section, 'TBA') AS section, e.school_year, e.enrollment_type, e.payment_plan,
        COALESCE(ap.program_code, 'Basic Education') AS program_code,
        COALESCE(ap.program_description, 'General Education Curriculum') AS program_desc
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ? OR s.lrn = ?
      ORDER BY e.created_at DESC LIMIT 1
    `, [student_id, student_id]);

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const student = studentRows[0];

    const [enrolledSubjects] = await pool.query(`
      SELECT 
        sub.subject_code, sub.subject_description, sub.units,
        COALESCE(ca.room_name, 'TBA') AS room,
        COALESCE(ca.schedule_time, 'TBA') AS schedule,
        CONCAT(u.first_name, ' ', u.last_name) AS instructor
      FROM student_grades sg
      JOIN class_assignments ca ON sg.class_id = ca.id
      JOIN subjects sub ON ca.subject_id = sub.id
      LEFT JOIN users u ON ca.teacher_id = u.id
      WHERE sg.student_id = ?
      GROUP BY ca.id, sub.subject_code, sub.subject_description, sub.units, ca.room_name, ca.schedule_time, u.first_name, u.last_name
    `, [student.student_id]);

    const totalUnits = enrolledSubjects.reduce((acc, sub) => acc + (parseInt(sub.units) || 0), 0);

    return res.status(200).json({
      success: true,
      student,
      enrolled_subjects: enrolledSubjects,
      total_units: totalUnits,
      date_issued: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    });
  } catch (error) {
    console.error("getCertificateOfEnrollment Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================
// 5. GET HONOR STUDENTS & ACADEMIC EXCELLENCE (DO 015, s. 2026)
// ====================================================
export const getHonorStudents = async (req, res) => {
  const { grade_level } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id, s.lrn, s.first_name, s.middle_name, s.last_name, s.gender,
        e.grade_level, COALESCE(sec.section_name, e.section, 'TBA') AS section,
        COALESCE(ap.program_code, 'Basic Ed') AS program
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE 1=1
    `;

    const params = [];
    if (grade_level && grade_level !== 'All') {
      sql += ` AND e.grade_level = ?`;
      params.push(grade_level);
    }

    const [students] = await pool.query(sql, params);

    const honorList = [];

    for (const st of students) {
      const [grades] = await pool.query(`
        SELECT sg.class_id, sg.final_grade
        FROM student_grades sg
        WHERE sg.student_id = ? AND sg.final_grade IS NOT NULL AND sg.final_grade > 0
      `, [st.student_id]);

      if (grades.length === 0) continue;

      // Group by class_id to get FG per learning area
      const byClass = {};
      grades.forEach(g => {
        if (!byClass[g.class_id]) byClass[g.class_id] = [];
        byClass[g.class_id].push(parseFloat(g.final_grade));
      });

      const subjectFGs = Object.values(byClass).map(vals =>
        Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      );

      // DO 015, s. 2026 Sec. IX.75: GA of 90 or higher, with no FG below 80 in any learning area
      const hasLowGrade = subjectFGs.some(fg => fg < 80);
      const total = subjectFGs.reduce((a, b) => a + b, 0);
      const gwa = Math.round(total / subjectFGs.length);

      if (gwa >= 90 && !hasLowGrade) {
        let honorTitle = 'Academic Excellence Award (Advancing)';
        if (gwa >= 98) honorTitle = 'Academic Excellence Award (With Highest Honors)';
        else if (gwa >= 95) honorTitle = 'Academic Excellence Award (With High Honors)';

        honorList.push({
          ...st,
          gwa,
          honor_title: honorTitle
        });
      }
    }

    // DO 015, s. 2026 Sec. IX.75: Awardees listed alphabetically (or by GWA then alphabetically)
    honorList.sort((a, b) => b.gwa - a.gwa || a.last_name.localeCompare(b.last_name));

    return res.status(200).json({
      success: true,
      grade_level: grade_level || 'All',
      count: honorList.length,
      data: honorList
    });
  } catch (error) {
    console.error("getHonorStudents Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================================================
// 6. BATCH STUDENT PROMOTION TOOL
// ====================================================
export const promoteStudentsBatch = async (req, res) => {
  const { student_ids, target_grade_level, target_school_year } = req.body;

  if (!Array.isArray(student_ids) || student_ids.length === 0 || !target_grade_level) {
    return res.status(400).json({ success: false, message: "Valid student IDs and Target Grade Level are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const id of student_ids) {
      await connection.query(`
        UPDATE enrollments 
        SET grade_level = ?, school_year = COALESCE(?, school_year), updated_at = NOW()
        WHERE student_id = ?
      `, [target_grade_level, target_school_year || null, id]);
    }

    await connection.commit();

    await logAuditTrail({
      userId: req.user?.id || 1,
      userRole: req.user?.role || 'registrar',
      action: 'BATCH_STUDENT_PROMOTION',
      details: `Promoted ${student_ids.length} students to ${target_grade_level} (SY: ${target_school_year || 'Current'})`
    });

    return res.status(200).json({
      success: true,
      message: `Successfully promoted ${student_ids.length} students to ${target_grade_level}.`
    });
  } catch (error) {
    await connection.rollback();
    console.error("promoteStudentsBatch Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
