import pool from '../../config/db.js';

export const manageFees = async (req, res) => {
  const method = req.method;

  try {
    switch (method) {
      case 'GET': {
        const [rows] = await pool.query("SELECT * FROM fees_catalog ORDER BY category ASC, item_name ASC");
        const formatted = (rows || []).map(r => ({
          ...r,
          amount: parseFloat(r.amount)
        }));
        return res.json(formatted);
      }

      case 'POST': {
        const { id, item_name, amount, category, applicable_to = 'All' } = req.body;

        if (!item_name || amount === undefined || !category) {
          return res.status(400).json({ status: "error", message: "Item Name, Amount, and Category are required." });
        }

        const amt = parseFloat(amount);

        if (id) {
          // UPDATE Logic
          const sql = "UPDATE fees_catalog SET item_name = ?, amount = ?, category = ?, applicable_to = ? WHERE id = ?";
          await pool.query(sql, [item_name.trim(), amt, category.trim(), applicable_to.trim(), parseInt(id, 10)]);
          return res.json({ status: "success", message: "Item saved successfully!" });
        } else {
          // INSERT Logic
          const connection = await pool.getConnection();
          try {
            await connection.beginTransaction();

            const [maxIdRows] = await connection.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM fees_catalog FOR UPDATE");
            const nextId = maxIdRows[0].maxId + 1;

            const sql = "INSERT INTO fees_catalog (id, item_name, amount, category, applicable_to) VALUES (?, ?, ?, ?, ?)";
            await connection.query(sql, [nextId, item_name.trim(), amt, category.trim(), applicable_to.trim()]);

            await connection.commit();
            return res.json({ status: "success", message: "Item saved successfully!" });
          } catch (e) {
            await connection.rollback();
            throw e;
          } finally {
            connection.release();
          }
        }
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ status: "error", message: "ID is required for deletion." });
        }

        const sql = "DELETE FROM fees_catalog WHERE id = ?";
        await pool.query(sql, [parseInt(id, 10)]);
        return res.json({ status: "success" });
      }
      
      default: {
        return res.status(405).json({ status: "error", message: "Method Not Allowed" });
      }
    }
  } catch (error) {
    console.error("manageFees error:", error);
    return res.status(500).json({ status: "error", message: "Database Error: " + error.message });
  }
};
