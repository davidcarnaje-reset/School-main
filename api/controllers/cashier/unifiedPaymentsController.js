import pool from '../../config/db.js';
import { sendOfficialEnrollmentSuccessEmail } from '../../utils/emailEngine.js';
import { syncStudentEnrolledClasses } from '../../utils/lmsSync.js';

// Helper to categorize level based on grade_level and department
export const detectEducationLevel = (gradeLevel, department, programCode) => {
  const gl = (gradeLevel || '').toLowerCase().trim();
  const dept = (department || '').toLowerCase().trim();
  const prog = (programCode || '').toLowerCase().trim();

  if (gl.includes('nursery') || gl.includes('kinder') || gl.includes('prep') || gl.includes('preschool')) {
    return 'Preschool';
  }
  if (dept === 'college' || gl.includes('year') || prog.length > 0) {
    return 'College';
  }
  if (gl.includes('grade 11') || gl.includes('grade 12') || dept === 'shs' || gl.includes('senior')) {
    return 'SHS';
  }
  if (gl.includes('grade 7') || gl.includes('grade 8') || gl.includes('grade 9') || gl.includes('grade 10') || 
      gl.includes('junior') || gl.includes('jhs') || gl.includes('high school')) {
    return 'HS';
  }
  if (gl.includes('grade 1') || gl.includes('grade 2') || gl.includes('grade 3') || 
      gl.includes('grade 4') || gl.includes('grade 5') || gl.includes('grade 6') || gl.includes('elem')) {
    return 'Elementary';
  }
  return 'Elementary';
};

/**
 * GET /cashier/get_process_payment_students.php
 * Fetches students with pending payments / assessed enrollments / service requests
 */
