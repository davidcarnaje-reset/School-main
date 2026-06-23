<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Siguraduhin na tama ang path papunta sa config.php
include '../config.php'; 

// Check kung $pdo variable ang gamit sa config.php
if (!isset($pdo)) {
    echo json_encode(["error" => "Database connection variable (pdo) not found"]);
    exit;
}

try {
    // Kunin ang mga active scholarships mula sa catalog
    // Tiyakin na 'scholarships_catalog' ang tamang table name mo
    $sql = "SELECT id, name, discount_type, discount_value FROM scholarships_catalog WHERE status = 'Active'";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $scholarships = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // I-send ang data sa React frontend
    echo json_encode($scholarships);

} catch (PDOException $e) {
    echo json_encode(["error" => "Query failed: " . $e->getMessage()]);
}
?>