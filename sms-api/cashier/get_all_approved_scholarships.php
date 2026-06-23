<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';

try {
    // Kinuha natin lahat (Pending, Approved, Rejected, Applied)
    $sql = "SELECT 
                sa.id, 
                sa.student_id, 
                s.first_name, 
                s.last_name, 
                sch.name AS scholarship_name, 
                sch.discount_type, 
                sch.discount_value AS value,
                sa.status
            FROM scholarship_applications sa
            JOIN students s ON sa.student_id = s.student_id
            JOIN scholarships_catalog sch ON sa.scholarship_id = sch.id
            ORDER BY sa.id DESC";

    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $data]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}