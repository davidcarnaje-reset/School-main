import pool from '../../config/db.js';

export const getPayments = async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.payment_id as id, 
        p.student_id as student, 
        CONCAT(s.first_name, ' ', s.last_name) as name, 
        p.amount_paid as amount, 
        p.fee_category as type, 
        p.payment_method as method, 
        p.transaction_date as date 
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.student_id
      ORDER BY p.transaction_date DESC 
      LIMIT 20
    `;
    const [rows] = await pool.query(sql);

    const formatted = (rows || []).map(row => {
      // Format transaction date in JS: "hh:mm A, DayOfWeek"
      const dateVal = new Date(row.date);
      const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
      const optionsDay = { weekday: 'long' };
      const timeStr = dateVal.toLocaleTimeString('en-US', optionsTime);
      const dayStr = dateVal.toLocaleDateString('en-US', optionsDay);
      row.date = `${timeStr}, ${dayStr}`;
      row.amount = parseFloat(row.amount);
      return row;
    });

    return res.json(formatted);
  } catch (error) {
    console.error("getPayments error:", error);
    return res.json([]); // Return empty list instead of error to avoid UI crash
  }
};

export const getCollectionReports = async (req, res) => {
  const { start, end } = req.query;

  try {
    let sql = `
      SELECT p.*, s.first_name, s.last_name 
      FROM payments p 
      JOIN students s ON p.student_id = s.student_id
    `;
    const params = [];

    if (start && end) {
      sql += " WHERE DATE(p.transaction_date) BETWEEN ? AND ?";
      params.push(start, end);
    }

    sql += " ORDER BY p.transaction_date DESC";

    const [rows] = await pool.query(sql, params);

    const stats = { total: 0, cash: 0, gcash: 0, card: 0 };
    const payments = (rows || []).map(row => {
      const amt = parseFloat(row.amount_paid);
      row.amount_paid = amt;
      stats.total += amt;

      const method = row.payment_method;
      if (method === 'Cash') stats.cash += amt;
      else if (method === 'GCash') stats.gcash += amt;
      else if (method === 'Card') stats.card += amt;

      return row;
    });

    return res.json({
      status: "success",
      stats,
      data: payments
    });
  } catch (error) {
    console.error("getCollectionReports error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export const getServiceRequests = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ status: "error", message: "No Student ID provided." });
  }

  try {
    const [studentRows] = await pool.query("SELECT first_name, last_name FROM students WHERE student_id = ? LIMIT 1", [id]);
    if (studentRows.length === 0) {
      return res.status(200).json({ status: "error", message: "Student ID not found in database." });
    }

    const student = studentRows[0];
    const sql_reqs = `
      SELECT sr.id, sr.status, fc.item_name, fc.amount 
      FROM service_requests sr
      JOIN fees_catalog fc ON sr.fee_id = fc.id
      WHERE sr.student_id = ? AND sr.status = 'Pending Payment'
    `;
    const [items] = await pool.query(sql_reqs, [id]);

    const formattedItems = (items || []).map(item => ({
      ...item,
      amount: parseFloat(item.amount)
    }));

    return res.json({
      status: "success",
      student_name: `${student.first_name} ${student.last_name}`,
      items: formattedItems
    });
  } catch (error) {
    console.error("getServiceRequests error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export const processServicePayment = async (req, res) => {
  const { request_ids } = req.body;

  if (!Array.isArray(request_ids) || request_ids.length === 0) {
    return res.status(400).json({ status: "error", message: "No items selected." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const id of request_ids) {
      const [reqRows] = await connection.query(`
        SELECT sr.student_id, fc.amount, fc.item_name 
        FROM service_requests sr
        JOIN fees_catalog fc ON sr.fee_id = fc.id
        WHERE sr.id = ?
      `, [parseInt(id, 10)]);

      if (reqRows.length > 0) {
        const request = reqRows[0];

        // 1. Update status
        await connection.query("UPDATE service_requests SET status = 'Paid' WHERE id = ?", [parseInt(id, 10)]);

        // 2. Manual ID query for payments table
        const [maxPayIdRows] = await connection.query("SELECT COALESCE(MAX(payment_id), 0) AS maxId FROM payments FOR UPDATE");
        const nextPayId = maxPayIdRows[0].maxId + 1;

        // 3. Log transaction
        const sql_payment = `
          INSERT INTO payments (payment_id, student_id, amount_paid, fee_category, payment_method, transaction_date) 
          VALUES (?, ?, ?, ?, 'Cash', NOW())
        `;
        await connection.query(sql_payment, [
          nextPayId,
          request.student_id,
          parseFloat(request.amount),
          'Service: ' + request.item_name
        ]);
      }
    }

    await connection.commit();
    return res.json({ status: "success", message: "Payment successfully processed and recorded!" });
  } catch (error) {
    await connection.rollback();
    console.error("processServicePayment error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};
