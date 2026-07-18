import pool from '../config/db.js';

/**
 * Utility helper upang i-log ang mga aktibidad ng mga gumagamit (audit logs)
 */
export async function logAuditTrail(userId, role, actionType, description, req) {
  try {
    const ipAddress = req 
      ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown') 
      : 'Unknown';

    const [idRows] = await pool.query("SELECT COALESCE(MAX(log_id), 0) AS maxId FROM audit_logs FOR UPDATE");
    const nextId = idRows[0].maxId + 1;

    const query = `
      INSERT INTO audit_logs (log_id, user_id, user_role, action_type, description, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      nextId,
      userId || 1, 
      role || 'Admin', 
      actionType, 
      description, 
      ipAddress
    ]);
  } catch (error) {
    console.error("Audit Trail Error Log:", error);
  }
}
