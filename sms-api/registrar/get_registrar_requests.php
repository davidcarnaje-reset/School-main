<?php
// registrar/get_registrar_requests.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder, aakyat tayo ng isa para sa config.php
require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    /**
     * ARCHITECT SQL:
     * 1. JOIN Students - para makuha ang Full Name at Student ID.
     * 2. JOIN Fees Catalog - para makuha ang pangalan ng Dokumento (e.g., 'TOR').
     * 3. ORDER BY created_at - para ang pinakabagong request ay nasa itaas.
     */
    $sql = "SELECT 
                r.id, 
                s.student_id, 
                s.first_name, 
                s.last_name, 
                f.item_name, 
                r.status, 
                r.created_at 
            FROM service_requests r
            JOIN students s ON r.student_id = s.student_id
            JOIN fees_catalog f ON r.fee_id = f.id
            ORDER BY r.created_at DESC";

    // Gagamit ng PDO query para sa simpleng data fetching
    $stmt = $pdo->query($sql);
    $requests = $stmt->fetchAll();

    // Ibalik ang array. Empty array [] kung walang nahanap para safe sa React side.
    echo json_encode($requests ?: []);

} catch (PDOException $e) {
    // Database error logging
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>