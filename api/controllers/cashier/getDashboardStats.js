import pool from '../../config/db.js';

const getDashboardStats = async (req, res) => {
  try {
    // 1. All-time Total Collections
    const [totalRows] = await pool.query(`SELECT SUM(amount_paid) as total FROM payments`);
    const totalAllTime = parseFloat(totalRows[0]?.total) || 0;

    // 2. Today's Transactions Count and Sum
    const [todayRows] = await pool.query(`
      SELECT 
        SUM(amount_paid) as today_total, 
        COUNT(*) as today_count 
      FROM payments 
      WHERE DATE(transaction_date) = CURDATE()
    `);
    const today_count = parseInt(todayRows[0]?.today_count, 10) || 0;

    // 3. Pending Payments (Billings with balance > 0 or status != 'Paid')
    let pendingCount = 0;
    try {
      const [pendingRows] = await pool.query(`
        SELECT COUNT(*) as count 
        FROM student_billing 
        WHERE balance > 0 OR payment_status IN ('Pending', 'Unpaid', 'Partial')
      `);
      pendingCount = parseInt(pendingRows[0]?.count, 10) || 0;
    } catch (e) {
      console.warn("Notice: student_billing query warning:", e.message);
    }

    // 4. Active / Total Students Count
    let activeStudents = 0;
    try {
      const [studentRows] = await pool.query(`SELECT COUNT(*) as count FROM students`);
      activeStudents = parseInt(studentRows[0]?.count, 10) || 0;
    } catch (e) {
      console.warn("Notice: students count query warning:", e.message);
    }

    // 5. Breakdown Per Method (Cash, GCash, Card)
    const breakdown = { Cash: 0, GCash: 0, Card: 0 };
    const [breakdownRows] = await pool.query(`
      SELECT payment_method, SUM(amount_paid) as subtotal 
      FROM payments 
      GROUP BY payment_method
    `);
    breakdownRows.forEach(row => {
      if (row.payment_method) {
        breakdown[row.payment_method] = parseFloat(row.subtotal) || 0;
      }
    });

    // 6. Weekly Revenue Trend (Past 7 days)
    const [weeklyRows] = await pool.query(`
      SELECT 
        DATE(transaction_date) as date_val,
        DAYNAME(transaction_date) as day_name,
        SUM(amount_paid) as daily_total
      FROM payments
      WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(transaction_date), DAYNAME(transaction_date)
      ORDER BY DATE(transaction_date) ASC
    `);

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const found = weeklyRows.find(r => {
        if (!r.date_val) return false;
        const rDate = new Date(r.date_val).toISOString().split('T')[0];
        return rDate === dateStr;
      });

      weeklyData.push({
        day: dayName,
        date: dateStr,
        amount: found ? parseFloat(found.daily_total) || 0 : 0
      });
    }

    // 7. Monthly Overview (Prev Month, Current Month, Next Month)
    const monthsArr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const prevMonthIdx = (currentMonthIdx - 1 + 12) % 12;
    const nextMonthIdx = (currentMonthIdx + 1) % 12;

    const [monthlyRows] = await pool.query(`
      SELECT 
        MONTH(transaction_date) as m_num,
        SUM(amount_paid) as m_total
      FROM payments
      WHERE YEAR(transaction_date) = YEAR(CURDATE())
      GROUP BY MONTH(transaction_date)
    `);

    const getMonthlyAmount = (mIdx) => {
      const found = monthlyRows.find(r => parseInt(r.m_num, 10) === (mIdx + 1));
      return found ? parseFloat(found.m_total) || 0 : 0;
    };

    const monthlyData = [
      { name: monthsArr[prevMonthIdx], amount: getMonthlyAmount(prevMonthIdx) },
      { name: monthsArr[currentMonthIdx], amount: getMonthlyAmount(currentMonthIdx) },
      { name: monthsArr[nextMonthIdx], amount: getMonthlyAmount(nextMonthIdx) }
    ];

    const totalCollectionsFormatted = "₱" + totalAllTime.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return res.json({
      totalCollections: totalCollectionsFormatted,
      todayTransactions: today_count,
      pendingPayments: pendingCount,
      activeStudents: activeStudents,
      breakdown: breakdown,
      weeklyRevenue: weeklyData,
      monthlyRevenue: monthlyData
    });

  } catch (error) {
    console.error("Get cashier stats error:", error);
    return res.status(500).json({ success: false, message: "Database Error: " + error.message });
  }
};

export default getDashboardStats;
