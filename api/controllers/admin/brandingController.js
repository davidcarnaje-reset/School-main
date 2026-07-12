import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../config/s3Client.js';
import pool from '../../config/db.js';

/**
 * GET current system branding settings.
 */
export const getBranding = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM school_settings WHERE id = 1");
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
 * POST/UPDATE system branding settings with Cloudflare R2 Storage support.
 */
export const updateBranding = async (req, res) => {
  try {
    const { school_name, theme_color } = req.body;
    let school_logo_url = null;

    if (req.file) {
      const bucketName = process.env.R2_BUCKET_NAME || 'sms-cdn';
      const uniqueFileName = 'logo_' + Date.now() + '_' + req.file.originalname.replace(/\s+/g, '_');

      // Instantiate S3Client framework command to upload directly to R2 bucket
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: `branding/${uniqueFileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });

      await s3Client.send(command);

      const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5204e5f89d6c4f8ea9b7c2f2fd992041.r2.dev';
      school_logo_url = `${publicUrl}/branding/${uniqueFileName}`;
    }

    // Run the upsert MySQL query against the TiDB Cloud dashboard config table (school_settings)
    await pool.query(
      `INSERT INTO school_settings (id, school_name, theme_color, school_logo) 
       VALUES (1, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         school_name=?, 
         theme_color=?, 
         school_logo=COALESCE(?, school_logo);`,
      [
        school_name,
        theme_color,
        school_logo_url,
        school_name,
        theme_color,
        school_logo_url
      ]
    );

    // Retrieve updated config row
    const [updatedRows] = await pool.query("SELECT * FROM school_settings WHERE id = 1");

    return res.status(200).json({
      status: 'success',
      message: 'Branding engine synchronized to the cloud network layer.',
      data: updatedRows[0]
    });

  } catch (error) {
    console.error("Update branding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET school college grading settings
export const getSchoolSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         college_grading_scale,
         college_prelim_weight,
         college_midterm_weight,
         college_finals_weight
       FROM school_settings 
       WHERE id = 1`
    );
    
    return res.json({
      status: "success",
      data: rows[0] || {
        college_grading_scale: "1_highest",
        college_prelim_weight: 30.00,
        college_midterm_weight: 30.00,
        college_finals_weight: 40.00
      }
    });
  } catch (error) {
    console.error("Get school settings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// SAVE school college grading settings
export const saveSchoolSettings = async (req, res) => {
  try {
    const scale = req.body.college_grading_scale ?? '1_highest';
    const prelim = parseFloat(req.body.college_prelim_weight ?? 30);
    const midterm = parseFloat(req.body.college_midterm_weight ?? 30);
    const finals = parseFloat(req.body.college_finals_weight ?? 40);

    // Validate weights sum to 100
    if (Math.abs(prelim + midterm + finals - 100) > 0.01) {
      return res.json({ status: "error", message: "Weights must sum to 100%" });
    }

    await pool.query(
      `UPDATE school_settings SET
         college_grading_scale = ?,
         college_prelim_weight = ?,
         college_midterm_weight = ?,
         college_finals_weight = ?
       WHERE id = 1`,
      [scale, prelim, midterm, finals]
    );

    return res.json({ status: "success", message: "College grading settings saved" });
  } catch (error) {
    console.error("Save school settings error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export default { getBranding, updateBranding, getSchoolSettings, saveSchoolSettings };
