<?php
// /sms-api/admin/get_college_settings.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../config.php';

try {
    $stmt = $pdo->prepare("
        SELECT 
            college_grading_scale,
            college_prelim_weight,
            college_midterm_weight,
            college_finals_weight
        FROM school_settings 
        WHERE id = 1
    ");
    $stmt->execute();
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "data" => $settings ?: [
            "college_grading_scale" => "1_highest",
            "college_prelim_weight" => 30.00,
            "college_midterm_weight" => 30.00,
            "college_finals_weight" => 40.00
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>