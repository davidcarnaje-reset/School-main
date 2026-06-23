<?php
/**
 * LOCATION: sms-api/student/get_student_billing.php
 * STATUS: FIXED FOR PDO (Compatible with your config.php)
 */
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

// 1. Path adjustment - Siguraduhing tama ang daan papuntang config.php
require_once '../config.php'; 

$search = isset($_GET['search']) ? $_GET['search'] : '';

if (!$search) {
    echo json_encode(["status" => "error", "message" => "No search ID provided"]);
    exit();
}

try {
    // 2. QUERY 1: Kunin ang Main Billing Record (Gamit ang PDO :search para safe sa SQL Injection)
    $sql = "SELECT b.*, s.first_name, s.last_name 
            FROM student_billing b
            JOIN students s ON b.student_id = s.student_id
            WHERE b.student_id = :search OR s.last_name LIKE :search_like
            LIMIT 1";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'search' => $search,
        'search_like' => "%$search%"
    ]);
    
    $row = $stmt->fetch();

    if ($row) {
        $billing_id = $row['id']; // Ito ang ID na gagamitin natin sa Items table

        // 3. QUERY 2: Kunin ang Breakdown mula sa student_billing_items (Foreign Key logic)
        $items_sql = "SELECT item_name, amount, paid_amount, balance 
                      FROM student_billing_items 
                      WHERE billing_id = :billing_id";
                      
        $items_stmt = $pdo->prepare($items_sql);
        $items_stmt->execute(['billing_id' => $billing_id]);
        $items = $items_stmt->fetchAll();

        // 4. ECHo THE FINAL JSON
        echo json_encode([
            "status" => "success",
            "data" => [
                "id" => $row['student_id'],
                "name" => $row['first_name'] . " " . $row['last_name'],
                "total" => (float)$row['total_amount'],
                "paid" => (float)$row['paid_amount'],
                "balance" => (float)$row['balance'],
                "status" => $row['payment_status']
            ],
            "items" => $items // Dito na papasok ang "Tuition Fee" row
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "No billing found"]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>