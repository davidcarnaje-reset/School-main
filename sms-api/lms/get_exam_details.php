<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$activityId = $_GET['activity_id'] ?? '';
$studentId = $_GET['student_id'] ?? '';

if (!$activityId || !$studentId) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit;
}

try {
    // 1. Fetch Exam Info (DITO NATIN IDINAGDAG YUNG time_limit_minutes AT max_attempts)
    $actStmt = $pdo->prepare("SELECT id, title, description, category, max_score, time_limit_minutes, max_attempts FROM activities WHERE id = ?");
    $actStmt->execute([$activityId]);
    $activity = $actStmt->fetch(PDO::FETCH_ASSOC);

    if (!$activity) {
        echo json_encode(["status" => "error", "message" => "Activity not found"]);
        exit;
    }

    // 2. Check Attempts and Score
    $checkStmt = $pdo->prepare("SELECT score, status, attempts FROM student_activity_scores WHERE activity_id = ? AND student_id = ?");
    $checkStmt->execute([$activityId, $studentId]);
    $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);

    $currentAttempts = $existingRecord ? (int) $existingRecord['attempts'] : 0;
    $maxAttempts = $activity['max_attempts'] ? (int) $activity['max_attempts'] : 1;

    if ($currentAttempts >= $maxAttempts) {
        echo json_encode([
            "status" => "success",
            "already_taken" => true,
            "score_details" => [
                "score" => $existingRecord ? (float) $existingRecord['score'] : 0,
                "total" => (float) $activity['max_score']
            ]
        ]);
        exit;
    }

    // 3. Fetch Questions & Choices
    $qStmt = $pdo->prepare("SELECT id, question_text, question_type, points FROM exam_questions WHERE activity_id = ? ORDER BY order_num ASC");
    $qStmt->execute([$activityId]);
    $questions = $qStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($questions as &$q) {
        if ($q['question_type'] === 'multiple_choice' || $q['question_type'] === 'true_false') {
            $cStmt = $pdo->prepare("SELECT id, choice_text FROM exam_choices WHERE question_id = ?");
            $cStmt->execute([$q['id']]);
            $q['choices'] = $cStmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $q['choices'] = [];
        }
    }

    $activity['questions'] = $questions;

    echo json_encode([
        "status" => "success",
        "already_taken" => false,
        "current_attempts" => $currentAttempts,
        "data" => $activity
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>