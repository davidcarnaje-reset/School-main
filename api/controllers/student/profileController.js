import pool from '../../config/db.js';

// GET STUDENT FULL NAME BY ID
export const getStudentName = async (req, res) => {
  const studentId = req.query.id || '';

  if (!studentId) {
    return res.status(400).json({ status: "empty", message: "No ID provided" });
  }

  try {
    const query = "SELECT first_name, last_name FROM students WHERE TRIM(student_id) LIKE TRIM(?) LIMIT 1";
    const [rows] = await pool.query(query, [studentId]);

    if (rows.length > 0) {
      const row = rows[0];
      const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim().toUpperCase();
      return res.json({
        status: "found",
        name: fullName
      });
    } else {
      return res.json({
        status: "not_found",
        debug: "No record for ID: " + studentId
      });
    }

  } catch (error) {
    console.error("Get student name error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

// UPDATE STUDENT CONTACT PROFILE AND IMAGE
export const updateStudent = async (req, res) => {
  try {
    const studentId = req.body.student_id;
    const email = req.body.email || '';
    const mobileNo = req.body.mobile_no || '';
    const addressHouse = req.body.address_house || '';

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is missing." });
    }

    const params = [email, mobileNo, addressHouse];
    let imageSql = "";

    // If file was successfully uploaded by multer
    if (req.file) {
      imageSql = ", profile_image = ?";
      params.push(req.file.filename);
    }

    params.push(studentId);

    const query = `
      UPDATE students SET 
        email = ?, 
        mobile_no = ?, 
        address_house = ? 
        ${imageSql} 
      WHERE student_id = ?
    `;

    const [result] = await pool.query(query, params);

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: "Profile updated successfully!" });
    } else {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

  } catch (error) {
    console.error("Update student profile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getStudentName, updateStudent };
