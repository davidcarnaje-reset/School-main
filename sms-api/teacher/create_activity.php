<?php
/**
 * TEACHER MODULE: CREATE ACTIVITY
 * Location: sms-api/teacher/create_activity.php
 * Updated: Added quarter support for K-12/SHS quarter system
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

// Auth check goes here (copy your standard gatekeeper)

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->class_id) || !isset($data->teacher_id) || !isset($data->title) || !isset($data->category)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit();
}

// quarter = 1/2/3/4 for K-12/SHS activities, null for College
$quarter = isset($data->quarter) ? intval($data->quarter) : null;

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO activities (class_id, quarter, teacher_id, title, description, category, max_score, due_date) 
        VALUES (:class_id, :quarter, :teacher_id, :title, :desc, :category, :max_score, :due_date)
    ");
    
    $stmt->execute([
        ':class_id'   => $data->class_id,
        ':quarter'    => $quarter,           // NULL for College, 1-4 for K-12/SHS
        ':teacher_id' => $data->teacher_id,
        ':title'      => $data->title,
        ':desc'       => $data->description ?? null,
        ':category'   => $data->category,
        ':max_score'  => $data->max_score ?? 100,
        ':due_date'   => isset($data->due_date) && $data->due_date ? $data->due_date : null
    ]);
    
    $activityId = $pdo->lastInsertId();

    // Auto-assign to all enrolled students with Pending status
    $studentStmt = $pdo->prepare("
        SELECT student_id FROM enrolled_classes 
        WHERE class_assignment_id = :class_id AND status = 'Enrolled'
    ");
    $studentStmt->execute([':class_id' => $data->class_id]);
    $students = $studentStmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($students) > 0) {
        $insertScoreStmt = $pdo->prepare("
            INSERT INTO student_activity_scores (activity_id, student_id, score, status) 
            VALUES (:act_id, :std_id, 0, 'Pending')
        ");
        foreach ($students as $studentId) {
            $insertScoreStmt->execute([':act_id' => $activityId, ':std_id' => $studentId]);
        }
    }

    $pdo->commit();
    echo json_encode([
        "status"  => "success",
        "message" => "Activity created successfully.",
        "data"    => ["activity_id" => $activityId]
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>