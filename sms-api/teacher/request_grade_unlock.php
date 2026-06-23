<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

// Authentication Check para makuha kung sinong teacher nag-request
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? apache_request_headers()['Authorization'] ?? '';
list($jwt) = sscanf($authHeader, 'Bearer %s');
// Simpleng decode (Assuming decoded nyo ito properly sa system nyo, kukunin ko lang via DB check para sure)
// Para mabilis, kukunin na lang natin 'yung sender_id sa payload if available, or static fallback kung wala pang JWT decoder setup
$teacherId = 36; // Paki-palitan ito sa variable kung saan nyo kinukuha ang ID ng naka-login na user.

$data = json_decode(file_get_contents("php://input"));
$classId = isset($data->class_id) ? intval($data->class_id) : null;
$quarter = isset($data->quarter) ? intval($data->quarter) : null;

if (!$classId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Class ID is required."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Kunin ang details ng klase at subject para sa message
    $classStmt = $pdo->prepare("
        SELECT sub.subject_code, sub.subject_description, sec.section_name 
        FROM class_assignments ca
        JOIN subjects sub ON ca.subject_id = sub.id
        JOIN sections sec ON ca.section_id = sec.id
        WHERE ca.id = ?
    ");
    $classStmt->execute([$classId]);
    $classDetails = $classStmt->fetch(PDO::FETCH_ASSOC);

    $subjectName = $classDetails ? $classDetails['subject_description'] : 'Unknown Subject';
    $sectionName = $classDetails ? $classDetails['section_name'] : 'Unknown Section';
    $quarterText = $quarter ? " (Quarter $quarter)" : "";

    $title = "Grade Unlock Request";
    $message = "A teacher is requesting permission to edit the locked grades for $subjectName - $sectionName$quarterText. Please review and unlock via Class Management if approved.";

    // 1. Insert sa notifications table
    $notifStmt = $pdo->prepare("INSERT INTO notifications (sender_id, sender_role, type, title, message, created_at) VALUES (?, 'teacher', 'Task Reminder', ?, ?, NOW())");
    $notifStmt->execute([$teacherId, $title, $message]);
    $notifId = $pdo->lastInsertId();

    // 2. I-send sa lahat ng may role na 'registrar'
    $regStmt = $pdo->query("SELECT id FROM users WHERE role = 'registrar' AND status = 'Active'");
    $registrars = $regStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($registrars) > 0) {
        $recipStmt = $pdo->prepare("INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role, is_read) VALUES (?, ?, 'registrar', 0)");
        foreach ($registrars as $reg) {
            $recipStmt->execute([$notifId, $reg['id']]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Unlock request sent to the registrar."]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>