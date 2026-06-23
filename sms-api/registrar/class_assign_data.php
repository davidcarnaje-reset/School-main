<?php
/**
 * REGISTRAR: FETCH DATA FOR CLASS ASSIGNMENTS
 * Location: sms-api/registrar/class_assign_data.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

require_once '../config.php';

try {
    // 1. Kunin ang lahat ng TEACHERS
    $stmt_teachers = $pdo->prepare("SELECT id, full_name FROM users WHERE role = 'teacher' AND status = 'Active' ORDER BY full_name ASC");
    $stmt_teachers->execute();
    $teachers = $stmt_teachers->fetchAll(PDO::FETCH_ASSOC);

    // 2. Kunin ang lahat ng SUBJECTS 
    $stmt_subjects = $pdo->prepare("SELECT id, subject_code, subject_description, grade_level_applicable, program_id, level_category FROM subjects ORDER BY subject_code ASC");
    $stmt_subjects->execute();
    $subjects = $stmt_subjects->fetchAll(PDO::FETCH_ASSOC);

    // 3. Kunin ang lahat ng SECTIONS
    $stmt_sections = $pdo->prepare("SELECT id, section_name, grade_level, department, program_id FROM sections WHERE status = 'Active' ORDER BY grade_level ASC, section_name ASC");
    $stmt_sections->execute();
    $sections = $stmt_sections->fetchAll(PDO::FETCH_ASSOC);

    // 4. ARCHITECT FIX: Kunin ang lahat ng ROOMS para sa dropdown
    $stmt_rooms = $pdo->prepare("SELECT id, room_name, room_type, capacity FROM rooms WHERE status = 'Active' ORDER BY room_name ASC");
    $stmt_rooms->execute();
    $rooms = $stmt_rooms->fetchAll(PDO::FETCH_ASSOC);

    // 5. Kunin ang EXISTING CLASS ASSIGNMENTS 
    // Nag-JOIN tayo sa `rooms` table para makuha ang pangalan ng kwarto.
    // In-alias natin ang r.room_name as 'room' para hindi masira ang frontend table mo.
    $sql_assignments = "SELECT 
                            ca.id, 
                            ca.teacher_id, 
                            ca.subject_id, 
                            ca.section_id, 
                            ca.room_id, 
                            ca.schedule, 
                            ca.school_year,
                            u.full_name as teacher_name, 
                            sub.subject_description as subject_name,
                            sub.subject_code,
                            sec.section_name,
                            sec.grade_level,
                            r.room_name as room 
                        FROM class_assignments ca
                        LEFT JOIN users u ON ca.teacher_id = u.id
                        LEFT JOIN subjects sub ON ca.subject_id = sub.id
                        LEFT JOIN sections sec ON ca.section_id = sec.id
                        LEFT JOIN rooms r ON ca.room_id = r.id
                        ORDER BY ca.id DESC";

    $stmt_assign = $pdo->prepare($sql_assignments);
    $stmt_assign->execute();
    $assignments = $stmt_assign->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "teachers" => $teachers ?: [],
        "subjects" => $subjects ?: [],
        "sections" => $sections ?: [],
        "rooms" => $rooms ?: [], // BAGO: Ipapasa na natin ang rooms sa React
        "assignments" => $assignments ?: []
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>