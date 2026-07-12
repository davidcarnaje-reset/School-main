import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../config/s3Client.js';
import pool from '../../config/db.js';

// GET all active promotions (for public landing page)
export const getPublicPromotions = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.school_id || 1;
    const [rows] = await pool.query(
      "SELECT id, image_file, title, subtitle, button_text, button_link, is_active, created_at FROM landing_promotions WHERE is_active = 1 AND school_id = ? ORDER BY id DESC",
      [schoolId]
    );
    return res.json({
      success: true,
      promotions: rows
    });
  } catch (error) {
    console.error("Get public promotions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET all promotions (for admin dashboard view)
export const getAdminPromotions = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      "SELECT id, image_file, title, subtitle, button_text, button_link, is_active, created_at FROM landing_promotions WHERE school_id = ? ORDER BY id DESC",
      [schoolId]
    );
    return res.json({
      success: true,
      promotions: rows
    });
  } catch (error) {
    console.error("Get admin promotions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE a promotion with Cloudflare R2 upload
export const createPromotion = async (req, res) => {
  try {
    const { title, subtitle, button_text, button_link } = req.body;
    let image_file_url = null;

    if (!req.file || !title) {
      return res.status(400).json({ success: false, message: "Banner image and title are required." });
    }

    const bucketName = process.env.R2_BUCKET_NAME || 'sms-cdn';
    const uniqueFileName = 'promo_' + Date.now() + '_' + req.file.originalname.replace(/\s+/g, '_');

    // Upload banner buffer directly to Cloudflare R2 bucket
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `banners/${uniqueFileName}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5204e5f89d6c4f8ea9b7c2f2fd992041.r2.dev';
    image_file_url = `${publicUrl}/banners/${uniqueFileName}`;

    // Get the next ID since the database schema lacks AUTO_INCREMENT
    const [idRows] = await pool.query("SELECT MAX(id) as maxId FROM landing_promotions");
    const nextId = (idRows[0].maxId || 0) + 1;
    const schoolId = req.school_id || 1;

    await pool.query(
      "INSERT INTO landing_promotions (id, image_file, title, subtitle, button_text, button_link, is_active, school_id) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
      [nextId, image_file_url, title, subtitle || '', button_text || null, button_link || '/login', schoolId]
    );

    return res.json({
      success: true,
      message: "Banner uploaded successfully.",
      data: { id: nextId, image_file: image_file_url, title, subtitle, button_text, button_link }
    });
  } catch (error) {
    console.error("Create promotion error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a promotion
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Promotion ID is required." });
    }

    const schoolId = req.school_id || 1;
    await pool.query("DELETE FROM landing_promotions WHERE id = ? AND school_id = ?", [id, schoolId]);

    return res.json({
      success: true,
      message: "Banner deleted successfully."
    });
  } catch (error) {
    console.error("Delete promotion error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getPublicPromotions, getAdminPromotions, createPromotion, deletePromotion };
