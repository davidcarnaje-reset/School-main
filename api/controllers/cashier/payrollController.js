import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const getEmployees = async (req, res) => {
  try {
    // 1. Fetch non-student/non-super_admin staff users from users table
    const [staffUsers] = await pool.query(`
      SELECT 
        id, 
        username, 
        first_name, 
        middle_name,
        last_name, 
        suffix,
        role, 
        email,
        phone_number,
        status 
      FROM users 
      WHERE LOWER(role) NOT IN ('student', 'super_admin')
    `);

    // 2. Sync staffUsers into employees table
    for (const u of staffUsers) {
      try {
        const [empCheck] = await pool.query(
          "SELECT id FROM employees WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) AND TRIM(LOWER(last_name)) = TRIM(LOWER(?))",
          [u.first_name || '', u.last_name || '']
        );
        if (empCheck.length === 0) {
          const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employees");
          const nextId = maxIdRows[0].maxId + 1;
          
          const currentYear = new Date().getFullYear();
          const rolePrefix = (u.role || '').toLowerCase() === 'teacher' ? 'SF' : 'SA';
          const employeeNumber = `${rolePrefix}${currentYear}-${String(nextId).padStart(4, '0')}`;

          await pool.query(
            `INSERT INTO employees (id, employee_id, first_name, middle_name, last_name, suffix, position, department, basic_salary, status, phone_number, email) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Administration', 25000, ?, ?, ?)`,
            [
              nextId,
              employeeNumber,
              u.first_name || '',
              u.middle_name || null,
              u.last_name || '',
              u.suffix || null,
              (u.role || 'STAFF').toUpperCase() + ' STAFF',
              u.status === 'Inactive' ? 'Inactive' : 'Active',
              u.phone_number || null,
              u.email || null
            ]
          );
        }
      } catch (insertErr) {
        console.warn("Sync employee notice:", insertErr.message);
      }
    }

    // 3. Select all from employees table joining users to get email & phone
    const [empRows] = await pool.query(`
      SELECT 
        e.*,
        u.email,
        COALESCE(e.phone_number, u.phone_number) AS phone_number
      FROM employees e
      LEFT JOIN users u ON TRIM(LOWER(e.first_name)) = TRIM(LOWER(u.first_name)) 
                       AND TRIM(LOWER(e.last_name)) = TRIM(LOWER(u.last_name))
      ORDER BY e.id DESC
    `);
    
    // Format salaries
    const formatted = empRows.map(emp => ({
      ...emp,
      basic_salary: parseFloat(emp.basic_salary) || 25000
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("getEmployees error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const addEmployee = async (req, res) => {
  const { employee_id, first_name, last_name, position, department, basic_salary, status } = req.body;

  if (!employee_id || !first_name || !last_name) {
    return res.status(400).json({ status: "error", message: "Incomplete data" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM employees FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    const sql = `
      INSERT INTO employees (id, employee_id, first_name, last_name, position, department, basic_salary, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(sql, [
      nextId,
      employee_id.trim(),
      first_name.trim(),
      last_name.trim(),
      position ? position.trim() : null,
      department ? department.trim() : null,
      parseFloat(basic_salary) || 0,
      status ? status.trim() : 'Active'
    ]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Cashier',
      "ADD_EMPLOYEE_PAYROLL",
      `Added employee to payroll list: ${first_name} ${last_name} (ID: ${employee_id})`,
      req
    );
    return res.json({ status: "success" });
  } catch (error) {
    await connection.rollback();
    console.error("addEmployee error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export const updateEmployee = async (req, res) => {
  const { id, employee_id, first_name, last_name, position, department, basic_salary, status } = req.body;

  if (!id) {
    return res.status(400).json({ status: "error", message: "Missing ID" });
  }

  try {
    const sql = `
      UPDATE employees SET 
        employee_id = ?, 
        first_name = ?, 
        last_name = ?, 
        position = ?, 
        department = ?, 
        basic_salary = ?, 
        status = ? 
      WHERE id = ?
    `;
    await pool.query(sql, [
      employee_id.trim(),
      first_name.trim(),
      last_name.trim(),
      position ? position.trim() : null,
      department ? department.trim() : null,
      parseFloat(basic_salary) || 0,
      status ? status.trim() : 'Active',
      parseInt(id, 10)
    ]);
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Cashier',
      "UPDATE_EMPLOYEE_PAYROLL",
      `Updated payroll data for employee: ${first_name} ${last_name} (ID: ${employee_id})`,
      req
    );
    return res.json({ status: "success" });
  } catch (error) {
    console.error("updateEmployee error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getPeriods = async (req, res) => {
  try {
    const [periods] = await pool.query("SELECT * FROM payroll_periods ORDER BY created_at DESC");
    return res.json(periods || []);
  } catch (error) {
    console.error("getPeriods error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const addPeriod = async (req, res) => {
  const { period_name, start_date, end_date } = req.body;

  if (!period_name || !start_date || !end_date) {
    return res.status(400).json({ status: "error", message: "Incomplete data" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM payroll_periods FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    const sql = "INSERT INTO payroll_periods (id, period_name, start_date, end_date, status) VALUES (?, ?, ?, ?, 'Pending')";
    await connection.query(sql, [
      nextId,
      period_name.trim(),
      start_date,
      end_date
    ]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Cashier',
      "CREATE_PAYROLL_PERIOD",
      `Created payroll period: ${period_name} (${start_date} to ${end_date})`,
      req
    );
    return res.json({ status: "success" });
  } catch (error) {
    await connection.rollback();
    console.error("addPeriod error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

// Helper to ensure payroll_settings table and extra columns exist
export const ensurePayrollSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll_settings (
        id INT PRIMARY KEY DEFAULT 1,
        late_deduction_mode VARCHAR(50) NOT NULL DEFAULT 'per_minute_fixed',
        late_rate_per_min DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        absent_deduction_mode VARCHAR(50) NOT NULL DEFAULT 'automatic_daily_rate',
        work_days_per_month INT NOT NULL DEFAULT 22,
        work_hours_per_day INT NOT NULL DEFAULT 8,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query("SELECT id FROM payroll_settings WHERE id = 1");
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO payroll_settings (id, late_deduction_mode, late_rate_per_min, absent_deduction_mode, work_days_per_month, work_hours_per_day) VALUES (1, 'per_minute_fixed', 1.00, 'automatic_daily_rate', 22, 8)"
      );
    }

    // Safely add missing columns to payroll_entries
    const tryAddColumn = async (table, colDef) => {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      } catch (err) {
        // Ignore duplicate column errors
      }
    };

    await tryAddColumn('payroll_entries', 'absent_days INT DEFAULT 0');
    await tryAddColumn('payroll_entries', 'absent_deduction DECIMAL(10,2) DEFAULT 0.00');
    await tryAddColumn('payroll_entries', 'late_deduction DECIMAL(10,2) DEFAULT 0.00');

    await tryAddColumn('payroll_entries_completed', 'absent_days INT DEFAULT 0');
    await tryAddColumn('payroll_entries_completed', 'absent_deduction DECIMAL(10,2) DEFAULT 0.00');
    await tryAddColumn('payroll_entries_completed', 'late_deduction DECIMAL(10,2) DEFAULT 0.00');

  } catch (err) {
    console.warn("ensurePayrollSettingsTable notice:", err.message);
  }
};

export const getPayrollSettings = async (req, res) => {
  try {
    await ensurePayrollSettingsTable();
    const [rows] = await pool.query("SELECT * FROM payroll_settings WHERE id = 1");
    if (rows.length > 0) {
      return res.json({
        status: "success",
        settings: {
          ...rows[0],
          late_rate_per_min: parseFloat(rows[0].late_rate_per_min) || 1.00,
          work_days_per_month: parseInt(rows[0].work_days_per_month, 10) || 22,
          work_hours_per_day: parseInt(rows[0].work_hours_per_day, 10) || 8
        }
      });
    }
    return res.json({
      status: "success",
      settings: {
        late_deduction_mode: "per_minute_fixed",
        late_rate_per_min: 1.00,
        absent_deduction_mode: "automatic_daily_rate",
        work_days_per_month: 22,
        work_hours_per_day: 8
      }
    });
  } catch (error) {
    console.error("getPayrollSettings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updatePayrollSettings = async (req, res) => {
  const { late_deduction_mode, late_rate_per_min, absent_deduction_mode, work_days_per_month, work_hours_per_day } = req.body;
  try {
    await ensurePayrollSettingsTable();
    await pool.query(
      `UPDATE payroll_settings SET 
         late_deduction_mode = ?, 
         late_rate_per_min = ?, 
         absent_deduction_mode = ?, 
         work_days_per_month = ?, 
         work_hours_per_day = ? 
       WHERE id = 1`,
      [
        late_deduction_mode || 'per_minute_fixed',
        parseFloat(late_rate_per_min) || 1.00,
        absent_deduction_mode || 'automatic_daily_rate',
        parseInt(work_days_per_month, 10) || 22,
        parseInt(work_hours_per_day, 10) || 8
      ]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'HR',
      "UPDATE_PAYROLL_SETTINGS",
      `Updated payroll policy: Mode=${late_deduction_mode}, Rate=${late_rate_per_min}/min`,
      req
    );

    return res.json({ status: "success", message: "Payroll settings saved successfully!" });
  } catch (error) {
    console.error("updatePayrollSettings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

function countWorkDaysInPeriod(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 11;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 11;
  let workDays = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return workDays > 0 ? workDays : 11;
}

export const processPayrollInit = async (req, res) => {
  const { period_id } = req.query;

  if (!period_id) {
    return res.status(400).json({ status: "error", message: "No Period ID" });
  }

  await ensurePayrollSettingsTable();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 0. Fetch active HR Payroll Settings
    const [settingsRows] = await connection.query("SELECT * FROM payroll_settings WHERE id = 1");
    const settings = settingsRows[0] || {
      late_deduction_mode: 'per_minute_fixed',
      late_rate_per_min: 1.00,
      absent_deduction_mode: 'automatic_daily_rate',
      work_days_per_month: 22,
      work_hours_per_day: 8
    };

    const lateMode = settings.late_deduction_mode || 'per_minute_fixed';
    const lateRatePerMin = parseFloat(settings.late_rate_per_min) || 1.00;
    const workDaysPerMonth = parseInt(settings.work_days_per_month, 10) || 22;
    const workHoursPerDay = parseInt(settings.work_hours_per_day, 10) || 8;

    // Fetch period start and end dates
    const [periodRows] = await connection.query("SELECT start_date, end_date FROM payroll_periods WHERE id = ?", [parseInt(period_id, 10)]);
    const period = periodRows[0] || null;
    const expectedWorkDays = period ? countWorkDaysInPeriod(period.start_date, period.end_date) : 11;

    // 1. Get active employees
    const [activeEmployees] = await connection.query("SELECT id, basic_salary FROM employees WHERE status = 'Active'");

    // 2. Insert ignore and calculate DTR metrics from employee_dtr for each employee
    for (const emp of activeEmployees) {
      const empId = emp.id;
      const basicSalary = parseFloat(emp.basic_salary) || 25000;
      const dailyRate = basicSalary / workDaysPerMonth;
      const hourlyRate = dailyRate / workHoursPerDay;

      let daysWorked = 0;
      let otHours = 0;
      let lateMins = 0;

      if (period?.start_date && period?.end_date) {
        const [dtrMetrics] = await connection.query(
          `SELECT 
             COUNT(CASE WHEN time_in IS NOT NULL THEN 1 END) AS days_cnt,
             COALESCE(SUM(ot_hours), 0) AS total_ot,
             COALESCE(SUM(CASE 
               WHEN time_in IS NOT NULL AND TIME(time_in) > '08:00:00' 
               THEN TIMESTAMPDIFF(MINUTE, '08:00:00', TIME(time_in)) 
               ELSE 0 
             END), 0) AS total_late
           FROM employee_dtr 
           WHERE employee_id = ? AND log_date BETWEEN ? AND ?`,
          [empId, period.start_date, period.end_date]
        );

        if (dtrMetrics.length > 0) {
          daysWorked = parseInt(dtrMetrics[0].days_cnt, 10) || 0;
          otHours = parseFloat(dtrMetrics[0].total_ot) || 0;
          lateMins = parseInt(dtrMetrics[0].total_late, 10) || 0;
        }
      }

      // Calculate absent days & deduction
      const absentDays = Math.max(0, expectedWorkDays - daysWorked);
      const absentDeduction = absentDays * dailyRate;

      // Calculate late deduction based on HR policy
      let lateDeduction = 0;
      if (lateMode === 'hour_equivalent') {
        // 1 min late = 1 hour salary deduction (or rounded up hours)
        lateDeduction = lateMins > 0 ? Math.ceil(lateMins / 60) * hourlyRate : 0;
      } else if (lateMode === 'hourly_rate_per_min') {
        lateDeduction = (hourlyRate / 60) * lateMins;
      } else {
        // 'per_minute_fixed' (default e.g. 1min = 1 peso)
        lateDeduction = lateMins * lateRatePerMin;
      }

      const basePay = dailyRate * daysWorked;
      const otPay = hourlyRate * 1.25 * otHours;
      const netPay = Math.max(0, basePay + otPay - lateDeduction);

      const [existing] = await connection.query(
        "SELECT id FROM payroll_entries WHERE period_id = ? AND employee_id = ?",
        [parseInt(period_id, 10), empId]
      );

      if (existing.length === 0) {
        const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM payroll_entries FOR UPDATE");
        const nextId = maxIdRows[0].maxId + 1;

        await connection.query(
          `INSERT INTO payroll_entries 
             (id, period_id, employee_id, days_worked, overtime_hours, late_minutes, absent_days, absent_deduction, late_deduction, net_pay, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
          [nextId, parseInt(period_id, 10), empId, daysWorked, otHours, lateMins, absentDays, absentDeduction.toFixed(2), lateDeduction.toFixed(2), netPay.toFixed(2)]
        );
      } else {
        await connection.query(
          `UPDATE payroll_entries SET 
             days_worked = GREATEST(days_worked, ?), 
             overtime_hours = GREATEST(overtime_hours, ?), 
             late_minutes = GREATEST(late_minutes, ?),
             absent_days = ?,
             absent_deduction = ?,
             late_deduction = ?,
             net_pay = ?
           WHERE period_id = ? AND employee_id = ?`,
          [daysWorked, otHours, lateMins, absentDays, absentDeduction.toFixed(2), lateDeduction.toFixed(2), netPay.toFixed(2), parseInt(period_id, 10), empId]
        );
      }
    }

    await connection.commit();

    // 3. Return results joined with employees
    const sql = `
      SELECT pe.*, e.first_name, e.last_name, e.position, e.basic_salary, e.department 
      FROM payroll_entries pe 
      JOIN employees e ON pe.employee_id = e.id 
      WHERE pe.period_id = ?
    `;
    const [entries] = await pool.query(sql, [parseInt(period_id, 10)]);

    const formattedEntries = (entries || []).map(entry => ({
      ...entry,
      basic_salary: parseFloat(entry.basic_salary),
      net_pay: parseFloat(entry.net_pay),
      absent_days: parseInt(entry.absent_days, 10) || 0,
      absent_deduction: parseFloat(entry.absent_deduction) || 0,
      late_deduction: parseFloat(entry.late_deduction) || 0
    }));

    return res.json({ status: "success", entries: formattedEntries, settings });

  } catch (error) {
    await connection.rollback();
    console.error("processPayrollInit error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export const getEmployeePayrollTimesheet = async (req, res) => {
  const { employee_id, period_id } = req.query;
  try {
    const [periodRows] = await pool.query("SELECT start_date, end_date FROM payroll_periods WHERE id = ?", [parseInt(period_id, 10)]);
    if (periodRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Payroll period not found." });
    }
    const { start_date, end_date } = periodRows[0];

    const [logs] = await pool.query(
      `SELECT * FROM employee_dtr 
       WHERE employee_id = ? AND log_date BETWEEN ? AND ? 
       ORDER BY log_date ASC`,
      [parseInt(employee_id, 10), start_date, end_date]
    );

    return res.json({ status: "success", period: periodRows[0], logs });
  } catch (error) {
    console.error("getEmployeePayrollTimesheet error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getMyPayslips = async (req, res) => {
  const { email } = req.query;
  try {
    const [userRows] = await pool.query("SELECT id, first_name, last_name FROM users WHERE email = ? OR username = ? OR id = ?", [email, email, email]);
    if (userRows.length === 0) return res.json({ success: true, payslips: [] });
    const u = userRows[0];

    const [empRows] = await pool.query(
      "SELECT id FROM employees WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) AND TRIM(LOWER(last_name)) = TRIM(LOWER(?))",
      [u.first_name, u.last_name]
    );
    if (empRows.length === 0) return res.json({ success: true, payslips: [] });

    const empId = empRows[0].id;
    const [payslips] = await pool.query(
      `SELECT pe.*, pp.start_date, pp.end_date, pp.payout_date 
       FROM payroll_entries pe
       JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.employee_id = ? AND pp.status = 'Completed'
       ORDER BY pp.end_date DESC`,
      [empId]
    );

    return res.json({ success: true, payslips });
  } catch (error) {
    console.error("getMyPayslips error:", error);
    return res.json({ success: true, payslips: [] });
  }
};

export const savePayroll = async (req, res) => {
  const { period_id, entries, final_status } = req.body;

  if (!period_id || !Array.isArray(entries)) {
    return res.status(400).json({ status: "error", message: "Invalid or missing data." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const finalStatusVal = final_status === 'Paid' ? 'Paid' : 'Pending';

    // 1. Update/Upsert drafts
    for (const entry of entries) {
      // Check if entry exists for this period and employee
      const [existing] = await connection.query(
        "SELECT id FROM payroll_entries WHERE period_id = ? AND employee_id = ?",
        [parseInt(period_id, 10), parseInt(entry.employee_id, 10)]
      );

      const absentDaysVal = parseInt(entry.absent_days, 10) || 0;
      const absentDeductionVal = parseFloat(entry.absent_deduction) || 0;
      const lateDeductionVal = parseFloat(entry.late_deduction) || 0;

      if (existing.length > 0) {
        const sql_update = `
          UPDATE payroll_entries SET 
            days_worked = ?, 
            overtime_hours = ?, 
            late_minutes = ?, 
            absent_days = ?,
            absent_deduction = ?,
            late_deduction = ?,
            net_pay = ?, 
            status = ? 
          WHERE period_id = ? AND employee_id = ?
        `;
        await connection.query(sql_update, [
          parseInt(entry.days_worked, 10) || 0,
          parseFloat(entry.overtime_hours) || 0,
          parseInt(entry.late_minutes, 10) || 0,
          absentDaysVal,
          absentDeductionVal,
          lateDeductionVal,
          parseFloat(entry.net_pay) || 0,
          finalStatusVal,
          parseInt(period_id, 10),
          parseInt(entry.employee_id, 10)
        ]);
      } else {
        const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM payroll_entries FOR UPDATE");
        const nextId = maxIdRows[0].maxId + 1;

        const sql_insert = `
          INSERT INTO payroll_entries 
            (id, period_id, employee_id, days_worked, overtime_hours, late_minutes, absent_days, absent_deduction, late_deduction, net_pay, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(sql_insert, [
          nextId,
          parseInt(period_id, 10),
          parseInt(entry.employee_id, 10),
          parseInt(entry.days_worked, 10) || 0,
          parseFloat(entry.overtime_hours) || 0,
          parseInt(entry.late_minutes, 10) || 0,
          absentDaysVal,
          absentDeductionVal,
          lateDeductionVal,
          parseFloat(entry.net_pay) || 0,
          finalStatusVal
        ]);
      }
    }

    // 2. If FINALIZE (Paid), archive entries and close Period
    if (finalStatusVal === 'Paid') {
      // Find current max id in payroll_entries_completed to preserve TiDB constraint
      const [maxCompletedRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM payroll_entries_completed FOR UPDATE");
      let nextCompletedId = maxCompletedRows[0].maxId;

      // Select active records to copy
      const [toArchive] = await connection.query(`
        SELECT pe.period_id, pe.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS full_name, e.position, 
               pe.days_worked, pe.overtime_hours as ot_hours, pe.late_minutes, pe.absent_days, pe.absent_deduction, pe.late_deduction, pe.net_pay
        FROM payroll_entries pe
        JOIN employees e ON pe.employee_id = e.id
        WHERE pe.period_id = ?
      `, [parseInt(period_id, 10)]);

      for (const row of toArchive) {
        nextCompletedId++;
        const sqlArchive = `
          INSERT INTO payroll_entries_completed 
            (id, period_id, employee_id, full_name, position, days_worked, ot_hours, late_minutes, absent_days, absent_deduction, late_deduction, net_pay)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(sqlArchive, [
          nextCompletedId,
          row.period_id,
          row.employee_id,
          row.full_name,
          row.position,
          row.days_worked,
          row.ot_hours,
          row.late_minutes,
          row.absent_days || 0,
          row.absent_deduction || 0.00,
          row.late_deduction || 0.00,
          row.net_pay
        ]);
      }

      await connection.query("UPDATE payroll_periods SET status = 'Completed' WHERE id = ?", [parseInt(period_id, 10)]);
    }

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Cashier',
      "SAVE_PAYROLL",
      `Saved payroll entries for Period ID: ${period_id}. Status: ${finalStatusVal}`,
      req
    );
    return res.json({ status: "success", message: "Payroll updated successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("savePayroll error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const getCompletedPeriods = async (req, res) => {
  try {
    const [periods] = await pool.query("SELECT * FROM payroll_periods WHERE status = 'Completed' ORDER BY end_date DESC");
    return res.json(periods || []);
  } catch (error) {
    console.error("getCompletedPeriods error:", error);
    return res.json([]);
  }
};

export const getCompletedPayroll = async (req, res) => {
  const { period_id } = req.query;

  try {
    const [entries] = await pool.query("SELECT * FROM payroll_entries_completed WHERE period_id = ?", [parseInt(period_id, 10)]);
    
    const formatted = (entries || []).map(e => ({
      ...e,
      net_pay: parseFloat(e.net_pay)
    }));
    return res.json({ status: "success", entries: formatted });
  } catch (error) {
    console.error("getCompletedPayroll error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
