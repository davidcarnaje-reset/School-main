import pool from '../../config/db.js';

const getBillingDetails = async (req, res) => {
  const search = req.query.id || '';

  if (!search) {
    return res.status(400).json({ status: "error", message: "Student ID is required." });
  }

  try {
    // 1. Kunin ang pinaka-latest na billing summary ng student
    const sql_billing = `
      SELECT b.id, b.student_id, b.total_amount, b.paid_amount, b.balance, 
             b.payment_status, s.first_name, s.last_name
      FROM student_billing b
      JOIN students s ON b.student_id = s.student_id
      WHERE b.student_id = ? 
      ORDER BY b.id DESC 
      LIMIT 1
    `;
    const [billingRows] = await pool.query(sql_billing, [search]);
    const billing = billingRows[0];

    if (!billing) {
      return res.json({ status: "error", message: "No billing record found for this ID." });
    }

    // 2. Kunin ang lahat ng items para sa billing_id na ito
    const sql_items = `
      SELECT id, item_name, amount, paid_amount 
      FROM student_billing_items 
      WHERE billing_id = ?
    `;
    const [items] = await pool.query(sql_items, [billing.id]);

    // 3. History/Recent Payments
    const sql_history = `
      SELECT transaction_date, amount_paid, payment_method, fee_category 
      FROM payments 
      WHERE student_id = ? 
      ORDER BY transaction_date DESC 
      LIMIT 5
    `;
    const [history] = await pool.query(sql_history, [search]);

    return res.json({
      status: "success",
      summary: billing,
      items: items || [],
      recent_payments: history || []
    });

  } catch (error) {
    console.error("Get billing details error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default getBillingDetails;
