<?php
// cashier/get_dashboard_stats.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE 1: Gamitin ang PDO config natin
require '../config.php';

try {
    // 1. PINAGSAMA NA NATIN ANG QUERIES (Efficiency)
    // Kukuha tayo ng Total Sum at Total Count sa iisang takbo lang ng database
    $sql_stats = "SELECT 
                    SUM(amount_paid) as total_today, 
                    COUNT(*) as today_count 
                  FROM payments 
                  WHERE DATE(transaction_date) = CURDATE()";

    $stmt_stats = $pdo->query($sql_stats);
    $row_stats = $stmt_stats->fetch();

    $total_today = $row_stats['total_today'] ?? 0;
    $today_count = $row_stats['today_count'] ?? 0;

    // 2. BREAKDOWN PER METHOD (Optimized)
    // Imbes na mag-loop at mag-query ng 3 beses, isang "GROUP BY" lang ang kailangan
    $breakdown = ['Cash' => 0, 'GCash' => 0, 'Card' => 0];

    $sql_breakdown = "SELECT payment_method, SUM(amount_paid) as subtotal 
                      FROM payments 
                      WHERE DATE(transaction_date) = CURDATE() 
                      GROUP BY payment_method";

    $stmt_m = $pdo->query($sql_breakdown);
    while ($row_m = $stmt_m->fetch()) {
        $breakdown[$row_m['payment_method']] = (float) $row_m['subtotal'];
    }

    // 3. FINAL RESPONSE
    echo json_encode([
        "totalCollections" => "₱" . number_format($total_today, 2),
        "todayTransactions" => (int) $today_count,
        "pendingPayments" => 0, // Placeholder for future logic (e.g. unverified GCash)
        "breakdown" => $breakdown
    ]);

} catch (PDOException $e) {
    // ARCHITECT UPDATE: Error handling para malaman mo agad kung bakit hindi lumalabas ang data
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>