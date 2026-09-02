import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';
import bcrypt from 'bcryptjs';
import { sendStaffInvitationEmail } from '../../utils/emailEngine.js';

// Helper to get or create employee ID corresponding to user identifier
const getOrCreateEmployeeId = async (identifier) => {
  if (!identifier) return null;

  // 1. Try matching directly by employee integer ID or employee_id string in `employees` table
  const [empDirect] = await pool.query(
    "SELECT id FROM employees WHERE id = ? OR employee_id = ?",
    [identifier, identifier]
  );
  if (empDirect.length > 0) {
    return empDirect[0].id;
  }

  // 2. Try matching user in `users` table by email, username, or id
  const [users] = await pool.query(
    "SELECT id, first_name, last_name, role, status FROM users WHERE email = ? OR username = ? OR id = ?",
    [identifier, identifier, identifier]
  );

  if (users.length > 0) {
    const u = users[0];
    const [empCheck] = await pool.query(
      "SELECT id FROM employees WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) AND TRIM(LOWER(last_name)) = TRIM(LOWER(?))",
      [u.first_name, u.last_name]
    );
    if (empCheck.length > 0) {
      return empCheck[0].id;
    }

    const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employees");
    const nextId = maxIdRows[0].maxId + 1;
    const currentYear = new Date().getFullYear();
    const empId = `EMP-${currentYear}-${String(u.id).padStart(4, '0')}`;

    await pool.query(
      `INSERT INTO employees (id, employee_id, first_name, last_name, position, department, basic_salary, status) 
       VALUES (?, ?, ?, ?, ?, 'Administration', 25000, ?)`,
      [
        nextId,
        empId,
        u.first_name,
        u.last_name,
        u.role.toUpperCase() + ' STAFF',
        u.status === 'Inactive' ? 'Inactive' : 'Active'
      ]
    );
    return nextId;
  }

  return null;
};

