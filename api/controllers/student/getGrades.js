import pool from '../../config/db.js';

/**
 * Migrated from get_student_grades.php
 * Retrieves academic grades for a student, supporting lookup by student_id or email,
 * and formats the grades according to the legacy frontend structure.
 */
const getGrades = async (req, res) => {
  const { student_id, email, sy } = req.query;

  let targetStudentId = student_id;
  let targetSy = sy;

  try {
    // 1. Resolve student_id and school_year from email if student_id is not passed
    if (!targetStudentId && email) {
      const studentQuery = `
        SELECT s.student_id, e.school_year 
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        WHERE s.email = ?
        ORDER BY e.id DESC 
        LIMIT 1
      `;
      const [studentRows] = await pool.query(studentQuery, [email]);
      const student = studentRows[0];

      if (student) {
        targetStudentId = student.student_id;
        if (!targetSy) {
          targetSy = student.school_year;
        }
      }
    }

    if (!targetStudentId) {
      return res.status(400).json({ status: "error", message: "student_id or email is required." });
    }

    // 2. If school_year is still not resolved, get the latest school year from their enrollment
    if (!targetSy) {
      const [enrollmentRows] = await pool.query(
        "SELECT school_year FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1",
        [targetStudentId]
      );
      if (enrollmentRows.length > 0) {
        targetSy = enrollmentRows[0].school_year;
      }
    }

    // 3. Query the student's enrolled classes, subjects, and grade records
    const gradeQuery = `
      SELECT 
          s.subject_code AS code,
          s.subject_description AS \`desc\`,
          s.semester,
          ca.school_year,
          g.quarter,
          g.prelim,
          g.midterm,
          g.finals,
          g.final_grade,
          g.remarks
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN student_grades g ON g.student_id = ec.student_id AND g.class_id = ca.id
      WHERE ec.student_id = ? 
        ${targetSy ? 'AND ca.school_year = ?' : ''}
        AND ec.status = 'Enrolled'
    `;

    const queryParams = [targetStudentId];
    if (targetSy) {
      queryParams.push(targetSy);
    }

    const [rows] = await pool.query(gradeQuery, queryParams);

    // 4. Group by subject code to construct the q1, q2, q3, q4 format expected by the frontend
    const grouped = {};
    for (const row of rows) {
      const key = row.code;
      if (!grouped[key]) {
        grouped[key] = {
          code: row.code,
          desc: row.desc,
          q1: '',
          q2: '',
          q3: '',
          q4: '',
          final: '',
          remarks: 'Pending',
          semester: row.semester || '1st'
        };
      }

      if (row.quarter === 1) {
        grouped[key].q1 = row.final_grade !== null && row.final_grade !== undefined ? String(row.final_grade) : '';
      } else if (row.quarter === 2) {
        grouped[key].q2 = row.final_grade !== null && row.final_grade !== undefined ? String(row.final_grade) : '';
      } else if (row.quarter === 3) {
        grouped[key].q3 = row.final_grade !== null && row.final_grade !== undefined ? String(row.final_grade) : '';
      } else if (row.quarter === 4) {
        grouped[key].q4 = row.final_grade !== null && row.final_grade !== undefined ? String(row.final_grade) : '';
      } else if (row.quarter === null || row.quarter === 0) {
        // College mapping: prelim -> q1, midterm -> q2, finals -> q3
        grouped[key].q1 = row.prelim !== null && row.prelim !== undefined ? String(row.prelim) : '';
        grouped[key].q2 = row.midterm !== null && row.midterm !== undefined ? String(row.midterm) : '';
        grouped[key].q3 = row.finals !== null && row.finals !== undefined ? String(row.finals) : '';
        grouped[key].q4 = '';
        grouped[key].final = row.final_grade !== null && row.final_grade !== undefined ? String(row.final_grade) : '';
        grouped[key].remarks = row.remarks || (Number(row.final_grade) >= 75 ? 'Passed' : 'Failed');
      }
    }

    // 5. Compute final grades and remarks for high school rows where final is not explicitly set
    for (const key in grouped) {
      const g = grouped[key];
      if (g.final === '') {
        const qVals = [g.q1, g.q2, g.q3, g.q4].filter(val => val !== '').map(Number);
        if (qVals.length > 0) {
          const avg = qVals.reduce((a, b) => a + b, 0) / qVals.length;
          g.final = String(Math.round(avg));
          g.remarks = avg >= 75 ? 'Passed' : 'Failed';
        } else {
          g.final = '';
          g.remarks = 'Pending';
        }
      }
    }

    const formattedGrades = Object.values(grouped);

    // 6. Sort grades by semester, then by subject code
    formattedGrades.sort((a, b) => {
      const semA = a.semester || '';
      const semB = b.semester || '';
      if (semA !== semB) {
        return semA.localeCompare(semB);
      }
      return a.code.localeCompare(b.code);
    });

    return res.json({
      status: "success",
      school_year: targetSy || 'N/A',
      data: formattedGrades
    });

  } catch (error) {
    console.error("Get grades error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default getGrades;
