import pool from '../../config/db.js';

// GET STUDENT ENROLLED SECTIONS FOR LMS ROUTER
export const getLmsContent = async (req, res) => {
  const sectionId = req.query.section_id;

  if (!sectionId) {
    return res.json({ success: false, enrolled_sections: [], message: "No section ID provided" });
  }

  try {
    const query = "SELECT * FROM sections WHERE id = ? AND status = 'Active'";
    const [sections] = await pool.query(query, [sectionId]);

    return res.json({
      success: true,
      enrolled_sections: sections || []
    });

  } catch (error) {
    console.error("Get LMS content error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default { getLmsContent };
