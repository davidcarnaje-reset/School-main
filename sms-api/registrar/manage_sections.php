<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // FIX: Added OPTIONS
header("Access-Control-Allow-Headers: Content-Type, Authorization"); // FIX: Required for Axios
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// FIX 1: Handle CORS Preflight request from React
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($method === 'GET') {
        // Fetch Sections
        $sql = "SELECT s.*, ap.program_code, ap.program_description, ap.major 
                FROM sections s 
                LEFT JOIN academic_programs ap ON s.program_id = ap.id 
                ORDER BY s.id DESC"; // ORDER BY id DESC para nasa taas ang bagong gawa
        $stmt = $pdo->query($sql);
        $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch Programs
        $stmt_ap = $pdo->query("SELECT id, department, program_code, program_description, major FROM academic_programs WHERE status = 'Active'");
        $programs = $stmt_ap->fetchAll(PDO::FETCH_ASSOC);

        // Sinigurado na may 'status' => 'success' para madaling i-check sa React
        echo json_encode([
            "status" => "success",
            "sections" => $sections ?: [],
            "programs" => $programs ?: []
        ]);

    } else if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));

        // FIX 2: Strict Database Rule para sa K-10
        // Kung K-10, automatic NULL. Kung SHS/College, kunin ang ID kung meron.
        $program_id = null;
        if (isset($data->department) && $data->department !== 'K-10' && !empty($data->program_id)) {
            $program_id = intval($data->program_id);
        }

        $sql = "INSERT INTO sections (section_name, grade_level, department, program_id, max_capacity) 
                VALUES (:name, :level, :dept, :pid, :cap)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => trim($data->section_name),
            ':level' => trim($data->grade_level),
            ':dept' => trim($data->department),
            ':pid' => $program_id,
            ':cap' => intval($data->max_capacity)
        ]);

        echo json_encode(["status" => "success", "message" => "Section created!"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
}
?>