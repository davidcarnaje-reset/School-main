<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

// Frontend is sending 'activity_id', not 'class_id'
$activityId = isset($_GET['activity_id']) ? intval($_GET['activity_id']) : null;

if (!$activityId) {
    echo json_encode(["status" => "error", "message" => "Activity ID required"]);
    exit();
}

try {
    // 1. Get the specific Activity Details (including class_id to find the students)
    $actQuery = "
        SELECT 
            a.*, 
            c.subject_id, 
            c.section_id, 
            sub.subject_description as subject_name, 
            sec.section_name 
        FROM activities a
        JOIN class_assignments c ON a.class_id = c.id
        LEFT JOIN subjects sub ON c.subject_id = sub.id
        LEFT JOIN sections sec ON c.section_id = sec.id
        WHERE a.id = ?
    ";
    $stmt = $pdo->prepare($actQuery);
    $stmt->execute([$activityId]);
    $activity = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$activity) {
        echo json_encode(["status" => "error", "message" => "Activity not found"]);
        exit();
    }

    $classId = $activity['class_id'];

    // 2. Get ALL Enrolled Students for this Class + Left Join their scores and submissions
    $studentsQuery = "
        SELECT 
            s.student_id, 
            CONCAT(s.last_name, ', ', s.first_name) AS name,
            COALESCE(sas.score, '') AS score,
            COALESCE(sas.status, 'Pending') AS status,
            sub.submission_type,
            sub.submission_content
        FROM enrolled_classes ec
        JOIN students s ON ec.student_id = s.student_id
        LEFT JOIN student_activity_scores sas 
            ON sas.student_id = s.student_id AND sas.activity_id = ?
        LEFT JOIN student_submissions sub 
            ON sub.student_id = s.student_id AND sub.activity_id = ?
        WHERE ec.class_assignment_id = ? 
          AND ec.status = 'Enrolled'
        ORDER BY s.last_name ASC, s.first_name ASC
    ";
    
    $stmtStudents = $pdo->prepare($studentsQuery);
    // Pass activityId twice (for the two left joins) and classId once
    $stmtStudents->execute([$activityId, $activityId, $classId]);
    $scores = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);
    
    // Return exact format expected by TeacherActivityGrading.jsx
    echo json_encode([
        "status" => "success", 
        "activity" => $activity,
        "scores" => $scores
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>