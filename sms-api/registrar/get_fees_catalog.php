<?php
// registrar/get_fees_catalog.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder ito, kailangan ng ../
require '../config.php';

try {
    // Kukunin natin ang fees at i-so-sort (Tuition muna para maganda sa Smart Filter mo)
    $sql = "SELECT id, item_name, amount, category FROM fees_catalog ORDER BY category DESC, item_name ASC";
    $stmt = $pdo->query($sql);
    $fees = $stmt->fetchAll();

    // I-format natin ang amount bago i-send sa React
    $formattedFees = array_map(function ($fee) {
        $fee['amount'] = number_format((float) $fee['amount'], 2, '.', '');
        return $fee;
    }, $fees);

    echo json_encode($formattedFees ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>