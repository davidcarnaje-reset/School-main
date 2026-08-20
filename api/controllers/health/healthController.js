import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// ============================================================
// 1. NURSE DASHBOARD STATS
// ============================================================
export const getNnurseDashboardStats = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const today = new Date().toISOString().split('T')[0];

    // Visits Today count
    const [visitsToday] = await pool.query(
      "SELECT COUNT(*) as count FROM clinic_visits WHERE school_id = ? AND visit_date = ?",
      [schoolId, today]
    );

    // Total Health Profiles count
    const [totalProfiles] = await pool.query(
      "SELECT COUNT(*) as count FROM health_profiles WHERE school_id = ?",
      [schoolId]
    );

    // Shortage medicines (stock_qty < 10)
    const [shortageMeds] = await pool.query(
      "SELECT COUNT(*) as count FROM clinic_inventory WHERE school_id = ? AND stock_qty < 10",
      [schoolId]
    );

    // Total physical health checks recorded
    const [totalChecks] = await pool.query(
      "SELECT COUNT(*) as count FROM health_checks WHERE school_id = ?",
      [schoolId]
    );

    // Recent visits logs
    const [recentVisits] = await pool.query(`
      SELECT 
        cv.id, 
        cv.student_id, 
        DATE_FORMAT(cv.visit_date, '%Y-%m-%d') as visit_date, 
        cv.visit_time, 
        cv.complaint, 
        cv.treatment, 
        cv.outcome,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM clinic_visits cv
      LEFT JOIN students s ON cv.student_id = s.student_id
      WHERE cv.school_id = ?
      ORDER BY cv.id DESC LIMIT 5
    `, [schoolId]);

    // Medicine expiry alerts (expires in next 6 months)
    const [expiryAlerts] = await pool.query(`
      SELECT id, medicine_name, stock_qty, DATE_FORMAT(expiration_date, '%Y-%m-%d') as expiration_date
      FROM clinic_inventory
      WHERE school_id = ? AND expiration_date IS NOT NULL AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
      ORDER BY expiration_date ASC LIMIT 5
    `, [schoolId]);

    return res.json({
      success: true,
      data: {
        stats: {
          visitsToday: visitsToday[0].count,
          totalProfiles: totalProfiles[0].count,
          shortageMedicines: shortageMeds[0].count,
          totalPhysicalChecks: totalChecks[0].count
        },
        recentVisits,
        expiryAlerts
      }
    });
  } catch (error) {
    console.error("getNurseDashboardStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 2. STUDENT MEDICAL PROFILES
// ============================================================
export const getHealthProfiles = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.grade_level,
        s.program_code,
        hp.blood_type,
        hp.allergies,
        hp.chronic_illnesses,
        hp.emergency_contact_name,
        hp.emergency_contact_no
      FROM students s
      LEFT JOIN health_profiles hp ON s.student_id = hp.student_id AND hp.school_id = ?
      ORDER BY s.last_name ASC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getHealthProfiles error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveHealthProfile = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, blood_type, allergies, chronic_illnesses, emergency_contact_name, emergency_contact_no } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: "student_id is required." });
    }

    await pool.query(`
      INSERT INTO health_profiles (student_id, school_id, blood_type, allergies, chronic_illnesses, emergency_contact_name, emergency_contact_no)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        blood_type = VALUES(blood_type),
        allergies = VALUES(allergies),
        chronic_illnesses = VALUES(chronic_illnesses),
        emergency_contact_name = VALUES(emergency_contact_name),
        emergency_contact_no = VALUES(emergency_contact_no)
    `, [student_id, schoolId, blood_type || null, allergies || null, chronic_illnesses || null, emergency_contact_name || null, emergency_contact_no || null]);

    return res.json({ success: true, message: "Student medical profile saved successfully." });
  } catch (error) {
    console.error("saveHealthProfile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 3. PHYSICAL HEALTH CHECKS & BMI
// ============================================================
export const getHealthChecks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.query(
      "SELECT id, height, weight, bmi, blood_pressure, temperature, DATE_FORMAT(check_date, '%Y-%m-%d') as check_date, status, remarks FROM health_checks WHERE student_id = ? ORDER BY check_date DESC, id DESC",
      [studentId]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getHealthChecks error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createHealthCheck = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { student_id, height, weight, blood_pressure, temperature, check_date, remarks } = req.body;

    if (!student_id || !check_date) {
      return res.status(400).json({ success: false, message: "student_id and check_date are required." });
    }

    // Calculate BMI if height & weight are provided
    let bmiVal = null;
    let bmiStatus = 'Healthy';

    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      bmiVal = parseFloat(weight) / (heightInMeters * heightInMeters);
      bmiVal = parseFloat(bmiVal.toFixed(2));

      if (bmiVal < 18.5) {
        bmiStatus = 'Underweight';
      } else if (bmiVal >= 18.5 && bmiVal < 25) {
        bmiStatus = 'Healthy';
      } else if (bmiVal >= 25 && bmiVal < 30) {
        bmiStatus = 'Overweight';
      } else {
        bmiStatus = 'Needs Attention'; // Obese
      }
    }

    await pool.query(`
      INSERT INTO health_checks (school_id, student_id, height, weight, bmi, blood_pressure, temperature, check_date, status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [schoolId, student_id, height || null, weight || null, bmiVal, blood_pressure || null, temperature || null, check_date, bmiStatus, remarks || null]);

    return res.json({ success: true, message: "Physical health check recorded successfully.", bmi: bmiVal, status: bmiStatus });
  } catch (error) {
    console.error("createHealthCheck error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 4. CLINIC VISITS / SICK BAY LOGS
// ============================================================
export const getClinicVisits = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(`
      SELECT 
        cv.id, 
        cv.student_id, 
        DATE_FORMAT(cv.visit_date, '%Y-%m-%d') as visit_date, 
        cv.visit_time, 
        cv.complaint, 
        cv.treatment, 
        cv.medicine_dispensed, 
        cv.medicine_qty, 
        cv.outcome, 
        cv.remarks,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.grade_level,
        s.program_code
      FROM clinic_visits cv
      LEFT JOIN students s ON cv.student_id = s.student_id
      WHERE cv.school_id = ?
      ORDER BY cv.visit_date DESC, cv.visit_time DESC
    `, [schoolId]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getClinicVisits error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createClinicVisit = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = req.school_id || 1;
    const { student_id, visit_date, visit_time, complaint, treatment, medicine_dispensed, medicine_qty, outcome, remarks } = req.body;

    if (!student_id || !visit_date || !visit_time || !complaint) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    await connection.beginTransaction();

    // 1. Log visit record
    await connection.query(`
      INSERT INTO clinic_visits (school_id, student_id, visit_date, visit_time, complaint, treatment, medicine_dispensed, medicine_qty, outcome, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [schoolId, student_id, visit_date, visit_time, complaint, treatment || null, medicine_dispensed || null, medicine_qty || 0, outcome || 'Returned to Class', remarks || null]);

    // 2. Deduct inventory if medicine was dispensed
    if (medicine_dispensed && medicine_qty > 0) {
      const qtyToDeduct = parseInt(medicine_qty, 10);
      
      // Look up medicine in inventory
      const [invRows] = await connection.query(
        "SELECT id, stock_qty FROM clinic_inventory WHERE school_id = ? AND TRIM(LOWER(medicine_name)) = TRIM(LOWER(?))",
        [schoolId, medicine_dispensed]
      );

      if (invRows.length > 0) {
        const medicineId = invRows[0].id;
        const currentStock = invRows[0].stock_qty;
        const newStock = Math.max(0, currentStock - qtyToDeduct);

        await connection.query(
          "UPDATE clinic_inventory SET stock_qty = ? WHERE id = ?",
          [newStock, medicineId]
        );
      }
    }

    await connection.commit();
    return res.json({ success: true, message: "Clinic visit logged and medicine inventory updated successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("createClinicVisit error:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// ============================================================
// 5. MEDICINE CLINIC INVENTORY
// ============================================================
export const getInventory = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      "SELECT id, medicine_name, stock_qty, unit, DATE_FORMAT(expiration_date, '%Y-%m-%d') as expiration_date FROM clinic_inventory WHERE school_id = ? ORDER BY medicine_name ASC",
      [schoolId]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getInventory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInventoryItem = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const { medicine_name, stock_qty, unit, expiration_date } = req.body;

    if (!medicine_name) {
      return res.status(400).json({ success: false, message: "Medicine name is required." });
    }

    await pool.query(`
      INSERT INTO clinic_inventory (school_id, medicine_name, stock_qty, unit, expiration_date)
      VALUES (?, ?, ?, ?, ?)
    `, [schoolId, medicine_name.trim(), stock_qty || 0, unit || 'tabs', expiration_date || null]);

    return res.json({ success: true, message: "Medicine inventory item added successfully." });
  } catch (error) {
    console.error("createInventoryItem error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInventoryStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_qty, expiration_date } = req.body;

    await pool.query(
      "UPDATE clinic_inventory SET stock_qty = COALESCE(?, stock_qty), expiration_date = COALESCE(?, expiration_date) WHERE id = ?",
      [stock_qty, expiration_date, id]
    );

    return res.json({ success: true, message: "Medicine stock levels updated successfully." });
  } catch (error) {
    console.error("updateInventoryStock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 6. STUDENT PORTAL DATA ACCESS
// ============================================================
export const getStudentHealthProfile = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    let studentId = req.query.student_id;

    if (!studentId) {
      const [studentRows] = await pool.query("SELECT student_id FROM students WHERE email = ?", [req.user?.email]);
      if (studentRows.length > 0) {
        studentId = studentRows[0].student_id;
      }
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: "student_id parameter is required." });
    }

    // 1. Get health profile
    const [profileRows] = await pool.query(
      "SELECT blood_type, allergies, chronic_illnesses, emergency_contact_name, emergency_contact_no FROM health_profiles WHERE school_id = ? AND student_id = ?",
      [schoolId, studentId]
    );

    // 2. Get physical check records
    const [checkRows] = await pool.query(
      "SELECT id, height, weight, bmi, blood_pressure, temperature, DATE_FORMAT(check_date, '%Y-%m-%d') as check_date, status, remarks FROM health_checks WHERE school_id = ? AND student_id = ? ORDER BY check_date DESC",
      [schoolId, studentId]
    );

    // 3. Get sick bay visits
    const [visitRows] = await pool.query(
      "SELECT id, DATE_FORMAT(visit_date, '%Y-%m-%d') as visit_date, visit_time, complaint, treatment, medicine_dispensed, outcome, remarks FROM clinic_visits WHERE school_id = ? AND student_id = ? ORDER BY visit_date DESC",
      [schoolId, studentId]
    );

    return res.json({
      success: true,
      profile: profileRows[0] || null,
      physicalChecks: checkRows,
      visits: visitRows
    });
  } catch (error) {
    console.error("getStudentHealthProfile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
