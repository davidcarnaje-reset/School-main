import pool from '../../config/db.js';

const getStudentGrades = async (req, res) => {
  const { email, sy } = req.query;

  if (!email) {
    return res.status(400).json({ status: "error", message: "Email is required." });
  }

  try {
    // 1. Kunin ang student_id at ang latest school year kung walang pinasa na SY
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

    if (!student) {
      return res.json({ status: "error", message: "Student not found." });
    }

    const student_id = student.student_id;
    const target_sy = sy ? sy : student.school_year;

    // 2. Kunin ang grades
    const gradeQuery = `
      SELECT 
          s.subject_code AS code,
          s.subject_description AS \`desc\`,
          g.first_quarter AS q1,
          g.second_quarter AS q2,
          g.third_quarter AS q3,
          g.fourth_quarter AS q4,
          g.final_grade AS final,
          g.remarks
      FROM enrolled_classes ec
      JOIN class_assignments ca ON ec.class_assignment_id = ca.id
      JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN student_grades g ON g.student_id = ec.student_id AND g.class_id = ca.id
      WHERE ec.student_id = ? 
        AND ca.school_year = ?
        AND ec.status = 'Enrolled'
    `;
    const [grades] = await pool.query(gradeQuery, [student_id, target_sy]);

    // 3. I-format ang null values bilang empty strings upang hindi mag-crash ang React frontend
    const formattedGrades = grades.map(grade => ({
      code: grade.code,
      desc: grade.desc,
      q1: grade.q1 !== null && grade.q1 !== undefined ? grade.q1 : '',
      q2: grade.q2 !== null && grade.q2 !== undefined ? grade.q2 : '',
      q3: grade.q3 !== null && grade.q3 !== undefined ? grade.q3 : '',
      q4: grade.q4 !== null && grade.q4 !== undefined ? grade.q4 : '',
      final: grade.final !== null && grade.final !== undefined ? grade.final : '',
      remarks: grade.remarks || 'Pending'
    }));

    return res.json({
      status: "success",
      school_year: target_sy,
      data: formattedGrades
    });

  } catch (error) {
    console.error("Get student grades error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default getStudentGrades;
