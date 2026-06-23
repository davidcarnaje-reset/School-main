<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();
require '../config.php';

$section_id = $_GET['section_id'] ?? '';

if (empty($section_id)) {
    echo json_encode(['success' => false, 'message' => 'Section ID is required']);
    exit;
}

try {
    // 1. Kunin ang mga ESTUDYANTE na naka-assign sa section na ito
    // Isasama natin ang 'Assessed' at 'Enrolled' status
    $stmt_students = $pdo->prepare("
        SELECT s.student_id, s.first_name, s.last_name, s.gender, e.status
        FROM enrollments e
        JOIN students s ON e.student_id = s.student_id
        WHERE e.section_id = :sec_id AND e.status IN ('Assessed', 'Enrolled')
        ORDER BY s.last_name ASC
    ");
    $stmt_students->execute([':sec_id' => $section_id]);
    $students = $stmt_students->fetchAll(PDO::FETCH_ASSOC);

    // 2. Kunin ang SCHEDULES na naka-assign sa section na ito
    $stmt_schedules = $pdo->prepare("
        SELECT 
            ca.schedule, ca.room_id, r.room_name, 
            u.first_name as prof_fname, u.last_name as prof_lname, 
            sub.subject_code, sub.subject_description
        FROM class_assignments ca
        LEFT JOIN rooms r ON ca.room_id = r.id
        LEFT JOIN users u ON ca.teacher_id = u.id
        LEFT JOIN subjects sub ON ca.subject_id = sub.id
        WHERE ca.section_id = :sec_id AND ca.is_active = 1
        ORDER BY ca.start_time ASC
    ");
    $stmt_schedules->execute([':sec_id' => $section_id]);
    $schedules = $stmt_schedules->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "students" => $students,
        "schedules" => $schedules,
        "enrolled_count" => count($students)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>