import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3Client.js';
import pool from '../config/db.js';
import { logAuditTrail } from '../utils/auditLogger.js';

// GET all schools (Super Admin dashboard)
export const getSchools = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schools ORDER BY id DESC");
    return res.json({ success: true, schools: rows });
  } catch (error) {
    console.error("Get schools error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET active schools (Public view - Campus selector)
export const getPublicSchools = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, logo, theme_color FROM schools WHERE status = 'Active' ORDER BY name ASC");
    return res.json({ success: true, schools: rows });
  } catch (error) {
    console.error("Get public schools error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE a school
export const createSchool = async (req, res) => {
  try {
    const { name, theme_color } = req.body;
    let logo_url = null;

    if (!name) {
      return res.status(400).json({ success: false, message: "School name is required." });
    }

    if (req.file) {
      const bucketName = process.env.R2_BUCKET_NAME || 'sms-cdn';
      const uniqueFileName = 'logo_' + Date.now() + '_' + req.file.originalname.replace(/\s+/g, '_');
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `branding/${uniqueFileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3Client.send(command);
      const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5204e5f89d6c4f8ea9b7c2f2fd992041.r2.dev';
      logo_url = `${publicUrl}/branding/${uniqueFileName}`;
    }

    // Insert into schools table
    const [result] = await pool.query(
      "INSERT INTO schools (name, logo, theme_color, status) VALUES (?, ?, ?, 'Active')",
      [name, logo_url, theme_color || '#2563eb']
    );
    const newSchoolId = result.insertId;

    // Create corresponding row in school_settings
    await pool.query(
      `INSERT INTO school_settings (id, school_name, school_logo, theme_color) 
       VALUES (?, ?, ?, ?)`,
      [newSchoolId, name, logo_url, theme_color || '#2563eb']
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "CREATE_SCHOOL",
      `Created school/campus name: ${name}`,
      req
    );

    return res.json({
      success: true,
      message: "School created successfully.",
      school: { id: newSchoolId, name, logo: logo_url, theme_color, status: 'Active' }
    });
  } catch (error) {
    console.error("Create school error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE a school
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, theme_color, status } = req.body;
    let logo_url = null;

    // First fetch current record
    const [schools] = await pool.query("SELECT * FROM schools WHERE id = ?", [id]);
    if (schools.length === 0) {
      return res.status(404).json({ success: false, message: "School not found." });
    }
    const currentSchool = schools[0];

    if (req.file) {
      const bucketName = process.env.R2_BUCKET_NAME || 'sms-cdn';
      const uniqueFileName = 'logo_' + Date.now() + '_' + req.file.originalname.replace(/\s+/g, '_');
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `branding/${uniqueFileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3Client.send(command);
      const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5204e5f89d6c4f8ea9b7c2f2fd992041.r2.dev';
      logo_url = `${publicUrl}/branding/${uniqueFileName}`;
    } else {
      logo_url = currentSchool.logo;
    }

    const finalName = name || currentSchool.name;
    const finalTheme = theme_color || currentSchool.theme_color;
    const finalStatus = status || currentSchool.status;

    await pool.query(
      "UPDATE schools SET name = ?, logo = ?, theme_color = ?, status = ? WHERE id = ?",
      [finalName, logo_url, finalTheme, finalStatus, id]
    );

    // Update corresponding school_settings
    await pool.query(
      `UPDATE school_settings SET school_name = ?, school_logo = ?, theme_color = ? WHERE id = ?`,
      [finalName, logo_url, finalTheme, id]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "UPDATE_SCHOOL",
      `Updated school/campus ID: ${id} to name: ${finalName}, status: ${finalStatus}`,
      req
    );

    return res.json({
      success: true,
      message: "School updated successfully."
    });
  } catch (error) {
    console.error("Update school error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a school
export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;

    // Do not allow deleting school 1 to prevent system lockups
    if (parseInt(id, 10) === 1) {
      return res.status(400).json({ success: false, message: "Default main school campus cannot be deleted." });
    }

    await pool.query("DELETE FROM schools WHERE id = ?", [id]);
    await pool.query("DELETE FROM school_settings WHERE id = ?", [id]);

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "DELETE_SCHOOL",
      `Deleted school/campus ID: ${id}`,
      req
    );

    return res.json({
      success: true,
      message: "School deleted successfully."
    });
  } catch (error) {
    console.error("Delete school error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getSchools, getPublicSchools, createSchool, updateSchool, deleteSchool };
