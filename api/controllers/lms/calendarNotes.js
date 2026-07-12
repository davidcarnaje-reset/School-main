import pool from '../../config/db.js';

// GET calendar notes for current month
export const getCalendarNotes = async (req, res) => {
  const studentId = req.query.student_id;

  if (!studentId) {
    return res.status(400).json({ status: 'error', message: 'Missing ID' });
  }

  try {
    const query = `
      SELECT id, DAY(note_date) as day, note_text 
      FROM student_calendar_notes 
      WHERE student_id = ? 
        AND MONTH(note_date) = MONTH(CURRENT_DATE()) 
        AND YEAR(note_date) = YEAR(CURRENT_DATE())
    `;

    const [notes] = await pool.query(query, [studentId]);

    return res.json({ status: 'success', notes });

  } catch (error) {
    console.error("Get calendar notes error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

// SAVE calendar note
export const saveCalendarNote = async (req, res) => {
  const { student_id: studentId, note_date: noteDate, note_text: noteText } = req.body;

  if (!studentId || !noteDate || !noteText) {
    return res.status(400).json({ status: 'error', message: 'Missing data' });
  }

  try {
    const query = "INSERT INTO student_calendar_notes (student_id, note_date, note_text) VALUES (?, ?, ?)";
    const [result] = await pool.query(query, [studentId, noteDate, noteText]);

    return res.json({ status: 'success', id: result.insertId });

  } catch (error) {
    console.error("Save calendar note error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

// DELETE calendar note
export const deleteCalendarNote = async (req, res) => {
  const { id, student_id: studentId } = req.body;

  if (!id || !studentId) {
    return res.status(400).json({ status: 'error', message: 'Missing data' });
  }

  try {
    const query = "DELETE FROM student_calendar_notes WHERE id = ? AND student_id = ?";
    await pool.query(query, [id, studentId]);

    return res.json({ status: 'success' });

  } catch (error) {
    console.error("Delete calendar note error:", error);
    return res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

export default { getCalendarNotes, saveCalendarNote, deleteCalendarNote };
