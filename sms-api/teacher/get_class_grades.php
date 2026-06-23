<?php
/**
 * TEACHER MODULE: GET CLASS GRADES
 * Location: sms-api/teacher/get_class_grades.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

$classId = isset($_GET['class_id']) ? intval($_GET['class_id']) : null;
$quarter = isset($_GET['quarter']) ? intval($_GET['quarter']) : null;
$period = isset($_GET['period']) ? intval($_GET['period']) : null;

$selectedQuarter = $period ?? $quarter ?? 1;

if (!$classId) {
    echo json_encode(["status" => "error", "message" => "Class ID required"]);
    exit();
}

try {
    // Get class info
    $stmt = $pdo->prepare("
        SELECT 
            ca.*,
            sub.subject_description,
            sub.subject_code,
            sub.level_category,
            sec.section_name,
            sec.grade_level,
            sec.department
        FROM class_assignments ca
        JOIN subjects sub ON ca.subject_id = sub.id
        JOIN sections sec ON ca.section_id = sec.id
        WHERE ca.id = ?
    ");
    $stmt->execute([$classId]);
    $classInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get students with grades for this quarter
    $query = "
        SELECT 
            s.student_id as id,
            s.student_id as student_number,
            CONCAT(s.last_name, ', ', s.first_name) as name,
            COALESCE(sg.written, 0) as written,
            COALESCE(sg.performance, 0) as performance,
            COALESCE(sg.exam, 0) as exam,
            COALESCE(sg.final_grade, 0) as final_grade,
            COALESCE(sg.remarks, '') as remarks
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        JOIN class_assignments ca ON e.section_id = ca.section_id
        LEFT JOIN student_grades sg ON (
            s.student_id = sg.student_id 
            AND sg.class_id = ca.id 
            AND sg.quarter = ?
        )
        WHERE ca.id = ? AND e.status = 'Enrolled'
        ORDER BY s.last_name ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$selectedQuarter, $classId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get lock status
    $lockStmt = $pdo->prepare("
        SELECT is_locked 
        FROM class_grade_locks 
        WHERE class_id = ? AND quarter = ?
    ");
    $lockStmt->execute([$classId, $selectedQuarter]);
    $lockStatus = $lockStmt->fetchColumn();
    $classInfo['is_grades_submitted'] = ($lockStatus == 1);

    echo json_encode([
        "status" => "success",
        "class_info" => $classInfo,
        "data" => $students
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>