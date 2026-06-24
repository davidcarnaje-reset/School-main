import pool from '../../config/db.js';

const sendMessage = async (req, res) => {
  const { sender_id, sender_role, receiver_id, receiver_role, message } = req.body;

  if (!sender_id || !receiver_id) {
    return res.status(400).json({ status: "error", message: "Incomplete payload" });
  }

  // Kuhanin ang kasalukuyang petsa sa format na YYYY-MM-DD
  const dateObj = new Date();
  const y = dateObj.getFullYear();
  const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const d = dateObj.getDate().toString().padStart(2, '0');
  const today = `${y}-${m}-${d}`;

  try {
    // GATEKEEPER LOGIC: Check limits if Student is messaging Staff
    if (sender_role === 'student' && ['teacher', 'registrar', 'cashier', 'admin'].includes(receiver_role)) {
      // 1. Tumingin sa user_settings table
      const [settingsRows] = await pool.query(
        "SELECT msg_limit_active, msg_limit_per_day FROM user_settings WHERE user_id = ? AND user_role = ?",
        [receiver_id, receiver_role]
      );
      const staffSettings = settingsRows[0];

      // Default fallback kung wala pang record
      const isLimitActive = staffSettings ? parseInt(staffSettings.msg_limit_active, 10) : 1;
      const limitPerDay = staffSettings ? parseInt(staffSettings.msg_limit_per_day, 10) : 3;

      if (isLimitActive === 1) {
        // 2. Bilangin kung nakailang message na ang student na ito sa staff TODAY
        const [limitsRows] = await pool.query(
          "SELECT message_count FROM message_limits WHERE student_id = ? AND staff_id = ? AND message_date = ?",
          [sender_id, receiver_id, today]
        );
        const currentLimit = limitsRows[0];
        const currentCount = currentLimit ? parseInt(currentLimit.message_count, 10) : 0;

        // 3. I-block kung umabot na sa limit
        if (currentCount >= limitPerDay) {
          return res.json({
            status: "error",
            error_code: "LIMIT_REACHED",
            message: `You have reached the daily message limit (${limitPerDay}) for this staff member. Please try again tomorrow.`
          });
        }

        // 4. Update or Insert limit tracker
        if (currentLimit) {
          await pool.query(
            "UPDATE message_limits SET message_count = message_count + 1 WHERE student_id = ? AND staff_id = ? AND message_date = ?",
            [sender_id, receiver_id, today]
          );
        } else {
          await pool.query(
            "INSERT INTO message_limits (student_id, staff_id, message_date, message_count) VALUES (?, ?, ?, 1)",
            [sender_id, receiver_id, today]
          );
        }
      }
    }

    // 5. I-SAVE ANG MESSAGE SA DATABASE
    await pool.query(
      "INSERT INTO messages (sender_id, sender_role, receiver_id, receiver_role, message) VALUES (?, ?, ?, ?, ?)",
      [sender_id, sender_role, receiver_id, receiver_role, message]
    );

    return res.json({
      status: "success",
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default sendMessage;
