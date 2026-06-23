<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

try {
    $stmt = $pdo->query("SELECT * FROM payroll_periods ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}