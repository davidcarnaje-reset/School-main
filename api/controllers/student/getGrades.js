import pool from '../../config/db.js';
import { resolveStudentId, syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

// Map A-E letter grades to representative numeric equivalents when computing an overall average if needed
const LETTER_TO_NUM = { A: 97, B: 91, C: 86, D: 80, E: 72 };
const NUM_TO_LETTER = (n) => {
  if (n >= 95) return 'A';
  if (n >= 89) return 'B';
  if (n >= 83) return 'C';
  if (n >= 75) return 'D';
  return 'E';
};

const getGrades = async (req, res) => {
  const { student_id, email, sy } = req.query;

  let targetStudentId = student_id;
  let targetSy = sy;

  try {
    // Ensure DepEd DO 015 s. 2026 columns exist on student_grades
    const alterStatements = [
      "ALTER TABLE student_grades ADD COLUMN initial_grade DECIMAL(5,2) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptive_grade VARCHAR(15) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN descriptor VARCHAR(60) NULL DEFAULT NULL",
      "ALTER TABLE student_grades ADD COLUMN details_json LONGTEXT NULL DEFAULT NULL"
    ];
    for (const stmt of alterStatements) {
      try { await pool.query(stmt); } catch (_) {}
    }

    // 1. Resolve student_id and school_year from email if student_id is not passed
    if (!targetStudentId && email) {
      const [studentRows] = await pool.query(
        `SELECT s.student_id, e.school_year 
         FROM students s
         LEFT JOIN enrollments e ON s.student_id = e.student_id
         WHERE s.email = ?
         ORDER BY e.id DESC LIMIT 1`,
        [email]
      );
      if (studentRows[0]) {
        targetStudentId = studentRows[0].student_id;
        if (!targetSy) targetSy = studentRows[0].school_year;
      }
    }

    if (!targetStudentId) {
      return res.status(400).json({ status: "error", message: "student_id or email is required." });
    }

    const canonicalStudentId = await resolveStudentId(targetStudentId);
    try {
      await syncStudentEnrolledClasses(canonicalStudentId);
    } catch (_) {}

    // Fetch full student record (matching Registrar SF9 structure)
    const [studentInfoRows] = await pool.query(
      `SELECT 
        s.id AS numeric_id,
        s.student_id, 
        s.lrn,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.suffix,
        s.gender,
        s.dob,
        TIMESTAMPDIFF(YEAR, s.dob, CURDATE()) AS age,
        CONCAT_WS(' ', s.first_name, COALESCE(s.middle_name,''), s.last_name, COALESCE(s.suffix,'')) AS name,
        CONCAT(s.last_name, ', ', s.first_name, IF(s.middle_name IS NOT NULL AND s.middle_name != '', CONCAT(' ', LEFT(s.middle_name, 1), '.'), '')) AS formal_name,
        COALESCE(e.grade_level, sec.grade_level, 'Grade 1') AS grade_level, 
        e.semester, 
        COALESCE(e.school_year, '2026-2027') AS school_year,
        COALESCE(sec.section_name, e.section, 'Section A') AS section_name,
        e.section_id,
        CONCAT_WS(' ', adv.first_name, adv.last_name) AS adviser_name,
        COALESCE(ap.program_code, 'K-12 Basic Ed') AS program,
        COALESCE(ap.program_description, 'Basic Education Curriculum') AS program_description,
        CASE
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%College%' OR COALESCE(e.grade_level, '') LIKE '%Year%' THEN 'College'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%11%' OR COALESCE(e.grade_level, sec.grade_level, '') LIKE '%12%' THEN 'SHS'
          WHEN COALESCE(e.grade_level, sec.grade_level, '') LIKE '%Kinder%' THEN 'Kinder'
          ELSE 'K-10'
        END AS department
      FROM students s
      LEFT JOIN enrollments e ON (s.student_id = e.student_id OR s.id = e.student_id)
      LEFT JOIN sections sec ON e.section_id = sec.id
      LEFT JOIN users adv ON sec.adviser_id = adv.id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ? OR s.id = ?
      ORDER BY e.id DESC LIMIT 1`,
      [canonicalStudentId, targetStudentId]
    );

    const studentRecord = studentInfoRows[0] || {
      student_id: canonicalStudentId,
      grade_level: 'Grade 1',
      school_year: targetSy || '2026-2027',
      section_id: 0
    };

    if (!targetSy) {
      targetSy = studentRecord.school_year;
    }

    const idCandidates = Array.from(new Set([
      String(targetStudentId),
      String(canonicalStudentId),
      String(studentRecord.numeric_id || ''),
      String(studentRecord.student_id || '')
    ].filter(Boolean)));

    // Query all subjects assigned to the student's section, enrolled_classes, or student_grades
    const gradeQuery = `
      SELECT 
          ca.id AS class_id,
          s.subject_code AS code,
          s.subject_description AS \`desc\`,
          s.subject_description AS description,
          s.units,
          s.semester,
          s.subject_type,
          s.level_category,
          ca.school_year,
          g.quarter,
          g.written,
          g.performance,
          g.exam,
          g.prelim,
          g.midterm,
          g.finals,
          g.initial_grade,
          g.final_grade,
          g.descriptive_grade,
          g.descriptor,
          g.remarks,
          g.details_json,
          CONCAT_WS(' ', t.first_name, t.last_name) AS teacher_name
      FROM class_assignments ca
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN users t ON ca.teacher_id = t.id
      LEFT JOIN student_grades g ON g.class_id = ca.id AND g.student_id IN (?)
      WHERE ca.section_id = ?
         OR ca.id IN (SELECT ec.class_assignment_id FROM enrolled_classes ec WHERE ec.student_id IN (?) AND ec.status = 'Enrolled')
         OR ca.id IN (SELECT sg2.class_id FROM student_grades sg2 WHERE sg2.student_id IN (?))
      ORDER BY s.subject_code ASC, g.quarter ASC
    `;

    const [rows] = await pool.query(gradeQuery, [
      idCandidates,
      studentRecord.section_id || 0,
      idCandidates,
      idCandidates
    ]);

    // Group by subject code to construct the q1, q2, q3, q4 format expected by the frontend table
    const grouped = {};
    for (const row of rows) {
      const key = row.code;
      if (!grouped[key]) {
        grouped[key] = {
          class_id: row.class_id,
          code: row.code,
          desc: row.desc,
          title: row.desc,
          units: row.units || 3,
          q1: '',
          q2: '',
          q3: '',
          q4: '',
          q1_desc: '',
          q2_desc: '',
          q3_desc: '',
          q4_desc: '',
          final: '',
          descriptive_final: '',
          descriptor: '',
          remarks: 'Pending',
          semester: row.semester || '1st',
          teacher_name: row.teacher_name || 'TBA'
        };
      }

      const numVal = row.final_grade !== null && row.final_grade !== undefined && Number(row.final_grade) > 0
        ? String(Math.round(Number(row.final_grade)))
        : '';
      const letterVal = row.descriptive_grade || '';
      const displayVal = numVal || letterVal;

      if (row.quarter === 1) {
        grouped[key].q1 = displayVal;
        grouped[key].q1_desc = letterVal;
      } else if (row.quarter === 2) {
        grouped[key].q2 = displayVal;
        grouped[key].q2_desc = letterVal;
      } else if (row.quarter === 3) {
        grouped[key].q3 = displayVal;
        grouped[key].q3_desc = letterVal;
      } else if (row.quarter === 4) {
        grouped[key].q4 = displayVal;
        grouped[key].q4_desc = letterVal;
      } else if (row.quarter === null || row.quarter === 0) {
        if (row.prelim !== null || row.midterm !== null || row.finals !== null || displayVal) {
          grouped[key].q1 = row.prelim !== null && row.prelim !== undefined ? String(row.prelim) : '';
          grouped[key].q2 = row.midterm !== null && row.midterm !== undefined ? String(row.midterm) : '';
          grouped[key].q3 = row.finals !== null && row.finals !== undefined ? String(row.finals) : '';
          grouped[key].final = displayVal;
          grouped[key].descriptive_final = letterVal;
          grouped[key].descriptor = row.descriptor || '';
          grouped[key].remarks = row.remarks || (Number(row.final_grade) >= 75 ? 'Passed' : (displayVal ? 'Completed' : 'Pending'));
        }
      }

      if (row.descriptor) {
        grouped[key].descriptor = row.descriptor;
      }
      if (row.remarks && row.remarks !== 'Pending') {
        grouped[key].remarks = row.remarks;
      }
    }

    // Compute final grades and remarks for K-12 rows
    for (const key in grouped) {
      const g = grouped[key];
      if (g.final === '') {
        const rawQuarters = [g.q1, g.q2, g.q3, g.q4].filter(val => val !== '');
        const numericQuarters = rawQuarters.filter(val => !isNaN(Number(val)) && Number(val) > 0).map(Number);
        const letterQuarters = rawQuarters.filter(val => LETTER_TO_NUM[String(val).toUpperCase()]);

        if (numericQuarters.length > 0) {
          const avg = numericQuarters.reduce((a, b) => a + b, 0) / numericQuarters.length;
          const rounded = Math.round(avg);
          g.final = String(rounded);
          g.descriptive_final = NUM_TO_LETTER(rounded);
          g.remarks = rounded >= 75 ? 'Passed' : 'Failed';
        } else if (letterQuarters.length > 0) {
          const avg = letterQuarters.reduce((a, b) => a + LETTER_TO_NUM[String(b).toUpperCase()], 0) / letterQuarters.length;
          const finalLetter = NUM_TO_LETTER(Math.round(avg));
          g.final = finalLetter;
          g.descriptive_final = finalLetter;
          g.remarks = finalLetter === 'E' ? 'Needs Support' : 'Passed';
        } else {
          g.final = '';
          g.remarks = 'Pending';
        }
      }
    }

    const formattedGrades = Object.values(grouped);

    formattedGrades.sort((a, b) => {
      const semA = a.semester || '';
      const semB = b.semester || '';
      if (semA !== semB) return semA.localeCompare(semB);
      return a.code.localeCompare(b.code);
    });

    return res.json({
      status: "success",
      school_year: targetSy || '2026-2027',
      student: studentRecord,
      raw_grades: rows || [],
      data: formattedGrades
    });

  } catch (error) {
    console.error("Get grades error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default getGrades;
