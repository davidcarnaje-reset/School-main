import pool from '../../config/db.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../config/s3Client.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

// ============================================================
// 1. SCHOOL PROFILE & STUDENT PREFIXES
// ============================================================
export const getSchoolProfile = async (req, res) => {
  try {
    const schoolId = req.query.school_id || req.school_id || 1;
    const [rows] = await pool.query(
      `SELECT 
         s.id, 
         COALESCE(ss.school_name, s.name) AS school_name, 
         COALESCE(ss.school_logo, s.logo) AS school_logo, 
         COALESCE(ss.theme_color, s.theme_color, '#2563eb') AS theme_color, 
         ss.school_address, 
         ss.website_link, 
         ss.fb_page, 
         ss.contact_number, 
         COALESCE(ss.prefix_k12, 'K12-') AS prefix_k12, 
         COALESCE(ss.prefix_college, 'COL-') AS prefix_college 
       FROM schools s
       LEFT JOIN school_settings ss ON s.id = ss.id
       WHERE s.id = ?`, 
      [schoolId]
    );

    if (rows.length > 0) {
      return res.json({ status: 'success', data: rows[0] });
    }

    // Fallback if even schools table row was not found
    const [ssRows] = await pool.query("SELECT * FROM school_settings WHERE id = ?", [schoolId]);
    if (ssRows.length > 0) {
      return res.json({ status: 'success', data: ssRows[0] });
    }

    return res.json({
      status: 'success',
      data: {
        id: schoolId,
        school_name: 'SMS Portal',
        school_logo: null,
        theme_color: '#2563eb',
        school_address: '',
        website_link: '',
        fb_page: '',
        contact_number: '',
        prefix_k12: 'K12-',
        prefix_college: 'COL-'
      }
    });
  } catch (error) {
    console.error("getSchoolProfile error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateSchoolProfile = async (req, res) => {
  try {
    const {
      school_name,
      theme_color,
      school_address,
      website_link,
      fb_page,
      contact_number,
      prefix_k12,
      prefix_college
    } = req.body;

    const schoolId = req.query.school_id || req.school_id || 1;
    let school_logo_url = null;

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
      school_logo_url = `${publicUrl}/branding/${uniqueFileName}`;
    }

    // 1. Upsert into school_settings
    await pool.query(
      `INSERT INTO school_settings (
        id, school_name, theme_color, school_logo, 
        school_address, website_link, fb_page, contact_number, 
        prefix_k12, prefix_college
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         school_name = COALESCE(?, school_name),
         theme_color = COALESCE(?, theme_color),
         school_logo = COALESCE(?, school_logo),
         school_address = ?,
         website_link = ?,
         fb_page = ?,
         contact_number = ?,
         prefix_k12 = ?,
         prefix_college = ?`,
      [
        schoolId, school_name, theme_color || '#2563eb', school_logo_url,
        school_address || null, website_link || null, fb_page || null, contact_number || null,
        prefix_k12 || 'K12-', prefix_college || 'COL-',
        school_name, theme_color || '#2563eb', school_logo_url,
        school_address || null, website_link || null, fb_page || null, contact_number || null,
        prefix_k12 || 'K12-', prefix_college || 'COL-'
      ]
    );

    // 2. Sync to schools table as well
    if (school_logo_url) {
      await pool.query(
        "UPDATE schools SET name = COALESCE(?, name), theme_color = COALESCE(?, theme_color), logo = ? WHERE id = ?",
        [school_name, theme_color, school_logo_url, schoolId]
      );
    } else {
      await pool.query(
        "UPDATE schools SET name = COALESCE(?, name), theme_color = COALESCE(?, theme_color) WHERE id = ?",
        [school_name, theme_color, schoolId]
      );
    }

    const [updated] = await pool.query(
      `SELECT 
         s.id, 
         COALESCE(ss.school_name, s.name) AS school_name, 
         COALESCE(ss.school_logo, s.logo) AS school_logo, 
         COALESCE(ss.theme_color, s.theme_color, '#2563eb') AS theme_color, 
         ss.school_address, 
         ss.website_link, 
         ss.fb_page, 
         ss.contact_number, 
         COALESCE(ss.prefix_k12, 'K12-') AS prefix_k12, 
         COALESCE(ss.prefix_college, 'COL-') AS prefix_college 
       FROM schools s
       LEFT JOIN school_settings ss ON s.id = ss.id
       WHERE s.id = ?`,
      [schoolId]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "UPDATE_SCHOOL_PROFILE",
      `Updated school profile & prefixes for ${school_name}`,
      req
    );

    return res.json({
      status: 'success',
      message: 'School profile and prefixes updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    console.error("updateSchoolProfile error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 2. SCHOOL YEAR SETUP
// ============================================================
export const getSchoolYears = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      "SELECT id, school_year, DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, status, is_current FROM school_years WHERE school_id = ? ORDER BY id DESC",
      [schoolId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error("getSchoolYears error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createSchoolYear = async (req, res) => {
  try {
    const { school_year, start_date, end_date, status, is_current } = req.body;
    if (!school_year) {
      return res.status(400).json({ status: 'error', message: 'School year is required.' });
    }

    const schoolId = req.school_id || 1;
    const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM school_years");
    const nextId = maxIdRows[0].maxId + 1;

    if (is_current) {
      await pool.query("UPDATE school_years SET is_current = 0 WHERE school_id = ?", [schoolId]);
    }

    await pool.query(
      `INSERT INTO school_years (id, school_id, school_year, start_date, end_date, status, is_current)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        schoolId,
        school_year.trim(),
        start_date || null,
        end_date || null,
        status || 'Open',
        is_current ? 1 : 0
      ]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "CREATE_SCHOOL_YEAR",
      `Created school year: ${school_year} (Status: ${status || 'Open'})`,
      req
    );

    return res.json({ status: 'success', message: 'School year created successfully.' });
  } catch (error) {
    console.error("createSchoolYear error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateSchoolYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_year, start_date, end_date, status, is_current } = req.body;
    const schoolId = req.school_id || 1;

    if (is_current) {
      await pool.query("UPDATE school_years SET is_current = 0 WHERE school_id = ?", [schoolId]);
    }

    await pool.query(
      `UPDATE school_years 
       SET school_year = ?, start_date = ?, end_date = ?, status = ?, is_current = ?
       WHERE id = ? AND school_id = ?`,
      [
        school_year,
        start_date || null,
        end_date || null,
        status || 'Open',
        is_current ? 1 : 0,
        id,
        schoolId
      ]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "UPDATE_SCHOOL_YEAR",
      `Updated school year ID: ${id} (${school_year})`,
      req
    );

    return res.json({ status: 'success', message: 'School year updated successfully.' });
  } catch (error) {
    console.error("updateSchoolYear error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteSchoolYear = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school_id || 1;
    await pool.query("DELETE FROM school_years WHERE id = ? AND school_id = ?", [id, schoolId]);

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "DELETE_SCHOOL_YEAR",
      `Deleted school year ID: ${id}`,
      req
    );

    return res.json({ status: 'success', message: 'School year deleted successfully.' });
  } catch (error) {
    console.error("deleteSchoolYear error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 3. BUILDINGS SETUP
// ============================================================
export const getBuildings = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      "SELECT id, building_name, floors, status FROM buildings WHERE school_id = ? ORDER BY building_name ASC",
      [schoolId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error("getBuildings error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createBuilding = async (req, res) => {
  try {
    const { building_name, floors, status } = req.body;
    if (!building_name) {
      return res.status(400).json({ status: 'error', message: 'Building name is required.' });
    }

    const schoolId = req.school_id || 1;
    const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM buildings");
    const nextId = maxIdRows[0].maxId + 1;

    await pool.query(
      "INSERT INTO buildings (id, school_id, building_name, floors, status) VALUES (?, ?, ?, ?, ?)",
      [nextId, schoolId, building_name.trim(), parseInt(floors, 10) || 1, status || 'Active']
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "CREATE_BUILDING",
      `Created building: ${building_name} (${floors} floors)`,
      req
    );

    return res.json({ status: 'success', message: 'Building created successfully.' });
  } catch (error) {
    console.error("createBuilding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { building_name, floors, status } = req.body;
    const schoolId = req.school_id || 1;

    await pool.query(
      "UPDATE buildings SET building_name = ?, floors = ?, status = ? WHERE id = ? AND school_id = ?",
      [building_name.trim(), parseInt(floors, 10) || 1, status || 'Active', id, schoolId]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "UPDATE_BUILDING",
      `Updated building ID: ${id} (${building_name})`,
      req
    );

    return res.json({ status: 'success', message: 'Building updated successfully.' });
  } catch (error) {
    console.error("updateBuilding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school_id || 1;
    await pool.query("DELETE FROM buildings WHERE id = ? AND school_id = ?", [id, schoolId]);

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "DELETE_BUILDING",
      `Deleted building ID: ${id}`,
      req
    );

    return res.json({ status: 'success', message: 'Building deleted successfully.' });
  } catch (error) {
    console.error("deleteBuilding error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// ============================================================
// 4. ROOM MANAGEMENT (UPGRADED WITH BUILDINGS & CATEGORIES)
// ============================================================
export const getRoomsExtended = async (req, res) => {
  try {
    const schoolId = req.school_id || 1;
    const [rows] = await pool.query(
      `SELECT r.id, r.id as room_id, r.room_name, r.room_number, 
              r.building_id, b.building_name, r.floor_number, 
              r.category, r.room_type, r.capacity, r.status
       FROM rooms r
       LEFT JOIN buildings b ON r.building_id = b.id
       WHERE r.school_id = ?
       ORDER BY b.building_name ASC, r.floor_number ASC, r.room_name ASC`,
      [schoolId]
    );
    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error("getRoomsExtended error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createRoomExtended = async (req, res) => {
  try {
    const { room_name, room_number, building_id, floor_number, category, room_type, capacity, status } = req.body;
    if (!room_name || !capacity) {
      return res.status(400).json({ status: 'error', message: "Room name and capacity are required." });
    }

    const schoolId = req.school_id || 1;
    let finalFloor = parseInt(floor_number, 10) || 1;

    if (building_id) {
      const [bldgRows] = await pool.query("SELECT floors FROM buildings WHERE id = ?", [building_id]);
      if (bldgRows.length > 0) {
        const maxFloors = bldgRows[0].floors || 1;
        if (finalFloor > maxFloors) {
          finalFloor = maxFloors;
        }
      }
    }

    const [maxIdRows] = await pool.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM rooms");
    const nextId = maxIdRows[0].maxId + 1;

    await pool.query(
      `INSERT INTO rooms (
        id, room_name, room_number, building_id, floor_number, 
        category, room_type, capacity, status, school_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextId,
        room_name.trim(),
        room_number ? room_number.trim() : null,
        building_id ? parseInt(building_id, 10) : null,
        finalFloor,
        category || 'Lecture',
        room_type || 'Physical',
        parseInt(capacity, 10) || 40,
        status || 'Active',
        schoolId
      ]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "CREATE_ROOM",
      `Created room: ${room_name} (${category || 'Lecture'}, Capacity: ${capacity})`,
      req
    );

    return res.json({ status: 'success', message: "Room created successfully." });
  } catch (error) {
    console.error("createRoomExtended error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export const updateRoomExtended = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name, room_number, building_id, floor_number, category, room_type, capacity, status } = req.body;
    const schoolId = req.school_id || 1;

    if (!room_name || !capacity) {
      return res.status(400).json({ status: 'error', message: "Room name and capacity are required." });
    }

    let finalFloor = parseInt(floor_number, 10) || 1;
    if (building_id) {
      const [bldgRows] = await pool.query("SELECT floors FROM buildings WHERE id = ?", [building_id]);
      if (bldgRows.length > 0) {
        const maxFloors = bldgRows[0].floors || 1;
        if (finalFloor > maxFloors) {
          finalFloor = maxFloors;
        }
      }
    }

    await pool.query(
      `UPDATE rooms SET 
         room_name = ?, 
         room_number = ?, 
         building_id = ?, 
         floor_number = ?, 
         category = ?, 
         room_type = ?, 
         capacity = ?, 
         status = ? 
       WHERE id = ? AND school_id = ?`,
      [
        room_name.trim(),
        room_number ? room_number.trim() : null,
        building_id ? parseInt(building_id, 10) : null,
        finalFloor,
        category || 'Lecture',
        room_type || 'Physical',
        parseInt(capacity, 10) || 40,
        status || 'Active',
        id,
        schoolId
      ]
    );

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Admin',
      "UPDATE_ROOM",
      `Updated room ID: ${id} (${room_name})`,
      req
    );

    return res.json({ status: 'success', message: "Room updated successfully." });
  } catch (error) {
    console.error("updateRoomExtended error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default {
  getSchoolProfile,
  updateSchoolProfile,
  getSchoolYears,
  createSchoolYear,
  updateSchoolYear,
  deleteSchoolYear,
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getRoomsExtended,
  createRoomExtended,
  updateRoomExtended
};
