<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();

require '../config.php';

$subject_id = $_GET['subject_id'] ?? '';

if (empty($subject_id)) {
    echo json_encode(['success' => false, 'message' => 'Subject ID is required']);
    exit;
}

try {
    // 🛑 ARCHITECT LOGIC: 
    // Kukunin natin yung Schedule, Room, Teacher, Section... 
    // AT bibilangin natin ang mga students (student_count) na naka-enroll sa klase na 'to!
    $sql = "SELECT 
                ca.id as class_id, 
                ca.schedule, 
                r.room_name as room,
                u.first_name, 
                u.last_name, 
                sec.section_name,
                sec.grade_level,
                (SELECT COUNT(id) FROM enrolled_classes ec WHERE ec.class_assignment_id = ca.id AND ec.status = 'Enrolled') as student_count
            FROM class_assignments ca
            LEFT JOIN users u ON ca.teacher_id = u.id
            LEFT JOIN sections sec ON ca.section_id = sec.id
            LEFT JOIN rooms r ON ca.room_id = r.id
            WHERE ca.subject_id = :subject_id AND ca.is_active = 1
            ORDER BY sec.grade_level ASC, sec.section_name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':subject_id' => $subject_id]);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "classes" => $classes]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>