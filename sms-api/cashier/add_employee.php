<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit;

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data->employee_id || !$data->first_name || !$data->last_name) {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
    exit;
}

try {
    $sql = "INSERT INTO employees (employee_id, first_name, last_name, position, department, basic_salary, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data->employee_id,
        $data->first_name,
        $data->last_name,
        $data->position,
        $data->department, // Added
        $data->basic_salary,
        $data->status
    ]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>