// 1. GET PERSONAL INFORMATION
export const getPersonalInfo = async (req, res) => {
  const { email } = req.query;
  try {
    const [empRows] = await pool.query(`
      SELECT e.*, u.email, u.phone_number, u.birthday, u.profile_image 
      FROM employees e
      JOIN users u ON TRIM(LOWER(u.first_name)) = TRIM(LOWER(e.first_name)) AND TRIM(LOWER(u.last_name)) = TRIM(LOWER(e.last_name))
      WHERE u.email = ? OR u.username = ? OR u.id = ?
    `, [email, email, email]);

    if (empRows.length === 0) {
      // Sync it
      const empId = await getOrCreateEmployeeId(email);
      if (!empId) return res.status(404).json({ success: false, message: "Employee profile not found." });
      
      const [retryRows] = await pool.query(`
        SELECT e.*, u.email, u.phone_number, u.birthday, u.profile_image 
        FROM employees e
        JOIN users u ON TRIM(LOWER(u.first_name)) = TRIM(LOWER(e.first_name)) AND TRIM(LOWER(u.last_name)) = TRIM(LOWER(e.last_name))
        WHERE u.email = ? OR u.username = ? OR u.id = ?
      `, [email, email, email]);
      return res.status(200).json({ success: true, employee: retryRows[0] });
    }

    return res.status(200).json({ success: true, employee: empRows[0] });
  } catch (error) {
    console.error("getPersonalInfo error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET TIMESHEET / ATTENDANCE LOGS
export const getTimesheet = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [dtrLogs] = await pool.query("SELECT id, employee_id, DATE_FORMAT(log_date, '%Y-%m-%d') AS log_date, time_in, time_out, ot_hours, status FROM employee_dtr WHERE employee_id = ? ORDER BY log_date DESC", [empId]);

    // If no logs, return some mock seed data so calendar isn't completely empty
    if (dtrLogs.length === 0) {
      const mockLogs = [];
      const today = new Date();
      // Generate last 15 days of weekday logs
      let mockMaxId = 0;
      for (let i = 1; i <= 15; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
          mockMaxId++;
          const dateStr = d.toISOString().split('T')[0];
          mockLogs.push({
            id: mockMaxId,
            employee_id: empId,
            log_date: dateStr,
            time_in: "08:00:00",
            time_out: "17:00:00",
            ot_hours: 0.00,
            status: "On Time"
          });
        }
      }
      return res.status(200).json({ success: true, logs: mockLogs });
    }

    return res.status(200).json({ success: true, logs: dtrLogs });
  } catch (error) {
    console.error("getTimesheet error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add Time Log / Request Time Adjustment
export const addTimeLog = async (req, res) => {
  const { email, log_date, time_in, time_out, ot_hours = 0, status = 'On Time' } = req.body;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_dtr");
    const nextId = maxRows[0].maxId + 1;

    await pool.query(`
      INSERT INTO employee_dtr (id, employee_id, log_date, time_in, time_out, ot_hours, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), time_out = VALUES(time_out), ot_hours = VALUES(ot_hours), status = VALUES(status)
    `, [nextId, empId, log_date, time_in, time_out, ot_hours, status]);

    return res.status(200).json({ success: true, message: "Attendance log saved successfully." });
  } catch (error) {
    console.error("addTimeLog error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Employee Live Clock In / Clock Out with GPS Geofencing
export const logEmployeeClock = async (req, res) => {
  const { email, log_type, latitude, longitude } = req.body;

  if (!email || !log_type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: "Incomplete data or location missing." });
  }

  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee record not found." });

    // Fetch dynamic school geofence settings
    const [settingsRows] = await pool.query(
      "SELECT dtr_latitude, dtr_longitude, dtr_radius, dtr_geofence_enabled FROM school_settings WHERE id = 1 LIMIT 1"
    );

    const schoolSettings = settingsRows[0] || {};
    const schoolLat = parseFloat(schoolSettings.dtr_latitude) || 14.9079167;
    const schoolLng = parseFloat(schoolSettings.dtr_longitude) || 121.0331667;
    const maxDistanceMeters = parseInt(schoolSettings.dtr_radius, 10) || 150;
    const geofenceEnabled = schoolSettings.dtr_geofence_enabled === undefined ? true : Boolean(schoolSettings.dtr_geofence_enabled);

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (geofenceEnabled) {
      const deg2rad = (deg) => (deg * Math.PI) / 180;
      const rad2deg = (rad) => (rad * 180) / Math.PI;

      const theta = userLng - schoolLng;
      let dist = Math.sin(deg2rad(userLat)) * Math.sin(deg2rad(schoolLat)) +
                 Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(schoolLat)) * Math.cos(deg2rad(theta));
      
      dist = Math.acos(Math.min(1, Math.max(-1, dist)));
      dist = rad2deg(dist);
      const miles = dist * 60 * 1.1515;
      const distanceInMeters = (miles * 1.609344) * 1000;

      if (distanceInMeters > maxDistanceMeters) {
        return res.status(400).json({
          success: false,
          message: `Access Denied. You are ${Math.round(distanceInMeters)} meters away from the allowed area (${maxDistanceMeters}m limit). Must be at school premises.`
        });
      }
    }

    const todayDate = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
    const logDate = dateFormatter.format(todayDate);

    const timeFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const timeStr = timeFormatter.format(todayDate);

    const [existing] = await pool.query(
      "SELECT id, time_in, time_out FROM employee_dtr WHERE employee_id = ? AND log_date = ? LIMIT 1",
      [empId, logDate]
    );

    // Fetch assigned shift for employee to compare schedule
    const [shiftRows] = await pool.query(
      "SELECT time_in, time_out, shift_name FROM employee_shifts WHERE user_id = (SELECT id FROM users WHERE email = ? OR username = ? OR id = ? LIMIT 1)",
      [email, email, email]
    );

    const assignedShift = shiftRows[0] || {
      time_in: '08:00 AM',
      time_out: '05:00 PM',
      shift_name: 'Standard Shift'
    };

    const parseTimeToMinutes = (tStr) => {
      if (!tStr) return null;
      const str = tStr.trim().toUpperCase();
      const isPM = str.includes('PM');
      const isAM = str.includes('AM');
      const cleanStr = str.replace('AM', '').replace('PM', '').trim();
      const parts = cleanStr.split(':');
      if (parts.length < 2) return null;
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const format12hTime = (t24Str) => {
      if (!t24Str) return '';
      const parts = t24Str.split(':');
      if (parts.length < 2) return t24Str;
      let hour = parseInt(parts[0], 10);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${minute} ${ampm}`;
    };

    if (log_type === 'time_in') {
      if (existing.length > 0 && existing[0].time_in) {
        const formattedIn = format12hTime(existing[0].time_in);
        return res.status(200).json({ success: true, message: `You have already timed in today at ${formattedIn}.` });
      }

      const actualInMins = parseTimeToMinutes(timeStr);
      const shiftInMins = parseTimeToMinutes(assignedShift.time_in);

      let status = 'On Time';
      let lateMinutes = 0;

      if (actualInMins !== null && shiftInMins !== null && actualInMins > shiftInMins) {
        lateMinutes = actualInMins - shiftInMins;
        status = 'Late';
      }

      const formattedInStr = format12hTime(timeStr);
      let successMsg = `Timed in successfully at ${formattedInStr}.`;
      if (lateMinutes > 0) {
        successMsg += ` You are ${lateMinutes} minute${lateMinutes > 1 ? 's' : ''} late for your shift schedule (${assignedShift.time_in}).`;
      } else {
        successMsg += ` On time for your shift!`;
      }

      const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_dtr");
      const nextId = maxRows[0].maxId + 1;

      await pool.query(`
        INSERT INTO employee_dtr (id, employee_id, log_date, time_in, time_out, ot_hours, status)
        VALUES (?, ?, ?, ?, NULL, 0.00, ?)
        ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), status = VALUES(status)
      `, [nextId, empId, logDate, timeStr, status]);

      return res.status(200).json({ success: true, message: successMsg, status, lateMinutes });

    } else if (log_type === 'time_out') {
      if (existing.length === 0 || !existing[0].time_in) {
        return res.status(400).json({ success: false, message: "Cannot Time Out without a Time In record today." });
      }
      if (existing[0].time_out) {
        const formattedOut = format12hTime(existing[0].time_out);
        return res.status(200).json({ success: true, message: `You have already timed out today at ${formattedOut}.` });
      }

      const actualOutMins = parseTimeToMinutes(timeStr);
      const shiftOutMins = parseTimeToMinutes(assignedShift.time_out);

      let earlyMinutes = 0;
      if (actualOutMins !== null && shiftOutMins !== null && actualOutMins < shiftOutMins) {
        earlyMinutes = shiftOutMins - actualOutMins;
      }

      const formattedOutStr = format12hTime(timeStr);
      let successMsg = `Timed out successfully at ${formattedOutStr}.`;
      if (earlyMinutes > 0) {
        successMsg += ` Early time-out (${earlyMinutes} minute${earlyMinutes > 1 ? 's' : ''} before your shift end of ${assignedShift.time_out}).`;
      } else {
        successMsg += ` Shift complete!`;
      }

      await pool.query(
        "UPDATE employee_dtr SET time_out = ? WHERE id = ?",
        [timeStr, existing[0].id]
      );

      return res.status(200).json({ success: true, message: successMsg, earlyMinutes });

    } else {
      return res.status(400).json({ success: false, message: "Invalid log type." });
    }

  } catch (error) {
    console.error("logEmployeeClock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. FILE A PORTAL REQUEST
export const createRequest = async (req, res) => {
  const { email, request_type, details } = req.body;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_requests");
    const nextId = maxRows[0].maxId + 1;

    await pool.query(`
      INSERT INTO employee_requests (id, employee_id, request_type, details, status)
      VALUES (?, ?, ?, ?, 'Pending')
    `, [nextId, empId, request_type, typeof details === 'object' ? JSON.stringify(details) : details]);

    // Send a separate portal notification
    const [maxNotifRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_notifications");
    const nextNotifId = maxNotifRows[0].maxId + 1;
    await pool.query(`
      INSERT INTO employee_notifications (id, employee_id, title, message)
      VALUES (?, ?, ?, ?)
    `, [nextNotifId, empId, "Request Submitted", `Your ${request_type} request was submitted successfully and is pending review.`]);

    return res.status(201).json({ success: true, message: "Request filed successfully." });
  } catch (error) {
    console.error("createRequest error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET PORTAL REQUESTS (My Requests)
export const getMyRequests = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [requests] = await pool.query("SELECT * FROM employee_requests WHERE employee_id = ? ORDER BY created_at DESC", [empId]);
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getMyRequests error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. APPROVALS TAB
// GET ALL REQUESTS (For HR/Admin view)
export const getAllRequestsForApproval = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT r.*, e.first_name, e.last_name, e.position, e.department
      FROM employee_requests r
      JOIN employees e ON r.employee_id = e.id
      ORDER BY r.created_at DESC
    `);
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("getAllRequestsForApproval error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE REQUEST STATUS (Approve / Reject)
export const updateRequestStatus = async (req, res) => {
  const { id, status, remarks, approved_by_email } = req.body;
  try {
    const [adminUser] = await pool.query("SELECT id FROM users WHERE email = ? OR username = ?", [approved_by_email, approved_by_email]);
    const adminId = adminUser.length > 0 ? adminUser[0].id : null;

    await pool.query(`
      UPDATE employee_requests
      SET status = ?, remarks = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, remarks, adminId, id]);

    // Send a notification to the employee
    const [reqRow] = await pool.query("SELECT employee_id, request_type FROM employee_requests WHERE id = ?", [id]);
    if (reqRow.length > 0) {
      const empId = reqRow[0].employee_id;
      const type = reqRow[0].request_type;

      const [maxNotifRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_notifications");
      const nextNotifId = maxNotifRows[0].maxId + 1;
      
      await pool.query(`
        INSERT INTO employee_notifications (id, employee_id, title, message)
        VALUES (?, ?, ?, ?)
      `, [
        nextNotifId, 
        empId, 
        `Request ${status}`, 
        `Your ${type} request has been ${status.toLowerCase()}.${remarks ? ` Remarks: "${remarks}"` : ''}`
      ]);
    }

    return res.status(200).json({ success: true, message: "Request updated successfully." });
  } catch (error) {
    console.error("updateRequestStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. EXPENSES / REIMBURSEMENTS
export const getMyExpenses = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [expenses] = await pool.query("SELECT * FROM employee_expenses WHERE employee_id = ? ORDER BY created_at DESC", [empId]);
    return res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.error("getMyExpenses error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req, res) => {
  const { email, expense_type, amount, description, receipt_attachment = null } = req.body;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_expenses");
    const nextId = maxRows[0].maxId + 1;

    await pool.query(`
      INSERT INTO employee_expenses (id, employee_id, expense_type, amount, description, receipt_attachment, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `, [nextId, empId, expense_type, parseFloat(amount), description, receipt_attachment]);

    return res.status(201).json({ success: true, message: "Expense filed successfully." });
  } catch (error) {
    console.error("createExpense error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. PURCHASE REQUESTS
export const getMyPurchases = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [purchases] = await pool.query("SELECT * FROM purchase_requests WHERE employee_id = ? ORDER BY created_at DESC", [empId]);
    return res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error("getMyPurchases error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req, res) => {
  const { email, item_name, quantity, estimated_cost, purpose, department } = req.body;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM purchase_requests");
    const nextId = maxRows[0].maxId + 1;

    await pool.query(`
      INSERT INTO purchase_requests (id, employee_id, item_name, quantity, estimated_cost, purpose, department, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [nextId, empId, item_name, parseInt(quantity), parseFloat(estimated_cost), purpose, department]);

    return res.status(201).json({ success: true, message: "Purchase request created." });
  } catch (error) {
    console.error("createPurchase error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. ACCOMPLISHMENTS TAB
export const getMyAccomplishments = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [accomplishments] = await pool.query("SELECT * FROM wfh_accomplishments WHERE employee_id = ? ORDER BY log_date DESC", [empId]);
    return res.status(200).json({ success: true, accomplishments });
  } catch (error) {
    console.error("getMyAccomplishments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccomplishment = async (req, res) => {
  const { email, log_date, description, attachment = null } = req.body;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [maxRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM wfh_accomplishments");
    const nextId = maxRows[0].maxId + 1;

    await pool.query(`
      INSERT INTO wfh_accomplishments (id, employee_id, log_date, description, attachment)
      VALUES (?, ?, ?, ?, ?)
    `, [nextId, empId, log_date, description, attachment]);

    return res.status(201).json({ success: true, message: "WFH Accomplishment logged." });
  } catch (error) {
    console.error("createAccomplishment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. NOTIFICATIONS SYSTEM (Specific to Payroll/Employee Portal)
export const getEmployeeNotifications = async (req, res) => {
  const { email } = req.query;
  try {
    const empId = await getOrCreateEmployeeId(email);
    if (!empId) return res.status(404).json({ success: false, message: "Employee not found." });

    const [notifications] = await pool.query("SELECT * FROM employee_notifications WHERE employee_id = ? ORDER BY created_at DESC", [empId]);
    const [unreadCount] = await pool.query("SELECT COUNT(*) AS count FROM employee_notifications WHERE employee_id = ? AND is_read = 0", [empId]);

    return res.status(200).json({ success: true, notifications, unread: unreadCount[0].count });
  } catch (error) {
    console.error("getEmployeeNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markEmployeeNotificationRead = async (req, res) => {
  const { notification_id } = req.body;
  try {
    await pool.query("UPDATE employee_notifications SET is_read = 1 WHERE id = ?", [notification_id]);
    return res.status(200).json({ success: true, message: "Notification marked read." });
  } catch (error) {
    console.error("markEmployeeNotificationRead error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Hire/Register Employee (Statutory IDs, Documents, User Account setup and email invitation)
export const hireEmployee = async (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    suffix,
    email,
    position,
    department,
    basic_salary,
    status,
    phone_number,
    employment_history,
    employment_status,
    salary_type,

    sss_number,
    philhealth_number,
    pagibig_number,
    tin_number,
    hmo_covered,
    hmo_details,

    psa_status,
    psa_file,
    coe_status,
    coe_file,
    nbi_status,
    nbi_file,
    sss_doc_status,
    sss_doc_file,
    philhealth_doc_status,
    philhealth_doc_file,
    pagibig_doc_status,
    pagibig_doc_file,
    tin_doc_status,
    tin_doc_file
  } = req.body;

  try {
    // 0. Email and Phone Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address provided.' });
    }

    if (phone_number) {
      const cleanPhone = String(phone_number).replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        return res.status(400).json({ success: false, message: 'Phone contact must be exactly 11 digits (PH standard: 09XXXXXXXXX).' });
      }
    }

    const schoolId = req.school_id || 1;
    let employeeNumber = '';

    // 1. Check if user already exists in users table
    const [userRows] = await pool.query("SELECT id, role FROM users WHERE email = ?", [email]);
    let nextUserId;

    if (userRows.length === 0) {
      // Create user account
      const username = email.split('@')[0];
      const tempPassword = 'Temp_' + Math.random().toString(36).substring(2, 10) + '!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const middleInitial = middle_name ? `${middle_name.trim().charAt(0)}.` : '';
      const suffixStr = suffix ? ` ${suffix.trim()}` : '';
      const fullName = `${first_name.trim()} ${middleInitial} ${last_name.trim()}${suffixStr}`.replace(/\s+/g, ' ');
      const verificationToken = 'token_' + Math.random().toString(36).substring(2, 15);

      const [idRows] = await pool.query("SELECT MAX(id) as maxId FROM users");
      nextUserId = (idRows[0].maxId || 0) + 1;

      // Register user
      const mappedRole = position.toLowerCase().includes('teacher') ? 'teacher' : position.toLowerCase().split(' ')[0] || 'staff';

      await pool.query(
        `INSERT INTO users (id, username, password, first_name, middle_name, last_name, suffix, full_name, email, phone_number, role, status, is_verified, verification_token, school_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [nextUserId, username, hashedPassword, first_name, middle_name || null, last_name, suffix || null, fullName, email, phone_number || null, mappedRole, status, verificationToken, schoolId]
      );

      // Get Prefix & generate employee number
      const [settingsRows] = await pool.query("SELECT prefix_faculty, prefix_staff FROM school_settings WHERE id = ?", [schoolId]);
      const facultyPrefix = (settingsRows.length > 0 && settingsRows[0].prefix_faculty) ? settingsRows[0].prefix_faculty : 'SF';
      const staffPrefix = (settingsRows.length > 0 && settingsRows[0].prefix_staff) ? settingsRows[0].prefix_staff : 'SA';
      const isFaculty = position.toLowerCase().includes('teacher');
      const customPrefix = isFaculty ? facultyPrefix : staffPrefix;
      const currentYear = new Date().getFullYear();
      const idPrefix = `${customPrefix}${currentYear}-`;

      const [lastEmployeeRows] = await pool.query(
        "SELECT employee_id FROM employees WHERE employee_id LIKE ? ORDER BY id DESC LIMIT 1",
        [`${idPrefix}%`]
      );

      let newNum = "0001";
      if (lastEmployeeRows.length > 0) {
        const lastEmployeeId = lastEmployeeRows[0].employee_id;
        const lastNum = parseInt(lastEmployeeId.substring(idPrefix.length), 10);
        if (!isNaN(lastNum)) {
          newNum = String(lastNum + 1).padStart(4, '0');
        }
      }
      employeeNumber = `${idPrefix}${newNum}`;

      // Send the invitation / credentials email
      try {
        await sendStaffInvitationEmail(email, fullName, mappedRole, verificationToken, username, req);
      } catch (emailErr) {
        console.error("Email send failed for new EIS hire:", emailErr.message);
      }
    } else {
      nextUserId = userRows[0].id;
      const middleInitial = middle_name ? `${middle_name.trim().charAt(0)}.` : '';
      const suffixStr = suffix ? ` ${suffix.trim()}` : '';
      const fullName = `${first_name.trim()} ${middleInitial} ${last_name.trim()}${suffixStr}`.replace(/\s+/g, ' ');

      // Update phone_number, middle_name, suffix, full_name in users table if changed
      await pool.query(
        "UPDATE users SET phone_number = ?, middle_name = ?, suffix = ?, full_name = ? WHERE id = ?",
        [phone_number || null, middle_name || null, suffix || null, fullName, nextUserId]
      );
    }

    // 2. Insert or update record in employees table
    const [empCheck] = await pool.query("SELECT id, employee_id FROM employees WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) AND TRIM(LOWER(last_name)) = TRIM(LOWER(?))", [first_name, last_name]);

    if (empCheck.length === 0) {
      if (!employeeNumber) {
        const currentYear = new Date().getFullYear();
        employeeNumber = `EMP-${currentYear}-${String(nextUserId).padStart(4, '0')}`;
      }
      const [maxEmpRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employees");
      const nextEmpId = maxEmpRows[0].maxId + 1;

      await pool.query(
        `INSERT INTO employees (
          id, employee_id, first_name, middle_name, last_name, suffix, position, department, basic_salary, status, phone_number,
          sss_number, philhealth_number, pagibig_number, tin_number, hmo_covered, hmo_details,
          psa_status, psa_file, coe_status, coe_file, nbi_status, nbi_file,
          sss_doc_status, sss_doc_file, philhealth_doc_status, philhealth_doc_file,
          pagibig_doc_status, pagibig_doc_file, tin_doc_status, tin_doc_file, employment_history, employment_status,
          salary_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nextEmpId, employeeNumber, first_name, middle_name || null, last_name, suffix || null, position, department, parseFloat(basic_salary), status, phone_number || null,
          sss_number || null, philhealth_number || null, pagibig_number || null, tin_number || null, hmo_covered || 'No', hmo_details || null,
          psa_status || 'Pending', psa_file || null, coe_status || 'Pending', coe_file || null, nbi_status || 'Pending', nbi_file || null,
          sss_doc_status || 'Pending', sss_doc_file || null, philhealth_doc_status || 'Pending', philhealth_doc_file || null,
          pagibig_doc_status || 'Pending', pagibig_doc_file || null, tin_doc_status || 'Pending', tin_doc_file || null, employment_history || 'Hired Active',
          employment_status || 'Probationary',
          salary_type || 'Monthly'
        ]
      );
    } else {
      const empDbId = empCheck[0].id;
      await pool.query(
        `UPDATE employees SET
          middle_name = ?, suffix = ?, position = ?, department = ?, basic_salary = ?, status = ?, phone_number = ?,
          sss_number = ?, philhealth_number = ?, pagibig_number = ?, tin_number = ?, hmo_covered = ?, hmo_details = ?,
          psa_status = ?, psa_file = ?, coe_status = ?, coe_file = ?, nbi_status = ?, nbi_file = ?,
          sss_doc_status = ?, sss_doc_file = ?, philhealth_doc_status = ?, philhealth_doc_file = ?,
          pagibig_doc_status = ?, pagibig_doc_file = ?, tin_doc_status = ?, tin_doc_file = ?, employment_history = ?,
          employment_status = ?, salary_type = ?
         WHERE id = ?`,
        [
          middle_name || null, suffix || null, position, department, parseFloat(basic_salary), status, phone_number || null,
          sss_number || null, philhealth_number || null, pagibig_number || null, tin_number || null, hmo_covered || 'No', hmo_details || null,
          psa_status || 'Pending', psa_file || null, coe_status || 'Pending', coe_file || null, nbi_status || 'Pending', nbi_file || null,
          sss_doc_status || 'Pending', sss_doc_file || null, philhealth_doc_status || 'Pending', philhealth_doc_file || null,
          pagibig_doc_status || 'Pending', pagibig_doc_file || null, tin_doc_status || 'Pending', tin_doc_file || null, employment_history || 'Hired Active',
          employment_status || 'Probationary',
          salary_type || 'Monthly',
          empDbId
        ]
      );
    }

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "EIS_HIRE",
      `Hired/Registered employee: ${first_name} ${last_name} (${position})`,
      req
    );

    return res.status(200).json({ success: true, message: "Employee registered and user account credentials dispatched." });
  } catch (error) {
    console.error("hireEmployee error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL EMPLOYEE SHIFTS
export const getEmployeeShifts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id AS user_id, 
        u.full_name, 
        u.role, 
        es.shift_id, 
        es.shift_name, 
        es.time_in, 
        es.time_out,
        es.work_days
      FROM users u
      LEFT JOIN employee_shifts es ON u.id = es.user_id
      WHERE u.role != 'student' AND u.status = 'Active'
      ORDER BY u.full_name ASC
    `);
    return res.status(200).json({ success: true, shifts: rows });
  } catch (error) {
    console.error("getEmployeeShifts error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ASSIGN EMPLOYEE SHIFT
export const assignEmployeeShift = async (req, res) => {
  const { user_id, shift_id, shift_name, time_in, time_out, work_days = 'Monday - Friday' } = req.body;
  if (!user_id || !shift_id || !shift_name || !time_in || !time_out) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }
  try {
    await pool.query(`
      INSERT INTO employee_shifts (user_id, shift_id, shift_name, time_in, time_out, work_days)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        shift_id = VALUES(shift_id),
        shift_name = VALUES(shift_name),
        time_in = VALUES(time_in),
        time_out = VALUES(time_out),
        work_days = VALUES(work_days)
    `, [user_id, shift_id, shift_name, time_in, time_out, work_days]);

    return res.status(200).json({ success: true, message: "Shift assigned successfully!" });
  } catch (error) {
    console.error("assignEmployeeShift error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET SPECIFIC USER SHIFT
export const getMyShift = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  try {
    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ? OR username = ?", [email, email]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const userId = userRows[0].id;
    const [shiftRows] = await pool.query("SELECT * FROM employee_shifts WHERE user_id = ?", [userId]);
    if (shiftRows.length === 0) {
      // Default standard shift if none assigned
      return res.status(200).json({
        success: true,
        shift: {
          shift_id: 'SH-01',
          shift_name: 'Standard Academic Shift',
          time_in: '08:00 AM',
          time_out: '05:00 PM',
          work_days: 'Monday - Friday'
        }
      });
    }
    return res.status(200).json({ success: true, shift: shiftRows[0] });
  } catch (error) {
    console.error("getMyShift error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET SHIFT TEMPLATES
export const getShiftTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM shift_templates ORDER BY id DESC");
    return res.status(200).json({ success: true, templates: rows });
  } catch (error) {
    console.error("getShiftTemplates error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE SHIFT TEMPLATE
export const createShiftTemplate = async (req, res) => {
  const { shift_name, time_in, time_out, work_days = 'Monday - Friday' } = req.body;
  if (!shift_name || !time_in || !time_out) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }
  try {
    await pool.query(
      "INSERT INTO shift_templates (shift_name, time_in, time_out, work_days) VALUES (?, ?, ?, ?)",
      [shift_name, time_in, time_out, work_days]
    );
    return res.status(200).json({ success: true, message: "Shift template created successfully!" });
  } catch (error) {
    console.error("createShiftTemplate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE SHIFT TEMPLATE
export const deleteShiftTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM shift_templates WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Shift template deleted successfully!" });
  } catch (error) {
    console.error("deleteShiftTemplate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UNASSIGN EMPLOYEE SHIFT
export const removeEmployeeShift = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ success: false, message: "user_id is required." });
  }
  try {
    await pool.query("DELETE FROM employee_shifts WHERE user_id = ?", [user_id]);
    return res.status(200).json({ success: true, message: "Shift assignment removed successfully." });
  } catch (error) {
    console.error("removeEmployeeShift error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL EMPLOYEE DTR LOGS (HR VIEW)
export const getAllDtrLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.id,
        DATE_FORMAT(d.log_date, '%Y-%m-%d') AS log_date,
        d.time_in,
        d.time_out,
        d.ot_hours,
        d.status,
        e.first_name,
        e.last_name,
        e.position,
        e.department
      FROM employee_dtr d
      JOIN employees e ON (d.employee_id = e.id OR d.employee_id = e.employee_id)
      ORDER BY d.log_date DESC, d.id DESC
    `);

    const formatted = rows.map(r => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      position: (r.position || 'Staff').toUpperCase(),
      department: r.department || 'Administration',
      date: r.log_date,
      timeIn: r.time_in,
      timeOut: r.time_out,
      otHours: r.ot_hours,
      status: r.status || 'On Time'
    }));

    return res.status(200).json({ success: true, logs: formatted });
  } catch (error) {
    console.error("getAllDtrLogs error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

