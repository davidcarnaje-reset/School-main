import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

export const fetchScholarships = async (req, res) => {
  try {
    const query = "SELECT * FROM scholarships_catalog WHERE status = 'Active' ORDER BY id DESC";
    const [rows] = await pool.query(query);
    const formatted = (rows || []).map(r => ({
      ...r,
      discount_value: parseFloat(r.discount_value)
    }));
    return res.json(formatted);
  } catch (error) {
    console.error("fetchScholarships error:", error);
    return res.status(500).json({ status: "error", message: "Database connection failed: " + error.message });
  }
};

export const manageScholarships = async (req, res) => {
  const method = req.method;

  try {
    if (method === 'GET') {
      const [list] = await pool.query("SELECT * FROM scholarships_catalog WHERE status = 'Active' ORDER BY id DESC");
      const formatted = (list || []).map(row => ({
        ...row,
        discount_value: parseFloat(row.discount_value)
      }));
      return res.json(formatted);
    }

    if (method === 'POST') {
      const { action, code, name, discount_type, discount_value, description = null, id } = req.body;
      if (!action) {
        return res.status(400).json({ status: "error", message: "Invalid Request: Action is required." });
      }

      const val = parseFloat(discount_value) || 0;

      if (action === 'add' || action === 'edit') {
        if (!code || !name || !discount_type) {
          return res.status(400).json({ status: "error", message: "Code, Name, and Discount Type are required." });
        }

        if (action === 'add') {
          const connection = await pool.getConnection();
          try {
            await connection.beginTransaction();

            const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM scholarships_catalog FOR UPDATE");
            const nextId = maxIdRows[0].maxId + 1;

            const sql = `
              INSERT INTO scholarships_catalog (id, code, name, discount_type, discount_value, description, status) 
              VALUES (?, ?, ?, ?, ?, ?, 'Active')
            `;
            await connection.query(sql, [nextId, code.trim(), name.trim(), discount_type.trim(), val, description]);

            await connection.commit();
            await logAuditTrail(
              req.user?.id || 1,
              req.user?.role || 'Cashier',
              "CREATE_SCHOLARSHIP",
              `Created scholarship: ${name} (Code: ${code}, Discount: ${val} ${discount_type})`,
              req
            );
            return res.json({ status: "success", message: "Scholarship created!" });
          } catch (e) {
            await connection.rollback();
            throw e;
          } finally {
            connection.release();
          }
        } else {
          if (!id) {
            return res.status(400).json({ status: "error", message: "Scholarship ID is required for editing." });
          }
          const sql = `
            UPDATE scholarships_catalog 
            SET code = ?, name = ?, discount_type = ?, discount_value = ?, description = ? 
            WHERE id = ?
          `;
          await pool.query(sql, [code.trim(), name.trim(), discount_type.trim(), val, description, parseInt(id, 10)]);
          await logAuditTrail(
            req.user?.id || 1,
            req.user?.role || 'Cashier',
            "UPDATE_SCHOLARSHIP",
            `Updated scholarship ID: ${id} to name: ${name} (Code: ${code}, Discount: ${val} ${discount_type})`,
            req
          );
          return res.json({ status: "success", message: "Scholarship updated!" });
        }
      }

      if (action === 'delete') {
        if (!id) {
          return res.status(400).json({ status: "error", message: "Scholarship ID is required for deactivation." });
        }
        await pool.query("UPDATE scholarships_catalog SET status = 'Inactive' WHERE id = ?", [parseInt(id, 10)]);
        await logAuditTrail(
          req.user?.id || 1,
          req.user?.role || 'Cashier',
          "DELETE_SCHOLARSHIP",
          `Deactivated/deleted scholarship ID: ${id}`,
          req
        );
        return res.json({ status: "success", message: "Scholarship deactivated!" });
      }
    }
  } catch (error) {
    console.error("manageScholarships error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getStudentScholarships = async (req, res) => {
  const student_id = req.query.id || req.query.student_id;

  if (!student_id) {
    return res.status(400).json({ status: "error", message: "Student ID is required" });
  }

  try {
    const sql = `
      SELECT 
        sa.id, 
        sc.name AS scholarship_name, 
        sc.discount_type, 
        sc.discount_value AS value
      FROM scholarship_applications sa
      JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
      WHERE sa.student_id = ? AND sa.status = 'Approved'
    `;
    const [data] = await pool.query(sql, [student_id]);
    return res.json({ status: "success", data: data || [] });
  } catch (error) {
    console.error("getStudentScholarships error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const getAllApprovedScholarships = async (req, res) => {
  try {
    const sql = `
      SELECT 
        sa.id, 
        sa.student_id, 
        CONCAT(s.first_name, ' ', s.last_name) AS student_name, 
        sc.name AS scholarship_name, 
        sc.discount_type, 
        sc.discount_value 
      FROM scholarship_applications sa
      JOIN students s ON sa.student_id = s.student_id
      JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
      WHERE sa.status = 'Approved'
    `;
    const [data] = await pool.query(sql);
    return res.json(data || []);
  } catch (error) {
    console.error("getAllApprovedScholarships error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const applyScholarshipToBilling = async (req, res) => {
  const { application_id, student_id, discount_value, discount_type, scholarship_name = 'Scholarship Grant' } = req.body;

  if (!application_id || !student_id || discount_value === undefined || !discount_type) {
    return res.status(400).json({ status: "error", message: "Missing required parameters." });
  }

  const val = parseFloat(discount_value);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get student billing summary
    const [billingRows] = await connection.query(
      "SELECT id, balance FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [student_id]
    );

    if (billingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: "error", message: "No active billing found for this student." });
    }

    const billing_id = billingRows[0].id;
    const old_balance = parseFloat(billingRows[0].balance);

    // Get unpaid/partially paid billing items
    const [items] = await connection.query(
      `SELECT id, item_name, amount, paid_amount FROM student_billing_items 
       WHERE billing_id = ? AND (amount - paid_amount) > 0 
       ORDER BY CASE WHEN item_name LIKE '%Tuition%' THEN 0 ELSE 1 END`,
      [billing_id]
    );

    const applied_details = [];
    let total_grant_used = 0;

    if (discount_type === 'Percentage') {
      for (const item of items) {
        if (item.item_name.toLowerCase().includes('tuition')) {
          const current_tuition_balance = parseFloat(item.amount) - parseFloat(item.paid_amount);
          const computed_discount = current_tuition_balance * (val / 100);

          await connection.query(
            "UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ?",
            [computed_discount, item.id]
          );

          applied_details.push({
            item_name: item.item_name,
            discount: computed_discount
          });
          total_grant_used = computed_discount;

          // Manual ID lookup for payments
          const [maxPayIdRows] = await connection.query("SELECT COALESCE(MAX(payment_id), 0) AS maxId FROM payments FOR UPDATE");
          const nextPayId = maxPayIdRows[0].maxId + 1;

          await connection.query(
            "INSERT INTO payments (payment_id, student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, ?, 'Scholarship', ?, NOW())",
            [nextPayId, student_id, computed_discount, item.item_name]
          );
          break;
        }
      }
    } else {
      let remaining_grant = val;
      for (const item of items) {
        if (remaining_grant <= 0) break;
        const item_balance = parseFloat(item.amount) - parseFloat(item.paid_amount);
        const apply = Math.min(remaining_grant, item_balance);

        await connection.query(
          "UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ?",
          [apply, item.id]
        );

        applied_details.push({ item_name: item.item_name, discount: apply });
        total_grant_used += apply;

        // Manual ID lookup for payments
        const [maxPayIdRows] = await connection.query("SELECT COALESCE(MAX(payment_id), 0) AS maxId FROM payments FOR UPDATE");
        const nextPayId = maxPayIdRows[0].maxId + 1;

        await connection.query(
          "INSERT INTO payments (payment_id, student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, ?, 'Scholarship', ?, NOW())",
          [nextPayId, student_id, apply, item.item_name]
        );

        remaining_grant -= apply;
      }
    }

    // 2. Recalculate billing balance
    const [totalsRows] = await connection.query(
      "SELECT SUM(amount) as total_bill, SUM(paid_amount) as total_paid FROM student_billing_items WHERE billing_id = ?",
      [billing_id]
    );
    const total_bill = parseFloat(totalsRows[0].total_bill || 0);
    const total_paid = parseFloat(totalsRows[0].total_paid || 0);
    const new_balance = total_bill - total_paid;

    await connection.query(
      "UPDATE student_billing SET paid_amount = ?, balance = ?, payment_status = ? WHERE id = ?",
      [total_paid, new_balance, (new_balance <= 0 ? 'Fully Paid' : 'Partially Paid'), billing_id]
    );

    // 3. Mark application status as 'Applied'
    await connection.query("UPDATE scholarship_applications SET status = 'Applied' WHERE id = ?", [parseInt(application_id, 10)]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Cashier',
      "APPLY_SCHOLARSHIP_BILLING",
      `Applied scholarship: ${scholarship_name} to student ID: ${student_id}. Deducted amount: ₱${total_grant_used}`,
      req
    );

    return res.json({
      status: "success",
      old_balance,
      new_balance,
      total_deduction: total_grant_used,
      applied_items: applied_details
    });

  } catch (error) {
    await connection.rollback();
    console.error("applyScholarshipToBilling error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};
