<?php
/**
 * TEACHER MODULE: SUBMIT FINAL GRADES (LOCK)
 * Location: sms-api/teacher/submit_final_grades.php
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

$data = json_decode(file_get_contents("php://input"));
$classId = isset($data->class_id) ? intval($data->class_id) : null;
$quarter = isset($data->quarter) ? intval($data->quarter) : null;
$students = $data->students ?? [];

if (!$classId || $quarter === null || empty($students)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Class ID, quarter, and students data are required."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Lock the class for this quarter
    $lockQuery = "INSERT INTO class_grade_locks (class_id, quarter, is_locked) 
                  VALUES (:cid, :qtr, 1) 
                  ON DUPLICATE KEY UPDATE is_locked = 1";
    $lockStmt = $pdo->prepare($lockQuery);
    $lockStmt->execute([':cid' => $classId, ':qtr' => $quarter]);

    // 2. Prepare statement for final grades
    $insertFinalQ = "INSERT INTO student_final_grades (class_id, student_id, quarter, final_grade, remarks) 
                     VALUES (:cid, :sid, :qtr, :fg, :rm)
                     ON DUPLICATE KEY UPDATE final_grade = :fg, remarks = :rm";
    $finalStmt = $pdo->prepare($insertFinalQ);

    foreach ($students as $s) {
        $studentId = $s->student_id;
        $written = isset($s->written) ? floatval($s->written) : 0;
        $performance = isset($s->performance) ? floatval($s->performance) : 0;
        $exam = isset($s->exam) ? floatval($s->exam) : 0;
        $finalGrade = isset($s->final_grade) ? floatval($s->final_grade) : 0;
        $remarks = isset($s->remarks) ? $s->remarks : 'N/A';

        // A. Save/Update breakdown in student_grades
        $checkQ = "SELECT id FROM student_grades WHERE class_id = :cid AND student_id = :sid AND quarter = :qtr LIMIT 1";
        $checkStmt = $pdo->prepare($checkQ);
        $checkStmt->execute([':cid' => $classId, ':sid' => $studentId, ':qtr' => $quarter]);
        $exists = $checkStmt->fetchColumn();

        if ($exists) {
            $updateQ = "UPDATE student_grades 
                        SET written = :w, performance = :p, exam = :e, final_grade = :fg, remarks = :rm
                        WHERE id = :id";
            $updateStmt = $pdo->prepare($updateQ);
            $updateStmt->execute([
                ':w' => $written, ':p' => $performance, ':e' => $exam,
                ':fg' => $finalGrade, ':rm' => $remarks, ':id' => $exists
            ]);
        } else {
            $insertQ = "INSERT INTO student_grades 
                        (class_id, student_id, quarter, written, performance, exam, final_grade, remarks) 
                        VALUES (:cid, :sid, :qtr, :w, :p, :e, :fg, :rm)";
            $insertStmt = $pdo->prepare($insertQ);
            $insertStmt->execute([
                ':cid' => $classId, ':sid' => $studentId, ':qtr' => $quarter,
                ':w' => $written, ':p' => $performance, ':e' => $exam,
                ':fg' => $finalGrade, ':rm' => $remarks
            ]);
        }

        // B. Save official final grade
        $finalStmt->execute([
            ':cid' => $classId,
            ':sid' => $studentId,
            ':qtr' => $quarter,
            ':fg' => $finalGrade,
            ':rm' => $remarks
        ]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Final grades submitted and locked!"]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>