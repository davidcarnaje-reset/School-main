<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();

require '../config.php';

$program_id = $_GET['program_id'] ?? '';
$grade_level = $_GET['grade_level'] ?? '';

try {
    // 🛑 ARCHITECT FIX: Pinalitan natin ang ca.room ng r.room_name 
    // at nagdagdag tayo ng JOIN papunta sa rooms table!
    $sql = "SELECT 
                ca.id as class_assignment_id, 
                ca.schedule, 
                r.room_name as room,
                s.subject_code, 
                s.subject_description, 
                s.units, 
                u.first_name, 
                u.last_name, 
                sec.section_name,
                sec.grade_level
            FROM class_assignments ca
            JOIN subjects s ON ca.subject_id = s.id
            LEFT JOIN users u ON ca.teacher_id = u.id
            LEFT JOIN sections sec ON ca.section_id = sec.id
            LEFT JOIN rooms r ON ca.room_id = r.id
            WHERE ca.is_active = 1";

    $params = [];

    // Smart Filter Logic
    if (stripos($grade_level, 'College') !== false || stripos($grade_level, 'Year') !== false) {
        $sql .= " AND s.level_category = 'College'";
        if (!empty($program_id) && $program_id !== 'null' && $program_id !== 'undefined') {
            $sql .= " AND (s.program_id = :program_id OR s.program_id IS NULL)";
            $params[':program_id'] = $program_id;
        }
    } else if (in_array($grade_level, ['Grade 11', 'Grade 12'])) {
        $sql .= " AND s.level_category = 'SHS'";
        if (!empty($program_id) && $program_id !== 'null' && $program_id !== 'undefined') {
            $sql .= " AND (s.program_id = :program_id OR s.program_id IS NULL)";
            $params[':program_id'] = $program_id;
        }
    } else {
        $sql .= " AND s.level_category = 'K-10'";
    }

    $sql .= " ORDER BY sec.grade_level ASC, s.subject_code ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "classes" => $classes]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>