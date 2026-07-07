import pool from '../../config/db.js';

/**
 * GET current system branding settings.
 */
export const getBranding = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM school_settings LIMIT 1");
    if (rows.length > 0) {
      return res.json({
        status: 'success',
        data: rows[0]
      });
    } else {
      // Default fallback values if no row exists in the database
      return res.json({
        status: 'success',
        data: {
          school_name: 'SMS Portal',
          theme_color: '#2563eb',
          school_logo: null
        }
      });
    }
  } catch (error) {
    console.error("Get branding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST/UPDATE system branding settings.
 */
export const updateBranding = async (req, res) => {
  try {
    const { school_name, theme_color } = req.body;
    const school_logo = req.file ? req.file.filename : null;

    if (!school_name || !theme_color) {
      return res.status(400).json({ status: 'error', message: "School name and theme color are required." });
    }

    // Check if configuration exists
    const [rows] = await pool.query("SELECT id, school_logo FROM school_settings LIMIT 1");

    if (rows.length > 0) {
      const record = rows[0];
      const finalLogo = school_logo || record.school_logo;
      await pool.query(
        "UPDATE school_settings SET school_name = ?, theme_color = ?, school_logo = ? WHERE id = ?",
        [school_name, theme_color, finalLogo, record.id]
      );
    } else {
      await pool.query(
        "INSERT INTO school_settings (id, school_name, theme_color, school_logo) VALUES (1, ?, ?, ?)",
        [school_name, theme_color, school_logo]
      );
    }

    // Retrieve updated records
    const [updatedRows] = await pool.query("SELECT * FROM school_settings LIMIT 1");

    return res.json({
      status: 'success',
      message: "Branding updated successfully.",
      data: updatedRows[0]
    });

  } catch (error) {
    console.error("Update branding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default { getBranding, updateBranding };
