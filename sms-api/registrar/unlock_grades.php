<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';
$data = json_decode(file_get_contents("php://input"));

$class_id = $data->class_id ?? null;
$quarter = isset($data->quarter) && $data->quarter !== "" ? $data->quarter : null;

if (!$class_id) {
    echo json_encode(["success" => false, "message" => "Class ID is required."]);
    exit;
}

try {
    if ($quarter === null) {
        $stmt = $pdo->prepare("UPDATE class_grade_locks SET is_locked = 0 WHERE class_id = :cid AND quarter IS NULL");
        $stmt->execute(['cid' => $class_id]);
    } else {
        $stmt = $pdo->prepare("UPDATE class_grade_locks SET is_locked = 0 WHERE class_id = :cid AND quarter = :qtr");
        $stmt->execute(['cid' => $class_id, 'qtr' => $quarter]);
    }

    if (function_exists('logAuditTrail')) {
        logAuditTrail($pdo, "UNLOCK_GRADES", "Unlocked grades for Class ID: $class_id");
    }

    echo json_encode(["success" => true, "message" => "Grades unlocked! The teacher can now edit the grades for this subject."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>