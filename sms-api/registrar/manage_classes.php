<?php
// sms-api/registrar/manage_classes.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method == 'GET') {
        // 1. Kunin lahat ng active assignments (JOIN para sa names)
        $sql = "SELECT ca.*, u.full_name as teacher_name, sub.subject_description, sub.subject_code, s.section_name 
                FROM class_assignments ca
                JOIN users u ON ca.teacher_id = u.id
                JOIN subjects sub ON ca.subject_id = sub.id
                JOIN sections s ON ca.section_id = s.id";
        $stmt = $pdo->query($sql);
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Kunin ang data para sa dropdowns
        $teachers = $pdo->query("SELECT id, full_name FROM users WHERE role = 'teacher' AND status = 'Active'")->fetchAll(PDO::FETCH_ASSOC);
        $subjects = $pdo->query("SELECT id, subject_code, subject_description FROM subjects")->fetchAll(PDO::FETCH_ASSOC);
        $sections = $pdo->query("SELECT id, section_name, grade_level FROM sections WHERE status = 'Active'")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "assignments" => $assignments,
            "dropdowns" => [
                "teachers" => $teachers,
                "subjects" => $subjects,
                "sections" => $sections
            ]
        ]);
    } else if ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        $sql = "INSERT INTO class_assignments (teacher_id, subject_id, section_id, grade_level, room, schedule, school_year) 
                VALUES (:tid, :sid, :secid, :level, :room, :sched, :sy)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tid' => $data->teacher_id,
            ':sid' => $data->subject_id,
            ':secid' => $data->section_id,
            ':level' => $data->grade_level,
            ':room' => $data->room,
            ':sched' => $data->schedule,
            ':sy' => $data->school_year
        ]);
        echo json_encode(["status" => "success"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>