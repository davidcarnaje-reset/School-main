import pool from '../../config/db.js';

export const getRegistrarRequests = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.id, 
        s.student_id, 
        s.first_name, 
        s.last_name, 
        f.item_name, 
        r.status, 
        r.created_at 
      FROM service_requests r
      JOIN students s ON r.student_id = s.student_id
      JOIN fees_catalog f ON r.fee_id = f.id
      ORDER BY r.created_at DESC
    `;
    const [requests] = await pool.query(sql);
    return res.status(200).json(requests || []);
  } catch (error) {
    console.error("getRegistrarRequests error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const getFeesCatalog = async (req, res) => {
  try {
    const sql = "SELECT id, item_name, amount, category FROM fees_catalog ORDER BY category DESC, item_name ASC";
    const [fees] = await pool.query(sql);

    const formattedFees = (fees || []).map(fee => {
      fee.amount = parseFloat(fee.amount).toFixed(2);
      return fee;
    });

    return res.status(200).json(formattedFees || []);
  } catch (error) {
    console.error("getFeesCatalog error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const searchStudents = async (req, res) => {
  const { q } = req.query;
  const query = q ? String(q).trim() : '';

  if (!query) {
    return res.status(200).json([]);
  }

  try {
    const sql = `
      SELECT student_id, first_name, last_name 
      FROM students 
      WHERE first_name LIKE ? 
         OR last_name LIKE ? 
         OR student_id LIKE ? 
      LIMIT 10
    `;
    const wildcard = `%${query}%`;
    const [students] = await pool.query(sql, [wildcard, wildcard, wildcard]);
    return res.status(200).json(students || []);
  } catch (error) {
    console.error("searchStudents error:", error);
    return res.status(500).json({ error: "Database Error: " + error.message });
  }
};

export const addRequest = async (req, res) => {
  const { student_id, fee_id } = req.body;

  if (!student_id || !fee_id) {
    return res.status(400).json({ success: false, message: "Missing required fields (Student ID or Fee ID)." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get fee details
    const [feeRows] = await connection.query("SELECT item_name, amount FROM fees_catalog WHERE id = ? LIMIT 1", [parseInt(fee_id, 10)]);
    if (feeRows.length === 0) {
      throw new Error("Ang napiling dokumento ay wala sa catalog.");
    }
    const fee = feeRows[0];
    const item_name = fee.item_name;
    const amount = parseFloat(fee.amount);
    const sy = "2026-2027"; // Default Academic Year

    // 2. Manual ID lookup for TiDB compat
    const [maxReqIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM service_requests FOR UPDATE");
    const nextReqId = maxReqIdRows[0].maxId + 1;

    const [maxBillIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM student_billing FOR UPDATE");
    const nextBillId = maxBillIdRows[0].maxId + 1;

    const [maxItemIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM student_billing_items FOR UPDATE");
    const nextItemId = maxItemIdRows[0].maxId + 1;

    // 3. Insert into service_requests
    const sql_req = `
      INSERT INTO service_requests (id, student_id, fee_id, status, created_at) 
      VALUES (?, ?, ?, 'Pending Payment', NOW())
    `;
    await connection.query(sql_req, [nextReqId, student_id, parseInt(fee_id, 10)]);

    // 4. Insert into student_billing
    const sql_bill = `
      INSERT INTO student_billing (id, student_id, school_year, total_amount, balance, payment_status) 
      VALUES (?, ?, ?, ?, ?, 'Unpaid')
    `;
    await connection.query(sql_bill, [nextBillId, student_id, sy, amount, amount]);

    // 5. Insert into student_billing_items
    const sql_item = `
      INSERT INTO student_billing_items (id, billing_id, item_name, amount) 
      VALUES (?, ?, ?, ?)
    `;
    await connection.query(sql_item, [nextItemId, nextBillId, "Request: " + item_name, amount]);

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Request logged successfully! Bill generated for Cashier.",
      student_id: student_id,
      billing_id: nextBillId
    });
  } catch (error) {
    await connection.rollback();
    console.error("addRequest error:", error);
    return res.status(500).json({ success: false, message: "Process Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const cancelRequest = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Request ID is missing." });
  }

  try {
    const sql = `
      UPDATE service_requests 
      SET status = 'Cancelled' 
      WHERE id = ? 
      AND status = 'Pending Payment'
    `;
    const [result] = await pool.query(sql, [parseInt(id, 10)]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ success: true, message: "Request has been successfully cancelled and voided." });
    } else {
      return res.status(200).json({
        success: false,
        message: "Unable to cancel. Request might be paid already or does not exist."
      });
    }
  } catch (error) {
    console.error("cancelRequest error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};
