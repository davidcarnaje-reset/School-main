<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$student_id = $_GET['id'] ?? '';

if (!$student_id) {
    echo json_encode(["status" => "error", "message" => "Student ID is required"]);
    exit();
}

try {
    // Kukunin lang natin ang mga scholarships na 'Approved' na ni Registrar
    // pero hindi pa 'Applied' (kung sakaling magdagdag ka ng Applied status)
    $sql = "SELECT 
                sa.id, 
                sc.name AS scholarship_name, 
                sc.discount_type, 
                sc.discount_value AS value
            FROM scholarship_applications sa
            JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
            WHERE sa.student_id = ? AND sa.status = 'Approved'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$student_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $data]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>