<?php
// cashier/get_collection_reports.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

// 1. Kunin at i-sanitize ang filters
$startDate = $_GET['start'] ?? null;
$endDate = $_GET['end'] ?? null;

try {
    $params = [];
    // Base SQL with JOIN
    $sql = "SELECT p.*, s.first_name, s.last_name 
            FROM payments p 
            JOIN students s ON p.student_id = s.student_id";

    // 2. ARCHITECT UPDATE: Prepared Statement para sa Date Filter
    if ($startDate && $endDate) {
        $sql .= " WHERE DATE(p.transaction_date) BETWEEN :start AND :end";
        $params['start'] = $startDate;
        $params['end'] = $endDate;
    }

    $sql .= " ORDER BY p.transaction_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $payments = [];
    $stats = ['total' => 0, 'cash' => 0, 'gcash' => 0, 'card' => 0];

    // 3. FETCH AND CALCULATE
    while ($row = $stmt->fetch()) {
        $amount = (float) $row['amount_paid'];
        $stats['total'] += $amount;

        // Gamitin natin ang switch o if para sa methods
        $method = $row['payment_method'];
        if ($method === 'Cash')
            $stats['cash'] += $amount;
        else if ($method === 'GCash')
            $stats['gcash'] += $amount;
        else if ($method === 'Card')
            $stats['card'] += $amount;

        $payments[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "stats" => $stats,
        "data" => $payments
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>