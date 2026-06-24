import pool from '../../config/db.js';

const getMessages = async (req, res) => {
  const { user_id, user_role, contact_id, contact_role } = req.query;

  if (!user_id || !user_role || !contact_id || !contact_role) {
    return res.status(400).json({ status: "error", message: "Missing required parameters" });
  }

  try {
    // 1. I-UPDATE ANG MGA UNREAD MESSAGES TO "READ"
    const updateQuery = `
      UPDATE messages 
      SET is_read = 1 
      WHERE sender_id = ? AND sender_role = ? 
        AND receiver_id = ? AND receiver_role = ? 
        AND is_read = 0
    `;
    await pool.query(updateQuery, [contact_id, contact_role, user_id, user_role]);

    // 2. KUNIN ANG BUONG CONVERSATION HISTORY (Ordered from Oldest to Newest)
    const selectQuery = `
      SELECT 
          id, 
          sender_id, 
          sender_role, 
          message, 
          is_read, 
          created_at 
      FROM messages
      WHERE (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
         OR (sender_id = ? AND sender_role = ? AND receiver_id = ? AND receiver_role = ?)
      ORDER BY created_at ASC
    `;
    const [rows] = await pool.query(selectQuery, [
      user_id, user_role, contact_id, contact_role,
      contact_id, contact_role, user_id, user_role
    ]);

    // 3. I-FORMAT ANG DATA PARA SA REACT CONVENIENCE
    const formattedMessages = rows.map(msg => {
      const isYou = String(msg.sender_id) === String(user_id) && String(msg.sender_role) === String(user_role);

      let timeStr = '';
      let dateStr = '';
      if (msg.created_at) {
        const dateObj = new Date(msg.created_at);
        if (!isNaN(dateObj.getTime())) {
          // Format time: "hh:mm AM/PM" (e.g. "02:30 PM")
          let hours = dateObj.getHours();
          const minutes = dateObj.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;

          // Format date: "YYYY-MM-DD"
          const y = dateObj.getFullYear();
          const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const d = dateObj.getDate().toString().padStart(2, '0');
          dateStr = `${y}-${m}-${d}`;
        }
      }

      return {
        id: msg.id,
        text: msg.message,
        is_you: isYou,
        time: timeStr,
        date: dateStr,
        is_read: Boolean(msg.is_read)
      };
    });

    return res.json({
      status: "success",
      data: formattedMessages
    });

  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default getMessages;
