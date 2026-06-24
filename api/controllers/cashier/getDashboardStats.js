import pool from '../../config/db.js';

const getDashboardStats = async (req, res) => {
  try {
    // 1. PINAGSAMA NA NATIN ANG QUERIES (Total Sum at Count sa iisang query para sa efficiency)
    const sql_stats = `
      SELECT 
        SUM(amount_paid) as total_today, 
        COUNT(*) as today_count 
      FROM payments 
      WHERE DATE(transaction_date) = CURDATE()
    `;
    const [statsRows] = await pool.query(sql_stats);
    const row_stats = statsRows[0] || {};

    const total_today = parseFloat(row_stats.total_today) || 0;
    const today_count = parseInt(row_stats.today_count, 10) || 0;

    // 2. BREAKDOWN PER METHOD (GCash, Cash, Card)
    const breakdown = { Cash: 0, GCash: 0, Card: 0 };
    const sql_breakdown = `
      SELECT payment_method, SUM(amount_paid) as subtotal 
      FROM payments 
      WHERE DATE(transaction_date) = CURDATE() 
      GROUP BY payment_method
    `;
    const [breakdownRows] = await pool.query(sql_breakdown);
    breakdownRows.forEach(row => {
      // Direct assignment para sa standard methods
      breakdown[row.payment_method] = parseFloat(row.subtotal) || 0;
    });

    // 3. FINAL RESPONSE FORMAT (May kasamang ₱ currency formatting)
    const totalCollectionsFormatted = "₱" + total_today.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return res.json({
      totalCollections: totalCollectionsFormatted,
      todayTransactions: today_count,
      pendingPayments: 0,
      breakdown: breakdown
    });

  } catch (error) {
    console.error("Get cashier stats error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default getDashboardStats;
