<?php
// 1. CORS HEADERS (Dapat ito ang pinakauna bago ang require_once)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// 2. HANDLE OPTIONS REQUEST (Preflight)
// Kapag 'OPTIONS' ang request, exit agad tayo para mag-success ang browser check
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// 3. GET JSON DATA
$data = json_decode(file_get_contents("php://input"));

if (!$data || !$data->period_name || !$data->start_date || !$data->end_date) {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO payroll_periods (period_name, start_date, end_date, status) VALUES (?, ?, ?, 'Pending')");
    $stmt->execute([
        $data->period_name, 
        $data->start_date, 
        $data->end_date
    ]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>