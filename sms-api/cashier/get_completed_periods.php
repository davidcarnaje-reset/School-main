<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../config.php';

try {
    $stmt = $pdo->query("SELECT * FROM payroll_periods WHERE status = 'Completed' ORDER BY end_date DESC");
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Siguraduhin na array ang lalabas kahit empty
    echo json_encode($result ? $result : []); 
} catch (Exception $e) {
    // Huwag mag-return ng object lang, i-return ay empty array para hindi mag-crash ang React
    echo json_encode([]); 
}
?>