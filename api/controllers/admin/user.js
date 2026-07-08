import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';
import { sendStaffInvitationEmail } from '../../utils/emailEngine.js';

// GET all users
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, first_name, middle_name, last_name, full_name, email, phone_number, birthday, role, is_verified, status FROM users ORDER BY id DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE a user
export const createUser = async (req, res) => {
  try {
    const { username, first_name, middle_name, last_name, email, birthday, phone_number, role } = req.body;

    if (!username || !first_name || !last_name || !email || !role) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    // Check if email already exists
    const [emailCheck] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (emailCheck.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    // Check if username already exists
    const [userCheck] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
    if (userCheck.length > 0) {
      return res.status(400).json({ success: false, message: "Username is already taken." });
    }

    // Generate a default temporary password
    const tempPassword = 'Temp_' + Math.random().toString(36).substring(2, 10) + '!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const fullName = `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`;
    const verificationToken = 'token_' + Math.random().toString(36).substring(2, 15);

    // Get the next ID since the database schema lacks AUTO_INCREMENT
    const [idRows] = await pool.query("SELECT MAX(id) as maxId FROM users");
    const nextId = (idRows[0].maxId || 0) + 1;

    const [result] = await pool.query(
      `INSERT INTO users (id, username, password, first_name, middle_name, last_name, full_name, email, phone_number, birthday, role, status, is_verified, verification_token) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 0, ?)`,
      [nextId, username, hashedPassword, first_name, middle_name || null, last_name, fullName, email, phone_number || null, birthday || null, role, verificationToken]
    );

    // Send verification / invitation email to the newly invited staff member
    try {
      await sendStaffInvitationEmail(email, fullName, role, verificationToken, username);
    } catch (emailErr) {
      console.error("[EMAIL ALERT] Failed to send staff invitation email:", emailErr.message);
    }

    return res.json({
      success: true,
      message: "Staff invited successfully. Verification token generated.",
      data: { id: nextId, username, email, role }
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE a user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, first_name, middle_name, last_name, email, birthday, phone_number, role } = req.body;

    if (!username || !first_name || !last_name || !email || !role) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    // Check if username belongs to someone else
    const [userCheck] = await pool.query("SELECT id FROM users WHERE username = ? AND id != ?", [username, id]);
    if (userCheck.length > 0) {
      return res.status(400).json({ success: false, message: "Username is already taken by another account." });
    }

    // Check if email belongs to someone else
    const [emailCheck] = await pool.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
    if (emailCheck.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already registered to another account." });
    }

    const fullName = `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`;

    await pool.query(
      `UPDATE users SET username = ?, first_name = ?, middle_name = ?, last_name = ?, full_name = ?, email = ?, birthday = ?, phone_number = ?, role = ? 
       WHERE id = ?`,
      [username, first_name, middle_name || null, last_name, fullName, email, birthday || null, phone_number || null, role, id]
    );

    return res.json({
      success: true,
      message: "User updated successfully."
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE a user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: "User deleted successfully."
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CHECK email availability
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ exists: false, message: "Email is required." });
    }

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    return res.json({
      exists: rows.length > 0
    });
  } catch (error) {
    console.error("Check email error:", error);
    return res.status(500).json({ exists: false, message: error.message });
  }
};

export default { getUsers, createUser, updateUser, deleteUser, checkEmail };
