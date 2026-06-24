import pool from '../../config/db.js';

const getUsersForDropdown = async (req, res) => {
  const { role } = req.query;
  let users = [];

  if (!role) {
    return res.status(400).json({ success: false, message: "Role is required." });
  }

  try {
    if (role === 'student') {
      const [rows] = await pool.query(
        "SELECT student_id AS id, CONCAT(last_name, ', ', first_name) AS name FROM students ORDER BY last_name ASC"
      );
      users = rows;
    } else {
      const [rows] = await pool.query(
        "SELECT id, full_name AS name FROM users WHERE role = ? ORDER BY full_name ASC",
        [role]
      );
      users = rows;
    }

    return res.json({ success: true, data: users });

  } catch (error) {
    console.error("Get users for dropdown error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default getUsersForDropdown;
