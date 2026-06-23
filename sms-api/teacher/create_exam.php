<?php
/**
 * TEACHER MODULE: CREATE QUARTERLY EXAM
 * Location: sms-api/teacher/create_exam.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

// Decode JSON Payload from React
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->teacher_id) || !isset($data->exam_details) || !isset($data->questions)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required exam data."]);
    exit();
}

$teacher_id = $data->teacher_id;
$details    = $data->exam_details;
$questions  = $data->questions;

try {
    $pdo->beginTransaction();

    // 1. Calculate the total max_score based on the points of all questions
    $max_score = 0;
    foreach($questions as $q) {
        $max_score += floatval($q->points);
    }

    // quarter handling (null if empty or not provided)
    $quarter = (!empty($details->quarter)) ? intval($details->quarter) : null;

    // 2. Insert the main Activity record into the `activities` table
    $stmt = $pdo->prepare("
        INSERT INTO activities (class_id, quarter, teacher_id, title, description, category, max_score, due_date) 
        VALUES (:class_id, :quarter, :teacher_id, :title, :desc, :category, :max_score, :due_date)
    ");
    
    $stmt->execute([
        ':class_id'   => $details->class_id,
        ':quarter'    => $quarter,
        ':teacher_id' => $teacher_id,
        ':title'      => $details->title,
        ':desc'       => $details->description ?? null,
        ':category'   => $details->category, // Usually 'exam', 'finals', 'midterm', etc.
        ':max_score'  => $max_score,
        ':due_date'   => isset($details->due_date) && $details->due_date ? $details->due_date : null
    ]);
    
    $activityId = $pdo->lastInsertId();

    // Prepare statements for questions and choices to run inside the loop
    $qStmt = $pdo->prepare("INSERT INTO exam_questions (activity_id, question_text, question_type, points, order_num) VALUES (?, ?, ?, ?, ?)");
    $cStmt = $pdo->prepare("INSERT INTO exam_choices (question_id, choice_text, is_correct) VALUES (?, ?, ?)");

    // 3. Loop through and Insert all Questions
    foreach ($questions as $index => $q) {
        $qStmt->execute([$activityId, $q->text, $q->type, $q->points, $index + 1]);
        $questionId = $pdo->lastInsertId();

        // 4. Loop through and Insert all Choices if it's multiple choice
        if ($q->type === 'multiple_choice' && isset($q->choices)) {
            foreach ($q->choices as $cIndex => $choiceText) {
                // Determine if this choice is the correct one based on correctChoiceIndex
                $is_correct = ($cIndex === intval($q->correctChoiceIndex)) ? 1 : 0;
                $cStmt->execute([$questionId, $choiceText, $is_correct]);
            }
        }
    }

    // 5. Auto-assign the exam to Enrolled Students (same logic as regular tasks)
    $studentStmt = $pdo->prepare("SELECT student_id FROM enrolled_classes WHERE class_assignment_id = :class_id AND status = 'Enrolled'");
    $studentStmt->execute([':class_id' => $details->class_id]);
    $students = $studentStmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($students) > 0) {
        $insertScoreStmt = $pdo->prepare("INSERT INTO student_activity_scores (activity_id, student_id, score, status) VALUES (?, ?, 0, 'Pending')");
        foreach ($students as $studentId) {
            $insertScoreStmt->execute([$activityId, $studentId]);
        }
    }

    $pdo->commit();
    echo json_encode([
        "status"  => "success",
        "message" => "Examination created successfully.",
        "data"    => ["activity_id" => $activityId]
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>