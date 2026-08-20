import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// ============================================================
// 1. COUNSELOR DASHBOARD STATS
// ============================================================
export const getCounselorDashboardStats = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;

    // Active Cases count
    const [activeCases] = await pool.query(
      "SELECT COUNT(*) as count FROM guidance_cases WHERE school_id = ? AND status = 'Active'",
      [schoolId]
    );

    // Pending Appointments count
    const [pendingAppts] = await pool.query(
      "SELECT COUNT(*) as count FROM guidance_appointments WHERE school_id = ? AND status = 'Pending'",
      [schoolId]
    );

    // Unresolved incidents count
    const [unresolvedIncidents] = await pool.query(
      "SELECT COUNT(*) as count FROM guidance_incidents WHERE school_id = ? AND status NOT IN ('Action Taken', 'Archived')",
      [schoolId]
    );

    // Total test results taken
    const [totalTests] = await pool.query(
      "SELECT COUNT(*) as count FROM guidance_test_results WHERE school_id = ?",
      [schoolId]
    );

    // Recent Incidents
    const [recentIncidents] = await pool.query(`
      SELECT 
        gi.id, 
        gi.student_id, 
        DATE_FORMAT(gi.incident_date, '%Y-%m-%d') as incident_date, 
        gi.details, 
        gi.is_anonymous, 
        gi.status,
        CASE WHEN gi.is_anonymous = 1 THEN 'Anonymous Student' 
             ELSE CONCAT(s.first_name, ' ', s.last_name) 
        END as student_name
      FROM guidance_incidents gi
      LEFT JOIN students s ON gi.student_id = s.student_id
      WHERE gi.school_id = ?
      ORDER BY gi.id DESC LIMIT 5
    `, [schoolId]);

    // Upcoming Appointments
    const [upcomingAppts] = await pool.query(`
      SELECT 
        ga.id, 
        ga.student_id, 
        DATE_FORMAT(ga.appointment_date, '%Y-%m-%d') as appointment_date, 
        ga.appointment_time, 
        ga.reason, 
        ga.status,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM guidance_appointments ga
      LEFT JOIN students s ON ga.student_id = s.student_id
      WHERE ga.school_id = ? AND ga.status = 'Approved'
      ORDER BY ga.appointment_date ASC, ga.appointment_time ASC LIMIT 5
    `, [schoolId]);

    return res.json({
      success: true,
      data: {
        stats: {
          activeCases: activeCases[0].count,
          pendingAppointments: pendingAppts[0].count,
          unresolvedIncidents: unresolvedIncidents[0].count,
          totalTestsTaken: totalTests[0].count
        },
        recentIncidents,
        upcomingAppointments: upcomingAppts
      }
    });
  } catch (error) {
    console.error("getCounselorDashboardStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 2. COUNSELING CASES MANAGEMENT
// ============================================================
export const getCases = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        gc.id, 
        gc.student_id, 
        gc.counselor_id, 
        gc.case_title, 
        gc.case_type, 
        gc.severity, 
        gc.status, 
        gc.notes,
        DATE_FORMAT(gc.created_at, '%Y-%m-%d') as created_at,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.grade_level,
        s.program_code
      FROM guidance_cases gc
      LEFT JOIN students s ON gc.student_id = s.student_id
      WHERE gc.school_id = ?
      ORDER BY gc.id DESC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getCases error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCase = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, case_title, case_type, severity, notes } = req.body;

    if (!student_id || !case_title || !case_type) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const [result] = await pool.query(`
      INSERT INTO guidance_cases (school_id, student_id, counselor_id, case_title, case_type, severity, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `, [schoolId, student_id, req.user?.id || null, case_title, case_type, severity || 'Medium', notes || null]);

    return res.json({ success: true, message: "Guidance case created successfully.", caseId: result.insertId });
  } catch (error) {
    console.error("createCase error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, severity, notes } = req.body;

    await pool.query(
      "UPDATE guidance_cases SET status = COALESCE(?, status), severity = COALESCE(?, severity), notes = COALESCE(?, notes) WHERE id = ?",
      [status, severity, notes, id]
    );

    return res.json({ success: true, message: "Case updated successfully." });
  } catch (error) {
    console.error("updateCaseStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCaseSessions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const [rows] = await pool.query(
      "SELECT id, case_id, DATE_FORMAT(session_date, '%Y-%m-%d') as session_date, action_plan, remarks, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at FROM guidance_sessions WHERE case_id = ? ORDER BY id DESC",
      [caseId]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getCaseSessions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addSessionNote = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { session_date, action_plan, remarks } = req.body;

    if (!session_date) {
      return res.status(400).json({ success: false, message: "Session date is required." });
    }

    await pool.query(
      "INSERT INTO guidance_sessions (case_id, session_date, action_plan, remarks) VALUES (?, ?, ?, ?)",
      [caseId, session_date, action_plan || null, remarks || null]
    );

    return res.json({ success: true, message: "Session note added successfully." });
  } catch (error) {
    console.error("addSessionNote error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 3. COUNSELING APPOINTMENTS
// ============================================================
export const getAppointments = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        ga.id, 
        ga.student_id, 
        DATE_FORMAT(ga.appointment_date, '%Y-%m-%d') as appointment_date, 
        ga.appointment_time, 
        ga.reason, 
        ga.status, 
        ga.remarks,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.grade_level,
        s.program_code
      FROM guidance_appointments ga
      LEFT JOIN students s ON ga.student_id = s.student_id
      WHERE ga.school_id = ?
      ORDER BY ga.appointment_date DESC, ga.appointment_time DESC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getAppointments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    await pool.query(
      "UPDATE guidance_appointments SET status = ?, remarks = COALESCE(?, remarks) WHERE id = ?",
      [status, remarks || null, id]
    );

    return res.json({ success: true, message: `Appointment status set to ${status}.` });
  } catch (error) {
    console.error("updateAppointmentStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAppointments = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    let studentId = req.query.student_id;

    if (!studentId) {
      // Fallback using logged-in email context if student_id parameter is absent
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        studentId = studentRows[0].student_id;
      }
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: "student_id parameter is required." });
    }

    const [rows] = await pool.query(
      "SELECT id, DATE_FORMAT(appointment_date, '%Y-%m-%d') as appointment_date, appointment_time, reason, status, remarks FROM guidance_appointments WHERE school_id = ? AND student_id = ? ORDER BY appointment_date DESC",
      [schoolId, studentId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getStudentAppointments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, appointment_date, appointment_time, reason } = req.body;

    let targetStudentId = student_id;

    if (!targetStudentId) {
      // Fallback
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        targetStudentId = studentRows[0].student_id;
      }
    }

    if (!targetStudentId || !appointment_date || !appointment_time || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields (student_id, date, time, reason)." });
    }

    await pool.query(
      "INSERT INTO guidance_appointments (school_id, student_id, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [schoolId, targetStudentId, appointment_date, appointment_time, reason]
    );

    return res.json({ success: true, message: "Counseling appointment request submitted successfully." });
  } catch (error) {
    console.error("bookAppointment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 4. PSYCHOLOGICAL TESTS / ASSESSMENTS
// ============================================================
export const submitTestResults = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, test_type, raw_scores_json, personality_type } = req.body;

    let targetStudentId = student_id;

    if (!targetStudentId) {
      // Fallback
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        targetStudentId = studentRows[0].student_id;
      }
    }

    if (!targetStudentId || !test_type || !raw_scores_json || !personality_type) {
      return res.status(400).json({ success: false, message: "Missing required test metadata." });
    }

    await pool.query(
      "INSERT INTO guidance_test_results (school_id, student_id, test_type, raw_scores_json, personality_type) VALUES (?, ?, ?, ?, ?)",
      [schoolId, targetStudentId, test_type, JSON.stringify(raw_scores_json), personality_type]
    );

    return res.json({ success: true, message: "Psychological test assessment results submitted successfully." });
  } catch (error) {
    console.error("submitTestResults error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentTestResults = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    let studentId = req.query.student_id;

    if (!studentId) {
      // Fallback
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        studentId = studentRows[0].student_id;
      }
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: "student_id parameter is required." });
    }

    const [rows] = await pool.query(
      "SELECT id, test_type, raw_scores_json, personality_type, DATE_FORMAT(taken_at, '%Y-%m-%d %H:%i:%s') as taken_at FROM guidance_test_results WHERE school_id = ? AND student_id = ? ORDER BY id DESC",
      [schoolId, studentId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getStudentTestResults error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTestResults = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        gtr.id, 
        gtr.student_id, 
        gtr.test_type, 
        gtr.raw_scores_json, 
        gtr.personality_type, 
        DATE_FORMAT(gtr.taken_at, '%Y-%m-%d %H:%i:%s') as taken_at,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.grade_level,
        s.program_code
      FROM guidance_test_results gtr
      LEFT JOIN students s ON gtr.student_id = s.student_id
      WHERE gtr.school_id = ?
      ORDER BY gtr.id DESC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getAllTestResults error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 5. INCIDENT REPORTS (Bullying, distressed flags)
// ============================================================
export const getIncidents = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        gi.id, 
        gi.student_id, 
        DATE_FORMAT(gi.incident_date, '%Y-%m-%d') as incident_date, 
        gi.details, 
        gi.is_anonymous, 
        gi.status, 
        gi.remarks,
        DATE_FORMAT(gi.created_at, '%Y-%m-%d') as created_at,
        CASE WHEN gi.is_anonymous = 1 THEN 'Anonymous Student' 
             ELSE CONCAT(s.first_name, ' ', s.last_name) 
        END as student_name,
        CASE WHEN gi.is_anonymous = 1 THEN 'N/A' ELSE s.grade_level END as grade_level,
        CASE WHEN gi.is_anonymous = 1 THEN 'N/A' ELSE s.program_code END as program_code
      FROM guidance_incidents gi
      LEFT JOIN students s ON gi.student_id = s.student_id
      WHERE gi.school_id = ?
      ORDER BY gi.id DESC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getIncidents error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createIncident = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, incident_date, details, is_anonymous } = req.body;

    let targetStudentId = student_id;

    if (!targetStudentId) {
      // Fallback
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        targetStudentId = studentRows[0].student_id;
      }
    }

    if (!targetStudentId || !incident_date || !details) {
      return res.status(400).json({ success: false, message: "Incident date, details, and student_id are required." });
    }

    await pool.query(
      "INSERT INTO guidance_incidents (school_id, student_id, incident_date, details, is_anonymous, status) VALUES (?, ?, ?, ?, ?, 'Reported')",
      [schoolId, targetStudentId, incident_date, details, is_anonymous ? 1 : 0]
    );

    return res.json({ success: true, message: "Incident log reported successfully to the guidance office." });
  } catch (error) {
    console.error("createIncident error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    await pool.query(
      "UPDATE guidance_incidents SET status = ?, remarks = COALESCE(?, remarks) WHERE id = ?",
      [status, remarks || null, id]
    );

    return res.json({ success: true, message: "Incident status updated successfully." });
  } catch (error) {
    console.error("updateIncidentStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
