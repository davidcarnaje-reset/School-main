<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// I-connect sa config mo
include_once '../config.php';

try {
    $query = "SELECT * FROM landing_promotions WHERE is_active = 1 ORDER BY created_at DESC";

    // 👇 ARCHITECT FIX: Gamit na natin ang $pdo
    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $promotions = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        array_push($promotions, $row);
    }

    echo json_encode([
        "success" => true,
        "promotions" => $promotions
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>