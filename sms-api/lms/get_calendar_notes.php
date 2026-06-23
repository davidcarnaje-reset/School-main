<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$studentId = $_GET['student_id'] ?? '';

if (!$studentId) {
    echo json_encode(["status" => "error", "message" => "Missing ID"]);
    exit;
}

try {
    // ARCHITECT FIX: Isinama natin ang `id` sa SELECT query
    $stmt = $pdo->prepare("
        SELECT id, DAY(note_date) as day, note_text 
        FROM student_calendar_notes 
        WHERE student_id = ? AND MONTH(note_date) = MONTH(CURRENT_DATE()) AND YEAR(note_date) = YEAR(CURRENT_DATE())
    ");
    $stmt->execute([$studentId]);
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "notes" => $notes]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>