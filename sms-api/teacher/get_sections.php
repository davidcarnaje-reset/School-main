<?php
/**
 * TEACHER DASHBOARD: FETCH ASSIGNED SECTIONS & OVERALL STUDENT COUNT
 * Location: sms-api/teacher/get_sections.php
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

// Token Gatekeeper 
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} else {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$teacherId = isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : null;

if (!$teacherId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Teacher ID is required."]);
    exit();
}

try {
    // 1. Get individual class assignments and their specific headcounts based strictly on 'Enrolled' status
    $query = "SELECT 
                ca.id, 
                COALESCE(sec.section_name, 'TBA') as section_name, 
                sec.grade_level as level,
                sec.department,
                s.level_category,
                ca.school_year,
                COALESCE(r.room_name, 'TBA') as room,
                ca.schedule,
                s.subject_description as subject,
                (SELECT COUNT(e.student_id) FROM enrollments e 
                 WHERE e.section_id = ca.section_id 
                 AND e.status = 'Enrolled') as student_count
              FROM class_assignments ca
              JOIN subjects s ON ca.subject_id = s.id
              LEFT JOIN sections sec ON ca.section_id = sec.id
              LEFT JOIN rooms r ON ca.room_id = r.id
              WHERE ca.teacher_id = :teacher_id AND ca.is_active = 1";

    $stmt = $pdo->prepare($query);
    $stmt->execute(['teacher_id' => $teacherId]);
    $sections_arr = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get OVERALL UNIQUE students handled by this teacher based on 'Enrolled' status
    $overallQuery = "SELECT COUNT(DISTINCT e.student_id) as total_unique_students 
                     FROM class_assignments ca
                     JOIN enrollments e ON ca.section_id = e.section_id
                     WHERE ca.teacher_id = :teacher_id 
                     AND ca.is_active = 1 
                     AND e.status = 'Enrolled'";
                     
    $overallStmt = $pdo->prepare($overallQuery);
    $overallStmt->execute(['teacher_id' => $teacherId]);
    $overallResult = $overallStmt->fetch(PDO::FETCH_ASSOC);
    
    // Safely cast to integer
    $totalOverallStudents = $overallResult ? (int)$overallResult['total_unique_students'] : 0;

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "total_overall_students" => $totalOverallStudents,
        "data" => $sections_arr ?: []
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>