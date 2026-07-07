import pool from '../../config/db.js';

// GET all rooms
export const getRooms = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, id as room_id, room_name, room_type, capacity, status FROM rooms ORDER BY id DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error("Get rooms error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// CREATE a room
export const createRoom = async (req, res) => {
  try {
    const { room_name, room_type, capacity, status } = req.body;

    if (!room_name || !capacity) {
      return res.status(400).json({ status: 'error', message: "Room name and capacity are required." });
    }

    // Get the next ID since the primary key lacks AUTO_INCREMENT in DB schema
    const [idRows] = await pool.query("SELECT MAX(id) as maxId FROM rooms");
    const nextId = (idRows[0].maxId || 0) + 1;

    await pool.query(
      "INSERT INTO rooms (id, room_name, room_type, capacity, status) VALUES (?, ?, ?, ?, ?)",
      [nextId, room_name, room_type || 'Physical', capacity, status || 'Active']
    );

    return res.json({
      status: 'success',
      message: "Room created successfully.",
      data: { id: nextId, room_name, room_type, capacity, status }
    });
  } catch (error) {
    console.error("Create room error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// UPDATE a room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name, room_type, capacity, status } = req.body;

    if (!room_name || !capacity) {
      return res.status(400).json({ status: 'error', message: "Room name and capacity are required." });
    }

    await pool.query(
      "UPDATE rooms SET room_name = ?, room_type = ?, capacity = ?, status = ? WHERE id = ?",
      [room_name, room_type || 'Physical', capacity, status || 'Active', id]
    );

    return res.json({
      status: 'success',
      message: "Room updated successfully."
    });
  } catch (error) {
    console.error("Update room error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// DELETE a room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: 'error', message: "Room ID is required." });
    }

    await pool.query("DELETE FROM rooms WHERE id = ?", [id]);

    return res.json({
      status: 'success',
      message: "Room deleted successfully."
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

export default { getRooms, createRoom, updateRoom, deleteRoom };
