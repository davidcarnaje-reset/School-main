<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->student_id) || !isset($data->note_date) || !isset($data->note_text)) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO student_calendar_notes (student_id, note_date, note_text) VALUES (?, ?, ?)");
    $stmt->execute([$data->student_id, $data->note_date, $data->note_text]);

    // ARCHITECT FIX: Ibinabalik natin ang ID ng kakagawang note
    $newId = $pdo->lastInsertId();
    echo json_encode(["status" => "success", "id" => $newId]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>