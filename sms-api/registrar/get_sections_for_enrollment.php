<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit();

require '../config.php';

$grade_level = $_GET['grade_level'] ?? '';
$program_id = $_GET['program_id'] ?? '';

if (empty($grade_level)) {
    echo json_encode(["success" => false, "message" => "Grade level is required."]);
    exit();
}

try {
    $params = [];

    if (strtolower($grade_level) === 'college') {
        $sql = "SELECT id, section_name, max_capacity as capacity, grade_level 
                FROM sections 
                WHERE status = 'Active' 
                AND department = 'College'";

        // 🛑 ARCHITECT FIX: Added safety check. Filter lang if may laman talaga ang program_id
        if (!empty($program_id) && $program_id !== 'null' && $program_id !== 'undefined') {
            $sql .= " AND program_id = :program_id";
            $params[':program_id'] = $program_id;
        }

        $sql .= " ORDER BY grade_level ASC, section_name ASC";
    } else {
        // PARA SA K-12 at SHS
        $sql = "SELECT id, section_name, max_capacity as capacity, grade_level 
                FROM sections 
                WHERE status = 'Active' 
                AND grade_level = :grade_level";

        $params[':grade_level'] = $grade_level;

        if (!empty($program_id) && $program_id !== 'null' && $program_id !== 'undefined') {
            $sql .= " AND program_id = :program_id";
            $params[':program_id'] = $program_id;
        }

        $sql .= " ORDER BY section_name ASC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "sections" => $sections
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>