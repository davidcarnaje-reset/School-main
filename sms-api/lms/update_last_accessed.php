<?php
include_once '../config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$student_id = $data['student_id'] ?? '';
$class_id = $data['class_id'] ?? '';

if ($student_id && $class_id) {
    try {
        $stmt = $pdo->prepare("UPDATE enrolled_classes SET last_accessed = NOW() 
                               WHERE student_id = :sid AND class_assignment_id = :cid");
        $stmt->execute(['sid' => $student_id, 'cid' => $class_id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>