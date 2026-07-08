import pool from '../../config/db.js';

export const getEmployees = async (req, res) => {
  try {
    const [employees] = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    const formatted = (employees || []).map(emp => ({
      ...emp,
      basic_salary: parseFloat(emp.basic_salary)
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
    return res.json({ status: "success" });
  } catch (error) {
    await connection.rollback();
    console.error("addPeriod error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export const processPayrollInit = async (req, res) => {
  const { period_id } = req.query;

  if (!period_id) {
    return res.status(400).json({ status: "error", message: "No Period ID" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get active employees
    const [activeEmployees] = await connection.query("SELECT id FROM employees WHERE status = 'Active'");
    const empIds = (activeEmployees || []).map(emp => emp.id);

    // 2. Insert ignore into payroll_entries (check if already exists)
    for (const empId of empIds) {
      const [existing] = await connection.query(
        "SELECT id FROM payroll_entries WHERE period_id = ? AND employee_id = ?",
        [parseInt(period_id, 10), empId]
      );
      if (existing.length === 0) {
        const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM payroll_entries FOR UPDATE");
        const nextId = maxIdRows[0].maxId + 1;

        await connection.query(
          "INSERT INTO payroll_entries (id, period_id, employee_id, days_worked, overtime_hours, late_minutes, net_pay, status) VALUES (?, ?, ?, 0, 0, 0, 0, 'Pending')",
          [nextId, parseInt(period_id, 10), empId]
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
      net_pay: parseFloat(entry.net_pay)
    }));

    return res.json({ status: "success", entries: formattedEntries });

  } catch (error) {
    await connection.rollback();
    console.error("processPayrollInit error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
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

      if (existing.length > 0) {
        const sql_update = `
          UPDATE payroll_entries SET 
            days_worked = ?, 
            overtime_hours = ?, 
            late_minutes = ?, 
            net_pay = ?, 
            status = ? 
          WHERE period_id = ? AND employee_id = ?
        `;
        await connection.query(sql_update, [
          parseInt(entry.days_worked, 10) || 0,
          parseFloat(entry.overtime_hours) || 0,
          parseInt(entry.late_minutes, 10) || 0,
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
            (id, period_id, employee_id, days_worked, overtime_hours, late_minutes, net_pay, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(sql_insert, [
          nextId,
          parseInt(period_id, 10),
          parseInt(entry.employee_id, 10),
          parseInt(entry.days_worked, 10) || 0,
          parseFloat(entry.overtime_hours) || 0,
          parseInt(entry.late_minutes, 10) || 0,
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
               pe.days_worked, pe.overtime_hours as ot_hours, pe.late_minutes, pe.net_pay
        FROM payroll_entries pe
        JOIN employees e ON pe.employee_id = e.id
        WHERE pe.period_id = ?
      `, [parseInt(period_id, 10)]);

      // Insert each row with dynamic manually incremented completed ID
      for (const row of toArchive) {
        nextCompletedId++;
        const sqlArchive = `
          INSERT INTO payroll_entries_completed 
            (id, period_id, employee_id, full_name, position, days_worked, ot_hours, late_minutes, net_pay)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          row.net_pay
        ]);
      }

      await connection.query("UPDATE payroll_periods SET status = 'Completed' WHERE id = ?", [parseInt(period_id, 10)]);
    }

    await connection.commit();
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
