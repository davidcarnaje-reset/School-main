import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

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
        COALESCE(e.section, 'TBA') AS section,
        COALESCE(ap.program_code, 'K-12 Basic Ed') AS program
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE 1=1
    `;

    const params = [];
    if (grade_level && grade_level !== 'All') {
      sql += ` AND e.grade_level = ?`;
      params.push(grade_level);
    }
    if (section && section !== 'All') {
      sql += ` AND e.section = ?`;
      params.push(section);
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
        e.section
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      WHERE 1=1
    `;

    const params = [];
    if (grade_level && grade_level !== 'All') {
      sql_students += ` AND e.grade_level = ?`;
      params.push(grade_level);
    }
    if (section && section !== 'All') {
      sql_students += ` AND e.section = ?`;
      params.push(section);
    }

    sql_students += ` ORDER BY s.gender DESC, s.last_name ASC`;

    const [students] = await pool.query(sql_students, params);

    // Compute grades for each student
    const resultData = await Promise.all(students.map(async (st) => {
      const [grades] = await pool.query(`
        SELECT sg.final_grade, sub.subject_code, sub.subject_description
        FROM student_grades sg
        JOIN class_assignments ca ON sg.class_id = ca.id
        JOIN subjects sub ON ca.subject_id = sub.id
        WHERE sg.student_id = ? AND sg.final_grade IS NOT NULL
      `, [st.student_id]);

      let gwa = 0;
      let status = 'Promoted';
      let failedCount = 0;

      if (grades.length > 0) {
        const total = grades.reduce((acc, g) => acc + parseFloat(g.final_grade || 0), 0);
        gwa = (total / grades.length).toFixed(2);
        
        failedCount = grades.filter(g => parseFloat(g.final_grade) < 75).length;
        if (failedCount >= 3) {
          status = 'Retained';
        } else if (failedCount > 0) {
          status = 'Conditional';
        }
      }

      // Level of Proficiency
      let level = 'Did Not Meet Expectations';
      const numGwa = parseFloat(gwa);
      if (numGwa >= 90) level = 'Outstanding (90-100)';
      else if (numGwa >= 85) level = 'Very Satisfactory (85-89)';
      else if (numGwa >= 80) level = 'Satisfactory (80-84)';
      else if (numGwa >= 75) level = 'Fairly Satisfactory (75-79)';

      return {
        ...st,
        gwa: grades.length > 0 ? gwa : 'N/A',
        status,
        failed_count: failedCount,
        proficiency_level: grades.length > 0 ? level : 'N/A'
      };
    }));

    return res.status(200).json({
      success: true,
      grade_level: grade_level || 'All',
      section: section || 'All',
      summary: {
        total: resultData.length,
        promoted: resultData.filter(r => r.status === 'Promoted').length,
        conditional: resultData.filter(r => r.status === 'Conditional').length,
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
// 3. GET FORM 138 (REPORT CARD)
// ====================================================
export const getForm138ReportCard = async (req, res) => {
  const { student_id } = req.query;

  if (!student_id) {
    return res.status(400).json({ success: false, message: "Student ID is required." });
  }

  try {
    const [studentRows] = await pool.query(`
      SELECT 
        s.student_id, s.lrn, s.first_name, s.middle_name, s.last_name, s.suffix, s.gender, s.dob,
        e.grade_level, COALESCE(e.section, 'TBA') AS section, e.school_year,
        COALESCE(ap.program_code, 'Basic Education') AS program
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ?
      ORDER BY e.created_at DESC LIMIT 1
    `, [student_id]);

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const student = studentRows[0];

    const [grades] = await pool.query(`
      SELECT 
        sub.subject_code,
        sub.subject_description,
        sg.quarter,
        sg.final_grade,
        sg.remarks
      FROM student_grades sg
      JOIN class_assignments ca ON sg.class_id = ca.id
      JOIN subjects sub ON ca.subject_id = sub.id
      WHERE sg.student_id = ?
      ORDER BY sub.subject_code ASC, sg.quarter ASC
    `, [student_id]);

    // Group grades per subject (Q1, Q2, Q3, Q4, Final)
    const subjectMap = {};
    grades.forEach(g => {
      if (!subjectMap[g.subject_code]) {
        subjectMap[g.subject_code] = {
          code: g.subject_code,
          description: g.subject_description,
          q1: null, q2: null, q3: null, q4: null,
          final_grade: null,
          remarks: 'PASSED'
        };
      }
      if (g.quarter === '1' || g.quarter === 1) subjectMap[g.subject_code].q1 = g.final_grade;
      if (g.quarter === '2' || g.quarter === 2) subjectMap[g.subject_code].q2 = g.final_grade;
      if (g.quarter === '3' || g.quarter === 3) subjectMap[g.subject_code].q3 = g.final_grade;
      if (g.quarter === '4' || g.quarter === 4) subjectMap[g.subject_code].q4 = g.final_grade;
      if (!g.quarter && g.final_grade) {
        subjectMap[g.subject_code].final_grade = g.final_grade;
        subjectMap[g.subject_code].remarks = parseFloat(g.final_grade) >= 75 ? 'PASSED' : 'FAILED';
      }
    });

    const subjectList = Object.values(subjectMap);

    // Compute General Average
    let generalAverage = 0;
    const validGrades = subjectList.filter(s => s.final_grade !== null);
    if (validGrades.length > 0) {
      const sum = validGrades.reduce((acc, curr) => acc + parseFloat(curr.final_grade), 0);
      generalAverage = (sum / validGrades.length).toFixed(2);
    }

    return res.status(200).json({
      success: true,
      student,
      subjects: subjectList,
      general_average: generalAverage > 0 ? generalAverage : 'N/A',
      promotion_status: generalAverage >= 75 ? 'PROMOTED TO NEXT GRADE LEVEL' : 'RETAINED'
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
        e.grade_level, COALESCE(e.section, 'TBA') AS section, e.school_year, e.enrollment_type, e.payment_plan,
        COALESCE(ap.program_code, 'Basic Education') AS program_code,
        COALESCE(ap.program_description, 'General Education Curriculum') AS program_desc
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      WHERE s.student_id = ?
      ORDER BY e.created_at DESC LIMIT 1
    `, [student_id]);

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const student = studentRows[0];

    // Get Enrolled Classes & Schedules
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
    `, [student_id]);

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
// 5. GET HONOR STUDENTS & DEAN'S LIST CALCULATOR
// ====================================================
export const getHonorStudents = async (req, res) => {
  const { grade_level } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id, s.lrn, s.first_name, s.middle_name, s.last_name, s.gender,
        e.grade_level, COALESCE(e.section, 'TBA') AS section,
        COALESCE(ap.program_code, 'Basic Ed') AS program
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
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
        SELECT sg.final_grade
        FROM student_grades sg
        WHERE sg.student_id = ? AND sg.final_grade IS NOT NULL
      `, [st.student_id]);

      if (grades.length === 0) continue;

      const numGrades = grades.map(g => parseFloat(g.final_grade));
      const hasFailingGrade = numGrades.some(g => g < 85); // DepEd rule: No grade below 85 for honors
      const total = numGrades.reduce((a, b) => a + b, 0);
      const gwa = parseFloat((total / numGrades.length).toFixed(2));

      if (gwa >= 90 && !hasFailingGrade) {
        let honorTitle = 'With Honors';
        if (gwa >= 98) honorTitle = 'With Highest Honors';
        else if (gwa >= 95) honorTitle = 'With High Honors';

        honorList.push({
          ...st,
          gwa,
          honor_title: honorTitle
        });
      }
    }

    honorList.sort((a, b) => b.gwa - a.gwa);

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
