<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

/**
 * SMS - Learning Management System API
 * Purpose: Fetch all enrolled courses with dynamic categorization using level_category and subject_type.
 */

$studentId = $_GET['student_id'] ?? '';

if (!$studentId) {
    echo json_encode(["status" => "error", "message" => "Missing student_id"]);
    exit;
}

try {
    // Gagamitin natin ang subject_type bilang ating 'category' key para sa frontend filtering.
    $query = "
        SELECT 
            ca.id as class_id,
            s.subject_code as tag,
            s.subject_description as title,
            -- Ang 'category' field na ito ang gagamitin ng React useOutletContext
            LOWER(s.subject_type) as category, 
            s.level_category,
            CONCAT(u.first_name, ' ', u.last_name) as teacher,
            (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = ca.id AND status = 'Enrolled') as student_count,
            (SELECT COUNT(*) FROM classroom_modules WHERE class_id = ca.id) as total_lessons,
            (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = ca.id AND student_id = :sid) as completed_lessons
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        JOIN users u ON ca.teacher_id = u.id
        WHERE ec.student_id = :sid 
          AND ec.status = 'Enrolled'
        ORDER BY s.subject_code ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute(['sid' => $studentId]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "count" => count($courses),
        "courses" => $courses
    ]);

} catch (PDOException $e) {
    error_log("LMS API Error (get_all_courses): " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Internal Server Error"]);
}
?>