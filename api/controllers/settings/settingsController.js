import pool from '../../config/db.js';

// GET USER CONFIG SETTINGS
export const getSettings = async (req, res) => {
  const { user_id, user_role } = req.query;

  if (!user_id || !user_role) {
    return res.status(400).json({ status: "error", message: "Missing parameters" });
  }

  try {
    const query = `
      SELECT dark_mode, theme_color, dashboard_type, email_notifications 
      FROM user_settings 
      WHERE user_id = ? AND user_role = ?
    `;

    const [rows] = await pool.query(query, [user_id, user_role]);

    if (rows.length > 0) {
      // Convert boolean indicators cleanly to numbers matching frontend expects
      const settings = rows[0];
      settings.dark_mode = parseInt(settings.dark_mode || 0, 10);
      settings.email_notifications = parseInt(settings.email_notifications || 0, 10);

      return res.json({ status: "success", settings });
    } else {
      // Fallback default configurations
      return res.json({
        status: "success",
        settings: {
          dark_mode: 0,
          theme_color: "#2563eb",
          dashboard_type: "standard",
          email_notifications: 1
        }
      });
    }

  } catch (error) {
    console.error("Get user settings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// UPDATE USER CONFIG SETTINGS
export const updateSettings = async (req, res) => {
  const { user_id: uid, user_role: urole, setting_key: key, setting_value: value } = req.body;

  if (!uid || !urole || !key || value === undefined) {
    return res.status(400).json({ status: "error", message: "Incomplete parameters" });
  }

  const allowedKeys = ['dark_mode', 'theme_color', 'dashboard_type', 'email_notifications'];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ status: "error", message: "Invalid setting key" });
  }

  try {
    const query = `
      INSERT INTO user_settings (user_id, user_role, ${key}) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE ${key} = ?
    `;

    await pool.query(query, [uid, urole, value, value]);

    return res.json({ status: "success", message: "Setting updated" });

  } catch (error) {
    console.error("Update user settings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default { getSettings, updateSettings };
