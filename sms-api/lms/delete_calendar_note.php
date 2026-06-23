<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->student_id)) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

try {
    // Siguraduhin na ang estudyanteng nag-delete ay siya ring may-ari ng note
    $stmt = $pdo->prepare("DELETE FROM student_calendar_notes WHERE id = ? AND student_id = ?");
    $stmt->execute([$data->id, $data->student_id]);

    echo json_encode(["status" => "success"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>