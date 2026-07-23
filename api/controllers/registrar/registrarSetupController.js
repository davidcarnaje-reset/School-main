import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// ============================================================
// 1. STUDENT TOR (TRANSCRIPT OF RECORDS)
// ============================================================
export const getStudentTOR = async (req, res) => {
  try {
    const { student_id } = req.query;
    const schoolId = req.school_id || 1;

    if (!student_id) {
      return res.status(400).json({ status: 'error', message: "Student ID is required." });
    }

    // 1. Get Student Details
    const [stdRows] = await pool.query(
      `SELECT s.id, s.student_id, s.first_name, s.middle_name, s.last_name, s.lrn, s.dob, s.gender,
              s.mobile_no as phone_number, s.email,
              e.grade_level, e.school_year, e.semester, e.status as enrollment_status,
              COALESCE(ap.program_code, 'K-12 Basic Ed') as program_code,
              COALESCE(ap.program_description, 'Basic Education Program') as program_name,
              CASE
                 WHEN e.grade_level LIKE '%College%' THEN 'College'
                 WHEN e.grade_level LIKE '%11%' OR e.grade_level LIKE '%12%' THEN 'SHS'
                 ELSE 'K-10'
              END AS department
       FROM students s
       LEFT JOIN enrollments e ON s.student_id = e.student_id
       LEFT JOIN academic_programs ap ON e.program_id = ap.id
       WHERE s.student_id = ? OR s.id = ?
       ORDER BY e.created_at DESC LIMIT 1`,
      [student_id, student_id]
    );

    if (stdRows.length === 0) {
      return res.status(404).json({ status: 'error', message: "Student record not found." });
    }

    const student = stdRows[0];

    // 2. Fetch All Recorded Grades Across Terms
    const [gradeRows] = await pool.query(
      `SELECT sg.id, sg.class_id, sg.quarter, sg.final_grade, sg.remarks,
              sub.subject_code, sub.subject_description, sub.units,
              ca.school_year, ca.semester, ca.grade_level,
              COALESCE(sec.section_name, 'Unassigned') as section_name
       FROM student_grades sg
       JOIN class_assignments ca ON sg.class_id = ca.id
       JOIN subjects sub ON ca.subject_id = sub.id
       LEFT JOIN sections sec ON ca.section_id = sec.id
       WHERE sg.student_id = ? OR sg.student_id = ?
       ORDER BY ca.school_year ASC, ca.semester ASC, sub.subject_code ASC`,
      [student.student_id, student.id]
    );

    // 3. Compute Summary Statistics (Total Units, GWA/GPA)
    let totalUnitsEarned = 0;
    let weightedGradeSum = 0;
    let gradedUnits = 0;

    const formattedGrades = gradeRows.map(g => {
      const numericGrade = parseFloat(g.final_grade);
      const units = parseFloat(g.units) || 3.0;

      if (!isNaN(numericGrade) && numericGrade > 0) {
        weightedGradeSum += (numericGrade * units);
        gradedUnits += units;
        if (numericGrade <= 75 || numericGrade <= 3.0) {
          totalUnitsEarned += units;
        }
      }

      return {
        id: g.id,
        class_id: g.class_id,
        subject_code: g.subject_code,
        subject_description: g.subject_description,
        units: units,
        quarter: g.quarter,
        final_grade: g.final_grade,
        remarks: g.remarks || (numericGrade >= 75 || numericGrade <= 3.0 ? 'Passed' : 'Failed'),
        school_year: g.school_year || student.school_year || '2025-2026',
        semester: g.semester || '1st',
        section_name: g.section_name
      };
    });

    const gwa = gradedUnits > 0 ? (weightedGradeSum / gradedUnits).toFixed(2) : 'N/A';

    return res.json({
      status: 'success',
      data: {
        student,
        grades: formattedGrades,
        summary: {
          gwa,
          total_units_earned: totalUnitsEarned || gradedUnits,
          total_subjects: formattedGrades.length
        }
      }
    });
  } catch (error) {
    console.error("getStudentTOR error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 2. GRADE TEMPLATES CRUD
// ============================================================
export const getGradeTemplates = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      `SELECT * FROM grade_templates WHERE school_id = ? ORDER BY department ASC, id ASC`,
      [schoolId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error("getGradeTemplates error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const saveGradeTemplate = async (req, res) => {
  try {
    const { id, department, template_name, written_weight, performance_weight, exam_weight, transmutation_json, status } = req.body;
    const schoolId = req.school_id || 1;

    if (!department || !template_name) {
      return res.status(400).json({ status: 'error', message: "Department and template name are required." });
    }

    const wWeight = parseInt(written_weight, 10) || 30;
    const pWeight = parseInt(performance_weight, 10) || 50;
    const eWeight = parseInt(exam_weight, 10) || 20;

    if (wWeight + pWeight + eWeight !== 100) {
      return res.status(400).json({ status: 'error', message: "Weights must sum to exactly 100%." });
    }

    if (id) {
      await pool.query(
        `UPDATE grade_templates SET
           department = ?, template_name = ?, written_weight = ?, 
           performance_weight = ?, exam_weight = ?, transmutation_json = ?, status = ?
         WHERE id = ? AND school_id = ?`,
        [department, template_name, wWeight, pWeight, eWeight, JSON.stringify(transmutation_json || null), status || 'Active', id, schoolId]
      );
    } else {
      await pool.query(
        `INSERT INTO grade_templates 
           (school_id, department, template_name, written_weight, performance_weight, exam_weight, transmutation_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [schoolId, department, template_name, wWeight, pWeight, eWeight, JSON.stringify(transmutation_json || null), status || 'Active']
      );
    }

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "SAVE_GRADE_TEMPLATE",
      `Saved grade template: ${template_name} (${department})`,
      req
    );

    return res.json({ status: 'success', message: "Grade template saved successfully." });
  } catch (error) {
    console.error("saveGradeTemplate error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteGradeTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school_id || 1;

    await pool.query("DELETE FROM grade_templates WHERE id = ? AND school_id = ?", [id, schoolId]);

    return res.json({ status: 'success', message: "Grade template deleted successfully." });
  } catch (error) {
    console.error("deleteGradeTemplate error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 3. GRADE SETTINGS & RELEASING (BULK & INDIVIDUAL)
// ============================================================
export const getGradeReleaseSettings = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [settings] = await pool.query(
      `SELECT * FROM grade_release_settings WHERE school_id = ? ORDER BY id DESC`,
      [schoolId]
    );

    const [individualReleases] = await pool.query(
      `SELECT sgr.*, s.first_name, s.last_name, COALESCE(ap.program_code, e.grade_level) as program
       FROM student_grade_releases sgr
       LEFT JOIN students s ON sgr.student_id = s.student_id OR sgr.student_id = CAST(s.id AS CHAR)
       LEFT JOIN enrollments e ON s.student_id = e.student_id
       LEFT JOIN academic_programs ap ON e.program_id = ap.id
       WHERE sgr.school_id = ?
       ORDER BY sgr.released_at DESC LIMIT 50`,
      [schoolId]
    );

    return res.json({
      status: 'success',
      data: {
        settings,
        individual_releases: individualReleases
      }
    });
  } catch (error) {
    console.error("getGradeReleaseSettings error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const toggleGradeRelease = async (req, res) => {
  try {
    const { mode, department, school_year, quarter, is_released, student_id } = req.body;
    const schoolId = req.school_id || 1;
    const userEmail = req.user?.email || 'Registrar';

    if (mode === 'bulk') {
      if (!department) {
        return res.status(400).json({ status: 'error', message: "Department is required for bulk release." });
      }

      await pool.query(
        `INSERT INTO grade_release_settings (school_id, department, school_year, quarter, release_mode, is_released, released_at, released_by)
         VALUES (?, ?, ?, ?, 'bulk', ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE 
           is_released = VALUES(is_released), 
           released_at = NOW(), 
           released_by = VALUES(released_by)`,
        [schoolId, department, school_year || '2025-2026', quarter || '1', is_released ? 1 : 0, userEmail]
      );

      await logAuditTrail(
        req.user?.id || 1,
        req.user?.role || 'Registrar',
        "TOGGLE_BULK_GRADE_RELEASE",
        `Bulk grade release ${is_released ? 'ENABLED' : 'DISABLED'} for ${department} (Quarter ${quarter})`,
        req
      );

      return res.json({ 
        status: 'success', 
        message: `Grades ${is_released ? 'released in bulk' : 'withheld'} for ${department} (Quarter ${quarter}).` 
      });
    } else if (mode === 'individual') {
      if (!student_id) {
        return res.status(400).json({ status: 'error', message: "Student ID is required for individual release." });
      }

      await pool.query(
        `INSERT INTO student_grade_releases (school_id, student_id, school_year, quarter, is_released, released_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE is_released = VALUES(is_released), released_at = NOW()`,
        [schoolId, student_id, school_year || '2025-2026', quarter || '1', is_released ? 1 : 0]
      );

      await logAuditTrail(
        req.user?.id || 1,
        req.user?.role || 'Registrar',
        "TOGGLE_INDIVIDUAL_GRADE_RELEASE",
        `Individual grade release ${is_released ? 'ENABLED' : 'DISABLED'} for Student: ${student_id}`,
        req
      );

      return res.json({
        status: 'success',
        message: `Grade release ${is_released ? 'enabled' : 'disabled'} for Student ID: ${student_id}.`
      });
    }

    return res.status(400).json({ status: 'error', message: "Invalid release mode specified." });
  } catch (error) {
    console.error("toggleGradeRelease error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 4. CERTIFICATE TEMPLATE BUILDER CRUD & GENERATOR
// ============================================================
export const getCertificateTemplates = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      `SELECT * FROM certificate_templates WHERE school_id = ? ORDER BY id DESC`,
      [schoolId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error("getCertificateTemplates error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const saveCertificateTemplate = async (req, res) => {
  try {
    const { 
      id, template_name, certificate_type, header_title, body_content, 
      signatory_1_name, signatory_1_title, signatory_2_name, signatory_2_title, is_active 
    } = req.body;
    const schoolId = req.school_id || 1;

    if (!template_name || !certificate_type || !body_content) {
      return res.status(400).json({ status: 'error', message: "Template name, type, and body content are required." });
    }

    if (id) {
      await pool.query(
        `UPDATE certificate_templates SET
           template_name = ?, certificate_type = ?, header_title = ?, body_content = ?,
           signatory_1_name = ?, signatory_1_title = ?, signatory_2_name = ?, signatory_2_title = ?,
           is_active = ?
         WHERE id = ? AND school_id = ?`,
        [
          template_name, certificate_type, header_title || 'OFFICE OF THE REGISTRAR', body_content,
          signatory_1_name || 'Jane Doe, LPT', signatory_1_title || 'School Registrar',
          signatory_2_name || null, signatory_2_title || null,
          is_active !== undefined ? (is_active ? 1 : 0) : 1,
          id, schoolId
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO certificate_templates (
           school_id, template_name, certificate_type, header_title, body_content,
           signatory_1_name, signatory_1_title, signatory_2_name, signatory_2_title, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId, template_name, certificate_type, header_title || 'OFFICE OF THE REGISTRAR', body_content,
          signatory_1_name || 'Jane Doe, LPT', signatory_1_title || 'School Registrar',
          signatory_2_name || null, signatory_2_title || null,
          is_active !== undefined ? (is_active ? 1 : 0) : 1
        ]
      );
    }

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "SAVE_CERTIFICATE_TEMPLATE",
      `Saved certificate template: ${template_name}`,
      req
    );

    return res.json({ status: 'success', message: "Certificate template saved successfully." });
  } catch (error) {
    console.error("saveCertificateTemplate error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteCertificateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school_id || 1;

    await pool.query("DELETE FROM certificate_templates WHERE id = ? AND school_id = ?", [id, schoolId]);

    return res.json({ status: 'success', message: "Certificate template deleted." });
  } catch (error) {
    console.error("deleteCertificateTemplate error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const generateCertificate = async (req, res) => {
  try {
    const { template_id, student_id } = req.body;
    const schoolId = req.school_id || 1;

    if (!template_id || !student_id) {
      return res.status(400).json({ status: 'error', message: "Template ID and Student ID are required." });
    }

    // 1. Fetch Template
    const [tmplRows] = await pool.query(
      "SELECT * FROM certificate_templates WHERE id = ? AND school_id = ?",
      [template_id, schoolId]
    );

    if (tmplRows.length === 0) {
      return res.status(404).json({ status: 'error', message: "Certificate template not found." });
    }

    const tmpl = tmplRows[0];

    // 2. Fetch Student Details
    const [stdRows] = await pool.query(
      `SELECT s.*, e.grade_level, e.school_year, COALESCE(ap.program_description, ap.program_code, 'Basic Education') as program
       FROM students s
       LEFT JOIN enrollments e ON s.student_id = e.student_id
       LEFT JOIN academic_programs ap ON e.program_id = ap.id
       WHERE s.student_id = ? OR s.id = ? ORDER BY e.created_at DESC LIMIT 1`,
      [student_id, student_id]
    );

    if (stdRows.length === 0) {
      return res.status(404).json({ status: 'error', message: "Student record not found." });
    }

    const std = stdRows[0];
    const fullName = `${std.first_name || ''} ${std.middle_name ? std.middle_name + ' ' : ''}${std.last_name || ''}`.trim();
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // 3. Resolve Dynamic Tokens
    let resolvedBody = tmpl.body_content
      .replace(/\{student_name\}/gi, fullName)
      .replace(/\{student_id\}/gi, std.student_id || std.id)
      .replace(/\{program\}/gi, std.program || 'Basic Education Program')
      .replace(/\{grade_level\}/gi, std.grade_level || 'K-12')
      .replace(/\{school_year\}/gi, std.school_year || '2025-2026')
      .replace(/\{date_issued\}/gi, formattedDate);

    return res.json({
      status: 'success',
      certificate: {
        header_title: tmpl.header_title,
        body_content: resolvedBody,
        signatory_1_name: tmpl.signatory_1_name,
        signatory_1_title: tmpl.signatory_1_title,
        signatory_2_name: tmpl.signatory_2_name,
        signatory_2_title: tmpl.signatory_2_title,
        date_issued: formattedDate,
        student_name: fullName
      }
    });
  } catch (error) {
    console.error("generateCertificate error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
