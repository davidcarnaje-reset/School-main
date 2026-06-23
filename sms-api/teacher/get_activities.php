<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
require_once '../config.php';

// --- ROBUST TOKEN GATEKEEPER ---
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? apache_request_headers()['Authorization'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Token missing."]);
    exit();
}

$classId  = isset($_GET['class_id'])  ? intval($_GET['class_id'])  : null;
$category = isset($_GET['category'])  ? $_GET['category']          : null;
$quarter  = isset($_GET['quarter'])   ? intval($_GET['quarter'])   : null;
$all      = isset($_GET['all'])       ? intval($_GET['all'])       : 0;

if (!$classId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Class ID required."]);
    exit();
}

try {
    // Simulan ang query
    $sql    = "SELECT * FROM activities WHERE class_id = :class_id";
    $params = [':class_id' => $classId];

    // 1. Filter by category (kung may pinasa)
    if ($category) {
        $sql .= " AND category = :category";
        $params[':category'] = $category;
    }

    // 2. Filter by quarter logic
    if ($quarter) {
        // Kung may specific quarter na hinahanap (Q1, Q2, Q3, Q4)
        $sql .= " AND quarter = :quarter";
        $params[':quarter'] = $quarter;
    } else {
        // Kung walang quarter parameter:
        // 'all=1' -> kukunin lahat ng activities anuman ang quarter
        // 'all=0' -> default behaviour, kukunin lang ang activities na walang quarter (College level)
        if ($all !== 1) {
            $sql .= " AND quarter IS NULL";
        }
    }

    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "data" => $activities,
        "count" => count($activities)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>