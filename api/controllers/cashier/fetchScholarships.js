import pool from '../../config/db.js';

const fetchScholarships = async (req, res) => {
  try {
    const query = "SELECT id, name, discount_type, discount_value FROM scholarships_catalog WHERE status = 'Active'";
    const [rows] = await pool.query(query);
    return res.json(rows);
  } catch (error) {
    console.error("Fetch scholarships error:", error);
    return res.status(500).json({ error: "Database connection failed: " + error.message });
  }
};

export default fetchScholarships;
