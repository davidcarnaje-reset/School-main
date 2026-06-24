import pool from '../../config/db.js';

const getContacts = async (req, res) => {
  const { user_id, user_role } = req.query;

  if (!user_id || !user_role) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    const query = `
      WITH RankedMessages AS (
          SELECT 
              IF(sender_id = ? AND sender_role = ?, receiver_id, sender_id) AS contact_id,
              IF(sender_id = ? AND sender_role = ?, receiver_role, sender_role) AS contact_role,
              message, 
              created_at, 
              is_read, 
              sender_id,
              ROW_NUMBER() OVER (
                  PARTITION BY 
                      IF(sender_id = ? AND sender_role = ?, receiver_id, sender_id),
                      IF(sender_id = ? AND sender_role = ?, receiver_role, sender_role)
                  ORDER BY created_at DESC
              ) as rn
          FROM messages
          WHERE (sender_id = ? AND sender_role = ?)
             OR (receiver_id = ? AND receiver_role = ?)
      )
      SELECT 
          rm.contact_id, 
          rm.contact_role, 
          rm.message as last_message, 
          rm.created_at as last_time, 
          rm.is_read, 
          rm.sender_id,
          COALESCE(u.full_name, CONCAT(s.first_name, ' ', s.last_name)) AS contact_name,
          COALESCE(u.profile_image, s.profile_image) AS profile_image
      FROM RankedMessages rm
      LEFT JOIN users u ON rm.contact_id = u.id AND rm.contact_role != 'student'
      LEFT JOIN students s ON rm.contact_id = s.student_id AND rm.contact_role = 'student'
      WHERE rm.rn = 1
      ORDER BY rm.created_at DESC
    `;

    const [rows] = await pool.query(query, [
      user_id, user_role,
      user_id, user_role,
      user_id, user_role,
      user_id, user_role,
      user_id, user_role,
      user_id, user_role
    ]);

    const now = new Date();
    const formattedContacts = rows.map(contact => {
      const isYou = String(contact.sender_id) === String(user_id);
      
      let displayTime = '';
      if (contact.last_time) {
        const timeMs = new Date(contact.last_time).getTime();
        if (!isNaN(timeMs)) {
          const date = new Date(timeMs);
          
          const isSameDay = (d1, d2) => 
            d1.getFullYear() === d2.getFullYear() && 
            d1.getMonth() === d2.getMonth() && 
            d1.getDate() === d2.getDate();
            
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);

          if (isSameDay(now, date)) {
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            displayTime = `${hours}:${minutes} ${ampm}`;
          } else if (isSameDay(yesterday, date)) {
            displayTime = 'Yesterday';
          } else {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            displayTime = `${months[date.getMonth()]} ${date.getDate()}`;
          }
        }
      }

      return {
        contact_id: contact.contact_id,
        contact_role: contact.contact_role,
        last_message: contact.last_message,
        last_time: contact.last_time,
        is_read: contact.is_read,
        sender_id: contact.sender_id,
        contact_name: contact.contact_name,
        profile_image: contact.profile_image,
        is_you: isYou,
        display_time: displayTime
      };
    });

    return res.json({
      status: "success",
      contacts: formattedContacts
    });

  } catch (error) {
    console.error("Get contacts error:", error);
    return res.status(500).json({ status: "error", message: "DB Error: " + error.message });
  }
};

export default getContacts;
