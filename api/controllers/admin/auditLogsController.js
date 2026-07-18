import pool from '../../config/db.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { action_type, user_role, search } = req.query;
    
    let query = `
      SELECT 
        al.log_id as id, 
        al.user_id, 
        al.user_role, 
        al.action_type, 
        al.description, 
        al.ip_address, 
        al.created_at as timestamp,
        CASE 
          WHEN al.user_role = 'student' THEN (
            SELECT CONCAT(first_name, ' ', last_name) 
            FROM students 
            WHERE student_id COLLATE utf8mb4_general_ci = CAST(al.user_id AS CHAR) COLLATE utf8mb4_general_ci
            LIMIT 1
          )
          ELSE (
            SELECT full_name 
            FROM users 
            WHERE id = al.user_id 
            LIMIT 1
          )
        END as actor_name
      FROM audit_logs al
      WHERE 1=1
    `;
    const params = [];

    if (action_type) {
      query += " AND al.action_type = ?";
      params.push(action_type);
    }

    if (user_role) {
      query += " AND al.user_role = ?";
      params.push(user_role);
    }

    if (search) {
      query += " AND (al.description LIKE ? OR al.action_type LIKE ? OR al.ip_address LIKE ?)";
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += " ORDER BY al.created_at DESC LIMIT 1000";

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      logs: rows
    });
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error fetching audit logs."
    });
  }
};
