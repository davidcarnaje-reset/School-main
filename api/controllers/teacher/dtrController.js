import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// Get timezone-safe dates/times in Manila timezone
const getManilaDateTime = () => {
  const dateObj = new Date();
  
  // Format Date: YYYY-MM-DD
  const formatterDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const today = formatterDate.format(dateObj); // outputs YYYY-MM-DD
  
  // Format Time: HH:MM:SS (24-hour style)
  const formatterTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const timeStr = formatterTime.format(dateObj);
  
  return { today, timeStr };
};

// 1. GET DTR TODAY status
export const getDtrToday = async (req, res) => {
  const teacherId = req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ status: "error", message: "Teacher ID is required." });
  }

  const { today } = getManilaDateTime();

  try {
    const query = "SELECT time_in, time_out FROM teacher_dtr WHERE teacher_id = ? AND record_date = ?";
    const [rows] = await pool.query(query, [teacherId, today]);

    if (rows.length > 0) {
      const row = rows[0];
      
      const formatTime = (timeVal) => {
        if (!timeVal) return null;
        // timeVal is like "HH:MM:SS" or Date string, format to "HH:MM"
        const [h, m] = timeVal.toString().split(':');
        return `${h}:${m}`;
      };

      return res.json({
        status: "success",
        data: {
          time_in: formatTime(row.time_in),
          time_out: formatTime(row.time_out)
        }
      });
    } else {
      return res.json({
        status: "success",
        data: {
          time_in: null,
          time_out: null
        }
      });
    }

  } catch (error) {
    console.error("Get DTR error:", error);
    return res.status(500).json({ status: "error", message: "Connection error: " + error.message });
  }
};

// 2. LOG DTR (Time In / Time Out check with Geofencing)
export const logDtr = async (req, res) => {
  const { teacher_id, log_type, latitude, longitude } = req.body;

  if (!teacher_id || !log_type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ status: "error", message: "Incomplete data or location not provided." });
  }

  try {
    // 🟢 Fetch dynamic school location settings set by Main Admin
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
      // Haversine formula matching PHP math
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
        return res.json({
          status: "error",
          message: `Access Denied. You are ${Math.round(distanceInMeters)} meters away from the allowed location (${maxDistanceMeters}m limit). You must be within the school premises to log your time.`
        });
      }
    }

    const teacherId = parseInt(teacher_id, 10);
    const { today, timeStr } = getManilaDateTime();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check daily entry in teacher_dtr
      const [records] = await connection.query(
        "SELECT id, time_in, time_out FROM teacher_dtr WHERE teacher_id = ? AND record_date = ? LIMIT 1",
        [teacherId, today]
      );
      const record = records[0] || null;

      if (log_type === 'time_in') {
        if (!record) {
          await connection.query(
            "INSERT INTO teacher_dtr (teacher_id, record_date, time_in) VALUES (?, ?, ?)",
            [teacherId, today, timeStr]
          );

          // Sync into employee_dtr for employee/payroll timesheet integration
          const [empCheck] = await connection.query(
            `SELECT e.id FROM employees e 
             JOIN users u ON (TRIM(LOWER(e.first_name)) = TRIM(LOWER(u.first_name)) AND TRIM(LOWER(e.last_name)) = TRIM(LOWER(u.last_name))) 
             WHERE u.id = ? LIMIT 1`,
            [teacherId]
          );
          const matchedEmpId = empCheck.length > 0 ? empCheck[0].id : teacherId;

          const [maxEmpDtr] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employee_dtr");
          const nextEmpDtrId = maxEmpDtr[0].maxId + 1;

          await connection.query(
            `INSERT INTO employee_dtr (id, employee_id, log_date, time_in, time_out, ot_hours, status)
             VALUES (?, ?, ?, ?, NULL, 0.00, 'On Time')
             ON DUPLICATE KEY UPDATE time_in = VALUES(time_in), status = 'On Time'`,
            [nextEmpDtrId, matchedEmpId, today, timeStr]
          );

          await connection.commit();
          await logAuditTrail(
            teacherId,
            'Teacher',
            "DTR_TIME_IN",
            `Recorded DTR Time-In: ${timeStr} on date: ${today}`,
            req
          );
          return res.json({ status: "success", message: "Time In recorded successfully." });
        } else {
          await connection.rollback();
          return res.json({ status: "error", message: "You have already timed in today." });
        }
      } else if (log_type === 'time_out') {
        if (record) {
          if (record.time_out === null) {
            await connection.query(
              "UPDATE teacher_dtr SET time_out = ? WHERE id = ?",
              [timeStr, record.id]
            );

            // Sync time_out into employee_dtr
            const [empCheck] = await connection.query(
              `SELECT e.id FROM employees e 
               JOIN users u ON (TRIM(LOWER(e.first_name)) = TRIM(LOWER(u.first_name)) AND TRIM(LOWER(e.last_name)) = TRIM(LOWER(u.last_name))) 
               WHERE u.id = ? LIMIT 1`,
              [teacherId]
            );
            const matchedEmpId = empCheck.length > 0 ? empCheck[0].id : teacherId;

            await connection.query(
              "UPDATE employee_dtr SET time_out = ? WHERE employee_id = ? AND log_date = ?",
              [timeStr, matchedEmpId, today]
            );

            await connection.commit();
            await logAuditTrail(
              teacherId,
              'Teacher',
              "DTR_TIME_OUT",
              `Recorded DTR Time-Out: ${timeStr} on date: ${today}`,
              req
            );
            return res.json({ status: "success", message: "Time Out recorded successfully." });
          } else {
            await connection.rollback();
            return res.json({ status: "error", message: "You have already timed out today." });
          }
        } else {
          await connection.rollback();
          return res.json({ status: "error", message: "Cannot Time Out without a Time In record." });
        }
      } else {
        await connection.rollback();
        return res.json({ status: "error", message: "Invalid log type." });
      }

    } catch (transErr) {
      await connection.rollback();
      throw transErr;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Log DTR error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { getDtrToday, logDtr };
