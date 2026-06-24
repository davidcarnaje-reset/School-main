import pool from '../../config/db.js';

const processBillingPayment = async (req, res) => {
  const { student_id, allocations, mark_as_enrolled } = req.body;

  if (!student_id || !allocations) {
    return res.status(400).json({ status: "error", message: "Incomplete data sent to server." });
  }

  // Kumuha ng connection mula sa pool para sa transaction
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Hanapin muna ang billing_id ng student (yung pinaka-latest)
    const [billingRows] = await connection.query(
      "SELECT id FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1",
      [student_id]
    );
    const billing = billingRows[0];

    if (!billing) {
      throw new Error("Walang nahanap na billing record para sa student na ito.");
    }
    const billing_id = billing.id;

    // 2. I-process ang bawat allocation (Ina-update ang bawat sub-item at isinusulat sa transaction log)
    for (const [item_id, pay_amount_raw] of Object.entries(allocations)) {
      const pay_amount = parseFloat(pay_amount_raw);
      if (isNaN(pay_amount) || pay_amount <= 0) continue;

      // UPDATE: Dagdagan ang paid_amount sa breakdown table
      await connection.query(
        "UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ? AND billing_id = ?",
        [pay_amount, item_id, billing_id]
      );

      // KUNIN ANG ITEM NAME PARA SA HISTORY RECORD
      const [itemRows] = await connection.query(
        "SELECT item_name FROM student_billing_items WHERE id = ?",
        [item_id]
      );
      const item_name = itemRows[0] ? itemRows[0].item_name : 'School Fee';

      // INSERT SA PAYMENTS TABLE (Recent Transactions list sa UI)
      await connection.query(
        "INSERT INTO payments (student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, 'Cash', ?, NOW())",
        [student_id, pay_amount, item_name]
      );
    }

    // 3. THE MASTER SYNC LOGIC: Re-calculate summary mula sa billing items upang maiwasan ang calculation discrepancies
    const [syncRows] = await connection.query(
      "SELECT SUM(amount) as total_bill, SUM(paid_amount) as total_paid FROM student_billing_items WHERE billing_id = ?",
      [billing_id]
    );
    const totals = syncRows[0] || { total_bill: 0, total_paid: 0 };

    const new_total_amount = parseFloat(totals.total_bill) || 0;
    const new_paid_amount = parseFloat(totals.total_paid) || 0;
    const new_balance = new_total_amount - new_paid_amount;
    
    // Status logic
    const new_status = (new_balance <= 0) ? 'Fully Paid' : 'Partially Paid';

    // 4. I-UPDATE NA ANG SUMMARY TABLE (student_billing)
    await connection.query(
      "UPDATE student_billing SET total_amount = ?, paid_amount = ?, balance = ?, payment_status = ? WHERE id = ?",
      [new_total_amount, new_paid_amount, new_balance, new_status, billing_id]
    );

    // 5. UPDATE ENROLLMENT STATUS BASE SA CHECKBOX
    if (mark_as_enrolled === true) {
      await connection.query(
        "UPDATE enrollments SET status = 'Enrolled' WHERE student_id = ? AND status = 'Assessed'",
        [student_id]
      );
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Payment processed and accounts synchronized!",
      new_balance: new_balance
    });

  } catch (error) {
    await connection.rollback();
    console.error("Process billing payment error:", error);
    return res.json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

export default processBillingPayment;
