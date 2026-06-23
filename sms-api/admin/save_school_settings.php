<?php
// /sms-api/admin/save_college_settings.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';

$data = json_decode(file_get_contents('php://input'), true);

$scale = $data['college_grading_scale'] ?? '1_highest';
$prelim = floatval($data['college_prelim_weight'] ?? 30);
$midterm = floatval($data['college_midterm_weight'] ?? 30);
$finals = floatval($data['college_finals_weight'] ?? 40);

// Validate weights sum to 100
if (abs($prelim + $midterm + $finals - 100) > 0.01) {
    echo json_encode(["status" => "error", "message" => "Weights must sum to 100%"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        UPDATE school_settings SET
            college_grading_scale = ?,
            college_prelim_weight = ?,
            college_midterm_weight = ?,
            college_finals_weight = ?
        WHERE id = 1
    ");
    $stmt->execute([$scale, $prelim, $midterm, $finals]);
    
    echo json_encode(["status" => "success", "message" => "College grading settings saved"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>