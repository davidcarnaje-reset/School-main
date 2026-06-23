<?php
/**
 * TEACHER PORTAL: FETCH CLASS SCHEDULE & TEACHING LOAD
 * Location: sms-api/teacher/get_my_schedule.php
 * Status: SECURE / PDO / FIXED SCHEMA
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

$teacher_id = isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : 0;

if ($teacher_id > 0) {
    try {
        $sql = "SELECT 
                    ca.id, 
                    s.subject_code, 
                    s.subject_description, 
                    s.units, 
                    sec.grade_level, 
                    COALESCE(sec.section_name, 'TBA') as section, 
                    COALESCE(r.room_name, 'TBA') as room, 
                    ca.schedule, 
                    ca.school_year 
                FROM class_assignments ca
                JOIN subjects s ON ca.subject_id = s.id
                LEFT JOIN sections sec ON ca.section_id = sec.id
                LEFT JOIN rooms r ON ca.room_id = r.id
                WHERE ca.teacher_id = :tid AND ca.is_active = 1
                ORDER BY ca.school_year DESC, ca.schedule ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['tid' => $teacher_id]);

        $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $schedule ?: []
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Teacher ID is missing or invalid."
    ]);
}
?>