import pool from '../../config/db.js';
import path from 'path';
import fs from 'fs';

export const getScholarshipApplications = async (req, res) => {
  try {
    const sql = `
      SELECT 
        sa.id, 
        sa.student_id, 
        s.first_name, 
        s.last_name, 
        sc.name AS scholarship_name, 
        sa.sy, 
        sa.status, 
        sa.date_applied,
        sa.requirements_file 
      FROM scholarship_applications sa
      JOIN students s ON sa.student_id = s.student_id
      JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
      ORDER BY sa.date_applied DESC
    `;
    const [applications] = await pool.query(sql);
    return res.status(200).json(applications || []);
  } catch (error) {
    console.error("getScholarshipApplications error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const evaluateScholarship = async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ success: false, message: "Incomplete data. ID and Status are required." });
  }

  const finalStatus = String(status).trim();

  try {
    const sql = `
      UPDATE scholarship_applications 
      SET status = ?, 
          date_evaluated = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [finalStatus, parseInt(id, 10)]);

    if (result.affectedRows > 0) {
      return res.status(200).json({
        success: true,
        message: "Scholarship application has been marked as " + finalStatus + "."
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No changes made. Application might not exist or status is already the same."
      });
    }
  } catch (error) {
    console.error("evaluateScholarship error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const readImage = async (req, res) => {
  const { file } = req.query;

  if (!file) {
    return res.status(400).send("File parameter is required.");
  }

  // If the file string is already a full R2 URL
  if (file.startsWith('http://') || file.startsWith('https://')) {
    return res.redirect(file);
  }

  // Otherwise, serve it locally from uploads/requirements
  const safeFilename = path.basename(file);
  const localPath = path.resolve(process.cwd(), 'uploads/requirements', safeFilename);

  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  } else {
    // Try root uploads folder
    const altPath = path.resolve(process.cwd(), 'uploads', safeFilename);
    if (fs.existsSync(altPath)) {
      return res.sendFile(altPath);
    }
    return res.status(404).send("Image not found.");
  }
};
