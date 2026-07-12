import pool from '../../config/db.js';

// FETCH ACTIVE SCHOLARSHIPS CATALOG
export const fetchScholarships = async (req, res) => {
  try {
    const query = "SELECT id, name, discount_type, discount_value FROM scholarships_catalog WHERE status = 'Active'";
    const [scholarships] = await pool.query(query);
    return res.json(scholarships);
  } catch (error) {
    console.error("Fetch scholarships error:", error);
    return res.status(500).json({ error: "Query failed: " + error.message });
  }
};

// GET PERSONAL SCHOLARSHIP APPLICATIONS
export const getStudentApplications = async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ status: "error", message: "Email is required." });
  }

  try {
    const query = `
      SELECT 
        sa.id, 
        sc.name AS scholarship_name, 
        sa.status, 
        sa.date_applied, 
        sa.sy
      FROM scholarship_applications sa
      INNER JOIN students st ON sa.student_id = st.student_id
      INNER JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
      WHERE st.email = ?
      ORDER BY sa.date_applied DESC
    `;

    const [rows] = await pool.query(query, [email]);

    // Format dates to "MMM DD, YYYY" for React client compatibility
    const formatted = rows.map(row => {
      let dateApplied = row.date_applied;
      if (dateApplied) {
        const d = new Date(dateApplied);
        if (!isNaN(d.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          dateApplied = `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}, ${d.getFullYear()}`;
        }
      }
      return {
        id: row.id,
        scholarship_name: row.scholarship_name,
        status: row.status,
        date_applied: dateApplied,
        sy: row.sy
      };
    });

    return res.json({
      status: "success",
      data: formatted
    });

  } catch (error) {
    console.error("Get student applications error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};

export default { fetchScholarships, getStudentApplications };
