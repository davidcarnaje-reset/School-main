<?php
/**
 * TEACHER MODULE: SYNC SCORES FROM ACTIVITIES
 * Location: sms-api/teacher/sync_grades.php
 * Auto-calculates Written Work and Exam from activity scores
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

// --- AUTH GATEKEEPER ---
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? '';
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$classId = isset($data->class_id) ? intval($data->class_id) : null;
$quarter = isset($data->quarter) ? intval($data->quarter) : null;
$period = isset($data->period) ? intval($data->period) : null;

$selectedQuarter = $period ?? $quarter;

if (!$classId || $selectedQuarter === null) {
    echo json_encode(["status" => "error", "message" => "Class ID and quarter/period are required."]);
    exit();
}

try {
    // 1. Get all enrolled students
    $studentStmt = $pdo->prepare("
        SELECT e.student_id 
        FROM enrollments e
        JOIN class_assignments ca ON e.section_id = ca.section_id
        WHERE ca.id = :cid AND e.status = 'Enrolled'
    ");
    $studentStmt->execute([':cid' => $classId]);
    $students = $studentStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($students)) {
        echo json_encode(["status" => "success", "message" => "No students found."]);
        exit();
    }

    $pdo->beginTransaction();

    foreach ($students as $studentId) {
        // Calculate Written Work (written, quiz, assignment, task)
        $writtenQuery = "
            SELECT SUM(sas.score) as earned, SUM(a.max_score) as total 
            FROM activities a
            LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = :sid
            WHERE a.class_id = :cid 
              AND a.category IN ('written', 'quiz', 'assignment', 'task')
              AND a.quarter = :qtr
        ";
        $writtenStmt = $pdo->prepare($writtenQuery);
        $writtenStmt->execute([':sid' => $studentId, ':cid' => $classId, ':qtr' => $selectedQuarter]);
        $writtenRes = $writtenStmt->fetch(PDO::FETCH_ASSOC);
        $writtenGrade = ($writtenRes && $writtenRes['total'] > 0) 
            ? round(($writtenRes['earned'] / $writtenRes['total']) * 100, 2) 
            : 0;

        // Calculate Exam (exam, quarterly_exam, prelim, midterm, finals)
        $examQuery = "
            SELECT SUM(sas.score) as earned, SUM(a.max_score) as total 
            FROM activities a
            LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = :sid
            WHERE a.class_id = :cid 
              AND a.category IN ('exam', 'quarterly_exam', 'prelim', 'midterm', 'finals')
              AND a.quarter = :qtr
        ";
        $examStmt = $pdo->prepare($examQuery);
        $examStmt->execute([':sid' => $studentId, ':cid' => $classId, ':qtr' => $selectedQuarter]);
        $examRes = $examStmt->fetch(PDO::FETCH_ASSOC);
        $examGrade = ($examRes && $examRes['total'] > 0) 
            ? round(($examRes['earned'] / $examRes['total']) * 100, 2) 
            : 0;

        // Check if record exists
        $checkStmt = $pdo->prepare("
            SELECT id, performance FROM student_grades 
            WHERE class_id = :cid AND student_id = :sid AND quarter = :qtr 
            LIMIT 1
        ");
        $checkStmt->execute([':cid' => $classId, ':sid' => $studentId, ':qtr' => $selectedQuarter]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($exists) {
            // Update - preserve manual performance grade
            $updateStmt = $pdo->prepare("
                UPDATE student_grades 
                SET written = :w, exam = :e
                WHERE id = :id
            ");
            $updateStmt->execute([
                ':w' => $writtenGrade,
                ':e' => $examGrade,
                ':id' => $exists['id']
            ]);
        } else {
            // Insert new record with default performance = 0
            $insertStmt = $pdo->prepare("
                INSERT INTO student_grades 
                (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
                VALUES (:cid, :sid, :qtr, :w, 0, :e, 0, 'N/A')
            ");
            $insertStmt->execute([
                ':cid' => $classId,
                ':sid' => $studentId,
                ':qtr' => $selectedQuarter,
                ':w' => $writtenGrade,
                ':e' => $examGrade
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Written Work and Exam grades synced from activities!"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>