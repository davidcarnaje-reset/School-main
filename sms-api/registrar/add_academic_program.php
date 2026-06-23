<?php
// registrar/add_academic_program.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: PDO Connection
require '../config.php';

// Handle preflight para sa Axios
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->department) && !empty($data->program_code) && !empty($data->program_description)) {

    try {
        // 1. ARCHITECT UPDATE: Named Placeholders (:dept, :code) para mas madaling basahin
        $sql = "INSERT INTO academic_programs (department, program_code, program_description, major, status) 
                VALUES (:dept, :code, :desc, :major, :status)";

        $stmt = $pdo->prepare($sql);

        // 2. Data Cleaning (Logic mo ito, Sir! Clean and Safe)
        $department = htmlspecialchars(strip_tags($data->department));
        $program_code = strtoupper(htmlspecialchars(strip_tags($data->program_code))); // Force Upper Case para sa Code
        $program_description = htmlspecialchars(strip_tags($data->program_description));
        $major = !empty($data->major) ? htmlspecialchars(strip_tags($data->major)) : NULL;
        $status = !empty($data->status) ? htmlspecialchars(strip_tags($data->status)) : 'Active';

        // 3. Execution
        $stmt->execute([
            'dept' => $department,
            'code' => $program_code,
            'desc' => $program_description,
            'major' => $major,
            'status' => $status
        ]);

        echo json_encode(["success" => true, "message" => "Program successfully added."]);

    } catch (PDOException $e) {
        // Catch natin kung may duplicate Program Code (Unique Constraint)
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
}
?>