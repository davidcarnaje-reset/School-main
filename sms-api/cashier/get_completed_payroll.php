<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

$period_id = $_GET['period_id'] ?? null;

try {
    $stmt = $pdo->prepare("SELECT * FROM payroll_entries_completed WHERE period_id = ?");
    $stmt->execute([$period_id]);
    echo json_encode(["status" => "success", "entries" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}