<?php
// sms-api/registrar/delete_class_assign.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS')
    exit();
require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    echo json_encode(["success" => false, "message" => "Class ID is required."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Burahin ang mga naka-enroll na bata sa schedule na 'to (Cascade Delete)
    $stmt1 = $pdo->prepare("DELETE FROM enrolled_classes WHERE class_assignment_id = :id");
    $stmt1->execute(['id' => $data->id]);

    // 2. Burahin ang mismong Class Schedule
    $stmt2 = $pdo->prepare("DELETE FROM class_assignments WHERE id = :id");
    $stmt2->execute(['id' => $data->id]);

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Class Schedule and related enrollments deleted!"]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>