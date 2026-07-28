import pool from '../../config/db.js';
import { logAuditTrail } from '../../utils/auditLogger.js';

const normalizeMajor = (m) => {
  if (!m) return '';
  return m.toString().trim().replace(/^major\s+in\s+/i, '').trim().toUpperCase();
};

export const getAcademicPrograms = async (req, res) => {
  try {
    const sql = `
      SELECT id, department, program_code, program_description, major, status, curriculum_year 
      FROM academic_programs 
      ORDER BY department DESC, program_code ASC, curriculum_year DESC
    `;
    const [programs] = await pool.query(sql);
    return res.status(200).json(programs || []);
  } catch (error) {
    console.error("getAcademicPrograms error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const addAcademicProgram = async (req, res) => {
  const { department, program_code, program_description, major = null, status = 'Active', curriculum_year = '2024-2025' } = req.body;

  if (!department || !program_code || !program_description) {
    return res.status(400).json({ success: false, message: "Incomplete data provided. Department, program code, and description are required." });
  }

  const cleanDept = department.trim();
  const cleanCode = program_code.toUpperCase().trim();
  const cleanDesc = program_description.trim();
  let cleanMajor = major ? major.trim() : null;
  if (cleanMajor) {
    cleanMajor = cleanMajor.replace(/^major\s+in\s+/i, '').trim();
    if (!cleanMajor) cleanMajor = null;
  }
  const cleanStatus = status ? status.trim() : 'Active';
  const cleanCurrYear = curriculum_year ? curriculum_year.trim() : '2024-2025';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch existing programs for same dept, program_code, and curriculum_year
    const [existingRows] = await connection.query(
      `SELECT id, major FROM academic_programs 
       WHERE UPPER(TRIM(department)) = UPPER(?) 
         AND UPPER(TRIM(program_code)) = UPPER(?) 
         AND TRIM(curriculum_year) = ?`,
      [cleanDept, cleanCode, cleanCurrYear]
    );

    const targetNormalizedMajor = normalizeMajor(cleanMajor);
    const duplicate = existingRows.find(row => normalizeMajor(row.major) === targetNormalizedMajor);

    if (duplicate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Duplicate Program Error: Program '${cleanCode}' ${cleanMajor ? `(Major: ${cleanMajor})` : ''} already exists for Curriculum Year ${cleanCurrYear}. Duplicate entries are not allowed under the same curriculum year.`
      });
    }

    // Query for manually incremented id due to TiDB constraints
    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM academic_programs FOR UPDATE");
    const nextId = maxIdRows[0].maxId + 1;

    const sql = `
      INSERT INTO academic_programs (id, department, program_code, program_description, major, status, curriculum_year) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(sql, [
      nextId,
      cleanDept,
      cleanCode,
      cleanDesc,
      cleanMajor,
      cleanStatus,
      cleanCurrYear
    ]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "ADD_PROGRAM",
      `Added academic program: ${cleanCode} - ${cleanDesc} (Curriculum: ${cleanCurrYear})`,
      req
    );
    return res.status(201).json({ success: true, message: "Program successfully added." });
  } catch (error) {
    await connection.rollback();
    console.error("addAcademicProgram error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const updateAcademicProgram = async (req, res) => {
  const { id, department, program_code, program_description, major = null, status = 'Active', curriculum_year = '2024-2025' } = req.body;

  if (!id || !department || !program_code || !program_description) {
    return res.status(400).json({ success: false, message: "Incomplete data provided. ID, department, program code, and description are required." });
  }

  const cleanDept = department.trim();
  const cleanCode = program_code.toUpperCase().trim();
  const cleanDesc = program_description.trim();
  let cleanMajor = major ? major.trim() : null;
  if (cleanMajor) {
    cleanMajor = cleanMajor.replace(/^major\s+in\s+/i, '').trim();
    if (!cleanMajor) cleanMajor = null;
  }
  const cleanStatus = status ? status.trim() : 'Active';
  const cleanCurrYear = curriculum_year ? curriculum_year.trim() : '2024-2025';
  const targetId = parseInt(id, 10);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch existing programs for same dept, program_code, and curriculum_year (excluding current ID)
    const [existingRows] = await connection.query(
      `SELECT id, major FROM academic_programs 
       WHERE UPPER(TRIM(department)) = UPPER(?) 
         AND UPPER(TRIM(program_code)) = UPPER(?) 
         AND TRIM(curriculum_year) = ?
         AND id != ?`,
      [cleanDept, cleanCode, cleanCurrYear, targetId]
    );

    const targetNormalizedMajor = normalizeMajor(cleanMajor);
    const duplicate = existingRows.find(row => normalizeMajor(row.major) === targetNormalizedMajor);

    if (duplicate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Duplicate Program Error: Program '${cleanCode}' ${cleanMajor ? `(Major: ${cleanMajor})` : ''} already exists for Curriculum Year ${cleanCurrYear}. Duplicate entries are not allowed under the same curriculum year.`
      });
    }

    const sql = `
      UPDATE academic_programs 
      SET department = ?, program_code = ?, program_description = ?, major = ?, status = ?, curriculum_year = ?
      WHERE id = ?
    `;
    await connection.query(sql, [
      cleanDept,
      cleanCode,
      cleanDesc,
      cleanMajor,
      cleanStatus,
      cleanCurrYear,
      targetId
    ]);

    await connection.commit();
    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "UPDATE_PROGRAM",
      `Updated academic program ID ${id}: ${cleanCode} - ${cleanDesc}`,
      req
    );
    return res.status(200).json({ success: true, message: "Program successfully updated." });
  } catch (error) {
    await connection.rollback();
    console.error("updateAcademicProgram error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};

export const deleteAcademicProgram = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "Program ID is missing." });
  }

  try {
    const sql = "DELETE FROM academic_programs WHERE id = ?";
    const [result] = await pool.query(sql, [parseInt(id, 10)]);

    if (result.affectedRows > 0) {
      await logAuditTrail(
        req.user?.id || 1,
        req.user?.role || 'Registrar',
        "DELETE_PROGRAM",
        `Deleted academic program ID: ${id}`,
        req
      );
      return res.status(200).json({ success: true, message: "Program deleted successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Failed to delete program or program not found." });
    }
  } catch (error) {
    console.error("deleteAcademicProgram error:", error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: This program is currently linked to students or courses."
      });
    }
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export const bulkImportAcademicPrograms = async (req, res) => {
  const { programs } = req.body;

  if (!Array.isArray(programs) || programs.length === 0) {
    return res.status(400).json({ success: false, message: "No program rows provided in import file." });
  }

  const connection = await pool.getConnection();
  let insertedCount = 0;
  let skippedCount = 0;
  const skippedDetails = [];

  try {
    await connection.beginTransaction();

    const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM academic_programs FOR UPDATE");
    let currentNextId = maxIdRows[0].maxId + 1;

    for (const prog of programs) {
      const rawDept = (prog.department || prog.Department || 'College').toString().trim();
      const cleanDept = rawDept.toUpperCase().includes('SHS') ? 'SHS' : 'College';

      const rawCode = (prog.program_code || prog.programCode || prog['Program Code'] || prog.Code || '').toString().trim();
      const rawDesc = (prog.program_description || prog.description || prog['Description'] || prog.Description || '').toString().trim();

      if (!rawCode || !rawDesc) {
        skippedCount++;
        skippedDetails.push(`Skipped row (missing Code or Description)`);
        continue;
      }

      const cleanCode = rawCode.toUpperCase();
      const cleanDesc = rawDesc;
      let rawMajor = (prog.major || prog.Major || '').toString().trim();
      let cleanMajor = rawMajor ? rawMajor.replace(/^major\s+in\s+/i, '').trim() : null;
      if (!cleanMajor) cleanMajor = null;

      const rawStatus = (prog.status || prog.Status || 'Active').toString().trim();
      const cleanStatus = rawStatus.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

      const rawCurrYear = (prog.curriculum_year || prog['Curriculum Year'] || prog.curriculumYear || '2024-2025').toString().trim();
      const cleanCurrYear = rawCurrYear || '2024-2025';

      // Check duplicate
      const [existingRows] = await connection.query(
        `SELECT id, major FROM academic_programs 
         WHERE UPPER(TRIM(department)) = UPPER(?) 
           AND UPPER(TRIM(program_code)) = UPPER(?) 
           AND TRIM(curriculum_year) = ?`,
        [cleanDept, cleanCode, cleanCurrYear]
      );

      const targetNormalizedMajor = normalizeMajor(cleanMajor);
      const isDuplicate = existingRows.some(row => normalizeMajor(row.major) === targetNormalizedMajor);

      if (isDuplicate) {
        skippedCount++;
        skippedDetails.push(`${cleanCode} ${cleanMajor ? `(Major: ${cleanMajor})` : ''} for ${cleanCurrYear}`);
        continue;
      }

      const sql = `
        INSERT INTO academic_programs (id, department, program_code, program_description, major, status, curriculum_year) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(sql, [
        currentNextId++,
        cleanDept,
        cleanCode,
        cleanDesc,
        cleanMajor,
        cleanStatus,
        cleanCurrYear
      ]);

      insertedCount++;
    }

    await connection.commit();

    await logAuditTrail(
      req.user?.id || 1,
      req.user?.role || 'Registrar',
      "BULK_IMPORT_PROGRAMS",
      `Bulk imported academic programs: ${insertedCount} inserted, ${skippedCount} skipped`,
      req
    );

    return res.status(200).json({
      success: true,
      message: `Import complete! ${insertedCount} programs added, ${skippedCount} skipped (duplicates/invalid).`,
      inserted: insertedCount,
      skipped: skippedCount,
      skippedDetails
    });
  } catch (error) {
    await connection.rollback();
    console.error("bulkImportAcademicPrograms error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  } finally {
    connection.release();
  }
};



