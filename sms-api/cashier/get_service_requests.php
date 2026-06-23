<?php
// cashier/get_service_requests.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Gamitin ang PDO connection
require '../config.php';

$id = $_GET['id'] ?? '';

if ($id) {
    try {
        // 1. ARCHITECT UPDATE: Prepared Statement para sa Student Name
        $s_stmt = $pdo->prepare("SELECT first_name, last_name FROM students WHERE student_id = :id LIMIT 1");
        $s_stmt->execute(['id' => $id]);
        $student = $s_stmt->fetch();

        if ($student) {
            // 2. Kunin ang Pending Payment items gamit ang JOIN sa Catalog
            // Ginamit natin ang JOIN logic mo dahil ito ang pinaka-accurate
            $sql = "SELECT sr.id, sr.status, fc.item_name, fc.amount 
                    FROM service_requests sr
                    JOIN fees_catalog fc ON sr.fee_id = fc.id
                    WHERE sr.student_id = :id AND sr.status = 'Pending Payment'";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            $items = $stmt->fetchAll();

            echo json_encode([
                "status" => "success",
                "student_name" => $student['first_name'] . " " . $student['last_name'],
                "items" => $items ?: [] // Return empty array kung walang pending
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Student ID not found in database."]);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No Student ID provided."]);
}
?>