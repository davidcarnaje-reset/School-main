import pool from '../../config/db.js';

// GET STUDENT BILLING RECORD AND ITEMS BREAKDOWN
export const getStudentBilling = async (req, res) => {
  const search = req.query.search || '';

  if (!search) {
    return res.status(400).json({ status: "error", message: "No search ID provided" });
  }

  try {
    const query = `
      SELECT b.*, s.first_name, s.last_name 
      FROM student_billing b
      JOIN students s ON b.student_id = s.student_id
      WHERE b.student_id = ? OR s.last_name LIKE ?
      LIMIT 1
    `;

    const [billingRows] = await pool.query(query, [search, `%${search}%`]);

    if (billingRows.length > 0) {
      const row = billingRows[0];
      const billingId = row.id;

      // Get breakdown items
      const [items] = await pool.query(
        "SELECT item_name, amount, paid_amount, balance FROM student_billing_items WHERE billing_id = ?",
        [billingId]
      );

      return res.json({
        status: "success",
        data: {
          id: row.student_id,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          total: parseFloat(row.total_amount || 0),
          paid: parseFloat(row.paid_amount || 0),
          balance: parseFloat(row.balance || 0),
          status: row.payment_status
        },
        items: items || []
      });
    } else {
      return res.json({ status: "error", message: "No billing found" });
    }

  } catch (error) {
    console.error("Get student billing error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// PROCESS ONLINE BILLING PAYMENT (SAVE LOG)
export const processPayment = async (req, res) => {
  const { studentId, amount, method, fee_category } = req.body;

  if (!studentId || !amount) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO payments (student_id, amount_paid, payment_method, fee_category, transaction_date) 
      VALUES (?, ?, ?, ?, NOW())
    `;

    await pool.query(query, [studentId, amount, method || '', fee_category || '']);

    return res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      category_saved: fee_category || ''
    });

  } catch (error) {
    console.error("Process payment error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default { getStudentBilling, processPayment };
