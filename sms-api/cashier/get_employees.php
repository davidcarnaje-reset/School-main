<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit;

require_once '../config.php';

try {
    $stmt = $pdo->query("SELECT * FROM employees ORDER BY id DESC");
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($employees);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>