import pool from '../../config/db.js';

export const getSchoolPermissions = async (req, res) => {
  try {
    const { school_id } = req.params;
    const [rows] = await pool.query(
      "SELECT role, module_name, is_enabled FROM school_role_modules WHERE school_id = ?",
      [school_id]
    );

    res.status(200).json({
      success: true,
      permissions: rows
    });
  } catch (error) {
    console.error("Error in getSchoolPermissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching school permissions."
    });
  }
};

export const updateSchoolPermissions = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { school_id } = req.params;
    const { permissions } = req.body; // Array of { role, module_name, is_enabled }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permissions payload. Expected an array."
      });
    }

    await connection.beginTransaction();

    for (const perm of permissions) {
      const isEnabledValue = perm.is_enabled ? 1 : 0;
      await connection.query(
        `INSERT INTO school_role_modules (school_id, role, module_name, is_enabled)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)`,
        [school_id, perm.role, perm.module_name, isEnabledValue]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "School permissions updated successfully."
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in updateSchoolPermissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error updating school permissions."
    });
  } finally {
    connection.release();
  }
};
