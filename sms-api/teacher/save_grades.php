<?php
/**
 * TEACHER MODULE: SAVE / UPDATE GRADES
 * Location: sms-api/teacher/save_grades.php
 * Supports: K-12 (quarter 1-4) and College (quarter 1=Prelim, 2=Midterm, 3=Finals)
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
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$classId = isset($data->class_id) ? intval($data->class_id) : null;
$quarter = isset($data->quarter) ? intval($data->quarter) : null; // 1-4 for K-12, 1-3 for College
$period = isset($data->period) ? intval($data->period) : null; // Alternative for College
$students = $data->students ?? [];

// Use period if provided, otherwise use quarter
$selectedQuarter = $period ?? $quarter;

if (!$classId || $selectedQuarter === null || empty($students)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Class ID, quarter/period, and student data are required."]);
    exit();
}

try {
    $pdo->beginTransaction();

    foreach ($students as $s) {
        $studentId = $s->student_id;
        
        // Component grades
        $written = isset($s->written) ? floatval($s->written) : 0;
        $performance = isset($s->performance) ? floatval($s->performance) : 0;
        $exam = isset($s->exam) ? floatval($s->exam) : 0;
        
        // Final grade and remarks (computed by frontend)
        $finalGrade = isset($s->final_grade) ? floatval($s->final_grade) : 0;
        $remarks = isset($s->remarks) ? $s->remarks : 'N/A';

        // Check if record exists for this class/student/quarter
        $checkQ = "SELECT id FROM student_grades WHERE class_id = :cid AND student_id = :sid AND quarter = :qtr LIMIT 1";
        $checkStmt = $pdo->prepare($checkQ);
        $checkStmt->execute([
            ':cid' => $classId,
            ':sid' => $studentId,
            ':qtr' => $selectedQuarter
        ]);
        $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($exists) {
            // UPDATE existing record
            $updateQ = "UPDATE student_grades 
                        SET written = :w, 
                            performance = :p, 
                            exam = :e, 
                            final_grade = :fg, 
                            remarks = :rm
                        WHERE id = :id";
            $updateStmt = $pdo->prepare($updateQ);
            $updateStmt->execute([
                ':w' => $written,
                ':p' => $performance,
                ':e' => $exam,
                ':fg' => $finalGrade,
                ':rm' => $remarks,
                ':id' => $exists['id']
            ]);
        } else {
            // INSERT new record
            $insertQ = "INSERT INTO student_grades 
                        (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
                        VALUES (:cid, :sid, :qtr, :w, :p, :e, :fg, :rm)";
            $insertStmt = $pdo->prepare($insertQ);
            $insertStmt->execute([
                ':cid' => $classId,
                ':sid' => $studentId,
                ':qtr' => $selectedQuarter,
                ':w' => $written,
                ':p' => $performance,
                ':e' => $exam,
                ':fg' => $finalGrade,
                ':rm' => $remarks
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Grades successfully saved!"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>