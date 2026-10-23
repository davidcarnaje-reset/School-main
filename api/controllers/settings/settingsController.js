import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

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
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [user_id, user_role]);

    if (rows.length > 0) {
      const settings = rows[0];
      settings.dark_mode = parseInt(settings.dark_mode || 0, 10);
      settings.email_notifications = parseInt(settings.email_notifications !== null ? settings.email_notifications : 1, 10);

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

  const allowedKeys = ['dark_mode', 'theme_color', 'dashboard_type', 'email_notifications', 'kiddie_mode'];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ status: "error", message: "Invalid setting key" });
  }

  let dbKey = key;
  let dbValue = value;
  if (key === 'kiddie_mode') {
    dbKey = 'dashboard_type';
    dbValue = value == 1 ? 'kiddie' : 'standard';
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM user_settings WHERE user_id = ? AND user_role = ? LIMIT 1",
      [uid, urole]
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE user_settings SET ${dbKey} = ? WHERE id = ?`,
        [dbValue, existing[0].id]
      );
    } else {
      const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM user_settings");
      const nextId = maxIdRows[0].nextId;

      await pool.query(
        `INSERT INTO user_settings (id, user_id, user_role, ${dbKey}) VALUES (?, ?, ?, ?)`,
        [nextId, uid, urole, dbValue]
      );
    }

    try {
      const auditUserId = parseInt(uid, 10);
      await logAuditTrail(
        !isNaN(auditUserId) ? auditUserId : 1,
        urole,
        "UPDATE_USER_SETTINGS",
        `Updated personal setting: ${key} to ${value}`,
        req
      );
    } catch (auditErr) {
      // Non-fatal audit log
    }

    return res.json({ status: "success", message: "Setting updated", key: dbKey, value: dbValue });

  } catch (error) {
    console.error("Update user settings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default { getSettings, updateSettings };
