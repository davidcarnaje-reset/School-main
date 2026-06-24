import pool from '../config/db.js';

/**
 * Utility helper upang i-log ang mga aktibidad ng mga gumagamit (audit logs)
 */
export async function logAuditTrail(userId, role, actionType, description, req) {
  try {
    const ipAddress = req 
      ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown') 
      : 'Unknown';

    const query = `
      INSERT INTO audit_logs (user_id, user_role, action_type, description, ip_address) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
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