export const getProcessPaymentStudents = async (req, res) => {
  const { level = 'ALL', search = '', limit = 10, tab = 'all' } = req.query;

  try {
    let sql = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        s.profile_image,
        e.id as enrollment_id,
        e.grade_level,
        e.status as enrollment_status,
        e.school_year,
        e.payment_plan,
        ap.department,
        ap.program_code,
        ap.program_description,
        b.id as billing_id,
        COALESCE(b.total_amount, 0) as total_amount,
        COALESCE(b.paid_amount, 0) as paid_amount,
        COALESCE(b.balance, 0) as balance,
        COALESCE(b.payment_status, 'Unpaid') as payment_status,
        (
          SELECT COUNT(*) 
          FROM service_requests sr 
          WHERE sr.student_id = s.student_id AND sr.status = 'Pending Payment'
        ) as pending_services_count,
        (
          SELECT COUNT(*) 
          FROM promissory_notes pn 
          WHERE pn.student_id = s.student_id AND pn.status = 'Active'
        ) as active_pn_count
      FROM students s
      LEFT JOIN (
        SELECT e1.*
        FROM enrollments e1
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id
          FROM enrollments
          GROUP BY student_id
        ) e2 ON e1.id = e2.max_id
      ) e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      LEFT JOIN (
        SELECT b1.*
        FROM student_billing b1
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id
          FROM student_billing
          GROUP BY student_id
        ) b2 ON b1.id = b2.max_id
      ) b ON s.student_id = b.student_id
      WHERE (
        e.status = 'Assessed' 
        OR COALESCE(b.balance, 0) > 0 
        OR EXISTS (SELECT 1 FROM service_requests sr2 WHERE sr2.student_id = s.student_id AND sr2.status = 'Pending Payment')
        OR EXISTS (SELECT 1 FROM promissory_notes pn2 WHERE pn2.student_id = s.student_id AND pn2.status = 'Active')
      )
    `;

    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        s.student_id LIKE ? OR 
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        CONCAT(s.first_name, ' ', s.last_name) LIKE ? OR
        CONCAT(s.last_name, ', ', s.first_name) LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    // Filter by tab if applicable
    if (tab === 'services') {
      sql += ` AND EXISTS (SELECT 1 FROM service_requests sr3 WHERE sr3.student_id = s.student_id AND sr3.status = 'Pending Payment')`;
    } else if (tab === 'arrears') {
      sql += ` AND (COALESCE(b.balance, 0) > 0 OR EXISTS (SELECT 1 FROM promissory_notes pn3 WHERE pn3.student_id = s.student_id))`;
    }

    sql += ` ORDER BY (e.status = 'Assessed') DESC, b.balance DESC, s.id DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 10);

    const [rows] = await pool.query(sql, params);

    // Filter by level in JS using detectEducationLevel
    const processed = (rows || []).map(row => {
      const detected = detectEducationLevel(row.grade_level, row.department, row.program_code);
      return {
        ...row,
        detected_level: detected,
        total_amount: parseFloat(row.total_amount) || 0,
        paid_amount: parseFloat(row.paid_amount) || 0,
        balance: parseFloat(row.balance) || 0,
        pending_services_count: parseInt(row.pending_services_count, 10) || 0,
        active_pn_count: parseInt(row.active_pn_count, 10) || 0,
      };
    });

    const filtered = level === 'ALL' 
      ? processed 
      : processed.filter(r => r.detected_level.toLowerCase() === level.toLowerCase());

    return res.json({
      status: "success",
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    console.error("getProcessPaymentStudents error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /cashier/get_student_payable_details.php
 * Fetches full billable details for a given student (tuition items, service requests, promissory notes)
 */
export const getStudentPayableDetails = async (req, res) => {
  const { id } = req.query;

  if (!id || !id.trim()) {
    return res.status(400).json({ status: "error", message: "Student ID is required." });
  }

  const cleanId = id.trim();

  try {
    // 1. Fetch student
    const [sRows] = await pool.query(
      `SELECT s.*, 
        e.id as enrollment_id, e.grade_level, e.status as enrollment_status, e.school_year, e.payment_plan,
        ap.department, ap.program_code, ap.program_description,
        sec.section_name
       FROM students s
       LEFT JOIN (
         SELECT e1.*
         FROM enrollments e1
         INNER JOIN (
           SELECT student_id, MAX(id) as max_id FROM enrollments GROUP BY student_id
         ) e2 ON e1.id = e2.max_id
       ) e ON s.student_id = e.student_id
       LEFT JOIN academic_programs ap ON e.program_id = ap.id
       LEFT JOIN sections sec ON e.section_id = sec.id
       WHERE s.student_id = ? OR CONCAT(s.first_name, ' ', s.last_name) LIKE ?
       LIMIT 1`,
      [cleanId, `%${cleanId}%`]
    );

    if (sRows.length === 0) {
      return res.json({ status: "error", message: "Student not found with ID: " + cleanId });
    }

    const student = sRows[0];
    const actualStudentId = student.student_id;
    student.detected_level = detectEducationLevel(student.grade_level, student.department, student.program_code);

    // 2. Fetch billing summary & items
    const [bRows] = await pool.query(
      `SELECT * FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
      [actualStudentId]
    );

    let billing = bRows[0] || null;
    let billingItems = [];

    if (billing) {
      const [items] = await pool.query(
        `SELECT id, billing_id, fee_id, item_name, 
                CAST(amount AS DECIMAL(10,2)) as amount, 
                CAST(paid_amount AS DECIMAL(10,2)) as paid_amount,
                CAST((amount - paid_amount) AS DECIMAL(10,2)) as balance_remaining
         FROM student_billing_items 
         WHERE billing_id = ?`,
        [billing.id]
      );
      billingItems = items || [];
    }

    // 3. Fetch pending service requests
    const [serviceReqs] = await pool.query(
      `SELECT sr.id, sr.status, fc.item_name, CAST(fc.amount AS DECIMAL(10,2)) as amount
       FROM service_requests sr
       JOIN fees_catalog fc ON sr.fee_id = fc.id
       WHERE sr.student_id = ? AND sr.status = 'Pending Payment'`,
      [actualStudentId]
    );

    // 4. Fetch active promissory notes
    const [promissoryNotes] = await pool.query(
      `SELECT * FROM promissory_notes WHERE student_id = ? ORDER BY id DESC`,
      [actualStudentId]
    );

    // 5. Fetch recent payment history
    const [history] = await pool.query(
      `SELECT payment_id, transaction_date, amount_paid, payment_method, fee_category 
       FROM payments 
       WHERE student_id = ? 
       ORDER BY transaction_date DESC LIMIT 5`,
      [actualStudentId]
    );

    return res.json({
      status: "success",
      student: {
        student_id: student.student_id,
        first_name: student.first_name,
        last_name: student.last_name,
        full_name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        mobile_no: student.mobile_no,
        profile_image: student.profile_image,
        grade_level: student.grade_level || 'N/A',
        department: student.department || 'Basic Education',
        detected_level: student.detected_level,
        program_code: student.program_code,
        section_name: student.section_name,
        enrollment_status: student.enrollment_status || 'N/A',
        school_year: student.school_year || '2026-2027',
      },
      billing: billing ? {
        id: billing.id,
        total_amount: parseFloat(billing.total_amount) || 0,
        paid_amount: parseFloat(billing.paid_amount) || 0,
        balance: parseFloat(billing.balance) || 0,
        payment_status: billing.payment_status || 'Unpaid',
      } : null,
      billing_items: billingItems.map(item => ({
        ...item,
        amount: parseFloat(item.amount) || 0,
        paid_amount: parseFloat(item.paid_amount) || 0,
        balance_remaining: Math.max(0, (parseFloat(item.amount) || 0) - (parseFloat(item.paid_amount) || 0))
      })),
      service_requests: (serviceReqs || []).map(sr => ({
        ...sr,
        amount: parseFloat(sr.amount) || 0
      })),
      promissory_notes: promissoryNotes || [],
      recent_payments: history || []
    });

  } catch (error) {
    console.error("getStudentPayableDetails error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /cashier/process_unified_payment.php
 * Handles processing of enrollment fees, tuition, and/or document requests in a single transaction
 */
export const processUnifiedPayment = async (req, res) => {
  const {
    student_id,
    allocations = {}, // { [billing_item_id]: amount }
    service_request_ids = [], // [id1, id2]
    payment_method = 'Cash',
    reference_no = '',
    amount_tendered = 0,
    mark_as_enrolled = true,
    cashier_name = 'Cashier Officer'
  } = req.body;

  if (!student_id) {
    return res.status(400).json({ status: "error", message: "Student ID is required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalPaidThisTransaction = 0;
    const paidItemsReceipt = [];

    // 1. Process Billing Items (Tuition / Enrollment Fees)
    const [bRows] = await connection.query(
      "SELECT id FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [student_id]
    );

    if (bRows.length > 0 && Object.keys(allocations).length > 0) {
      const billing_id = bRows[0].id;

      for (const [itemId, payAmtRaw] of Object.entries(allocations)) {
        const payAmount = parseFloat(payAmtRaw);
        if (isNaN(payAmount) || payAmount <= 0) continue;

        // Update item paid amount
        await connection.query(
          "UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ? AND billing_id = ?",
          [payAmount, itemId, billing_id]
        );

        // Fetch item description
        const [itemInfo] = await connection.query(
          "SELECT item_name FROM student_billing_items WHERE id = ?",
          [itemId]
        );
        const itemName = itemInfo[0]?.item_name || 'School Fee';

        // Log into payments
        const [maxPayIdRows] = await connection.query("SELECT COALESCE(MAX(payment_id), 0) AS maxId FROM payments FOR UPDATE");
        const nextPayId = (parseInt(maxPayIdRows[0]?.maxId, 10) || 0) + 1;

        await connection.query(
          "INSERT INTO payments (payment_id, student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, ?, ?, ?, NOW())",
          [nextPayId, student_id, payAmount, payment_method, itemName]
        );

        totalPaidThisTransaction += payAmount;
        paidItemsReceipt.push({
          item_name: itemName,
          amount: payAmount,
          category: 'Enrollment / Tuition'
        });
      }

      // Re-sync student_billing totals
      const [syncRows] = await connection.query(
        "SELECT SUM(amount) as total_bill, SUM(paid_amount) as total_paid FROM student_billing_items WHERE billing_id = ?",
        [billing_id]
      );
      const totals = syncRows[0] || { total_bill: 0, total_paid: 0 };
      const newTotal = parseFloat(totals.total_bill) || 0;
      const newPaid = parseFloat(totals.total_paid) || 0;
      const newBal = Math.max(0, newTotal - newPaid);
      const newStatus = newBal <= 0 ? 'Fully Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');

      await connection.query(
        "UPDATE student_billing SET total_amount = ?, paid_amount = ?, balance = ?, payment_status = ? WHERE id = ?",
        [newTotal, newPaid, newBal, newStatus, billing_id]
      );
    }

    // 2. Process Service Requests (Documents / Certs)
    if (Array.isArray(service_request_ids) && service_request_ids.length > 0) {
      for (const sId of service_request_ids) {
        const [sRows] = await connection.query(
          `SELECT sr.student_id, fc.amount, fc.item_name 
           FROM service_requests sr
           JOIN fees_catalog fc ON sr.fee_id = fc.id
           WHERE sr.id = ? AND sr.status = 'Pending Payment'`,
          [parseInt(sId, 10)]
        );

        if (sRows.length > 0) {
          const reqItem = sRows[0];
          const reqAmt = parseFloat(reqItem.amount) || 0;

          await connection.query("UPDATE service_requests SET status = 'Paid' WHERE id = ?", [parseInt(sId, 10)]);

          const [maxPayIdRows] = await connection.query("SELECT COALESCE(MAX(payment_id), 0) AS maxId FROM payments FOR UPDATE");
          const nextPayId = (parseInt(maxPayIdRows[0]?.maxId, 10) || 0) + 1;

          await connection.query(
            "INSERT INTO payments (payment_id, student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, ?, ?, ?, NOW())",
            [nextPayId, student_id, reqAmt, payment_method, 'Service: ' + reqItem.item_name]
          );

          totalPaidThisTransaction += reqAmt;
          paidItemsReceipt.push({
            item_name: reqItem.item_name,
            amount: reqAmt,
            category: 'Service / Document'
          });
        }
      }
    }

    // 3. Official Enrollment Trigger
    if (mark_as_enrolled === true) {
      await connection.query(
        "UPDATE enrollments SET status = 'Enrolled' WHERE student_id = ? AND status = 'Assessed'",
        [student_id]
      );

      // Auto-sync LMS enrolled classes
      syncStudentEnrolledClasses(student_id).catch(err => {
        console.error("LMS auto-sync non-fatal error:", err.message);
      });

      // Email notification (non-blocking)
      const [studRows] = await connection.query(
        "SELECT email, first_name, last_name FROM students WHERE student_id = ? LIMIT 1",
        [student_id]
      );
      if (studRows.length > 0 && studRows[0].email) {
        const s = studRows[0];
        const sName = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        sendOfficialEnrollmentSuccessEmail(s.email, sName, student_id, req).catch(err => {
          console.error("Enrollment email non-fatal error:", err.message);
        });
      }
    }

    await connection.commit();

    // Generate Official Receipt details
    const orNumber = 'OR-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
    const receiptData = {
      or_number: orNumber,
      student_id,
      payment_method,
      reference_no,
      amount_paid: totalPaidThisTransaction,
      amount_tendered: Math.max(parseFloat(amount_tendered) || totalPaidThisTransaction, totalPaidThisTransaction),
      change_amount: Math.max(0, (parseFloat(amount_tendered) || totalPaidThisTransaction) - totalPaidThisTransaction),
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      cashier: cashier_name,
      items: paidItemsReceipt
    };

    return res.json({
      status: "success",
      message: "Payment processed successfully!",
      receipt: receiptData
    });

  } catch (error) {
    await connection.rollback();
    console.error("processUnifiedPayment error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * GET /cashier/get_promissory_notes.php
 * Fetches all promissory notes with student and balance details
 */
export const getPromissoryNotes = async (req, res) => {
  const { status = 'ALL', search = '', limit = 10 } = req.query;

  try {
    let sql = `
      SELECT 
        pn.*,
        s.first_name,
        s.last_name,
        s.email,
        e.grade_level,
        ap.department,
        ap.program_code,
        b.balance as current_balance
      FROM promissory_notes pn
      JOIN students s ON pn.student_id = s.student_id
      LEFT JOIN (
        SELECT e1.*
        FROM enrollments e1
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id FROM enrollments GROUP BY student_id
        ) e2 ON e1.id = e2.max_id
      ) e ON s.student_id = e.student_id
      LEFT JOIN academic_programs ap ON e.program_id = ap.id
      LEFT JOIN (
        SELECT b1.*
        FROM student_billing b1
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id FROM student_billing GROUP BY student_id
        ) b2 ON b1.id = b2.max_id
      ) b ON s.student_id = b.student_id
      WHERE 1=1
    `;

    const params = [];

    if (status !== 'ALL') {
      sql += ` AND pn.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        s.student_id LIKE ? OR 
        s.first_name LIKE ? OR 
        s.last_name LIKE ? OR 
        CONCAT(s.first_name, ' ', s.last_name) LIKE ?
      )`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY pn.id DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 10);

    const [rows] = await pool.query(sql, params);

    const formatted = (rows || []).map(r => ({
      ...r,
      detected_level: detectEducationLevel(r.grade_level, r.department, r.program_code),
      total_balance: parseFloat(r.total_balance) || 0,
      promised_amount: parseFloat(r.promised_amount) || 0,
      current_balance: parseFloat(r.current_balance) || 0,
      due_date_formatted: new Date(r.due_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));

    return res.json({
      status: "success",
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error("getPromissoryNotes error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /cashier/save_promissory_note.php
 * Creates a new Promissory Note / Arrears agreement
 */
export const savePromissoryNote = async (req, res) => {
  const {
    student_id,
    total_balance,
    promised_amount,
    due_date,
    reason,
    notes,
    allow_enrollment = false,
    processed_by = 'Cashier Officer'
  } = req.body;

  if (!student_id || !due_date || !promised_amount) {
    return res.status(400).json({ status: "error", message: "Student, promised amount, and due date are required." });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get student enrollment id if available
    const [eRows] = await connection.query(
      "SELECT id FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1",
      [student_id]
    );
    const enrollmentId = eRows[0]?.id || null;

    // 2. Insert promissory note
    const [result] = await connection.query(
      `INSERT INTO promissory_notes (student_id, enrollment_id, total_balance, promised_amount, due_date, reason, notes, processed_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        student_id,
        enrollmentId,
        parseFloat(total_balance) || 0,
        parseFloat(promised_amount) || 0,
        due_date,
        reason || 'Educational Financial Hardship',
        notes || '',
        processed_by
      ]
    );

    // 3. If allow_enrollment, officially mark enrollment as 'Enrolled'
    if (allow_enrollment === true && enrollmentId) {
      await connection.query(
        "UPDATE enrollments SET status = 'Enrolled' WHERE id = ? AND status = 'Assessed'",
        [enrollmentId]
      );

      // Auto-sync LMS enrolled classes
      syncStudentEnrolledClasses(studentId).catch(err => {
        console.error("LMS auto-sync non-fatal error:", err.message);
      });
    }

    await connection.commit();

    return res.json({
      status: "success",
      message: "Promissory note created successfully!",
      id: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error("savePromissoryNote error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  } finally {
    connection.release();
  }
};

/**
 * POST /cashier/settle_promissory_note.php
 * Settles a promissory note
 */
export const settlePromissoryNote = async (req, res) => {
  const { note_id, remarks = '' } = req.body;

  if (!note_id) {
    return res.status(400).json({ status: "error", message: "Promissory note ID is required." });
  }

  try {
    await pool.query(
      "UPDATE promissory_notes SET status = 'Settled', notes = CONCAT(COALESCE(notes, ''), ' [Settled: ', ?, ']') WHERE id = ?",
      [remarks || 'Fully Settled', parseInt(note_id, 10)]
    );

    return res.json({
      status: "success",
      message: "Promissory note marked as Settled!"
    });
  } catch (error) {
    console.error("settlePromissoryNote error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
