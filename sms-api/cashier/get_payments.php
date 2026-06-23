<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

try {
    // Force lowercase para mag-match sa React code
    $pdo->setAttribute(PDO::ATTR_CASE, PDO::CASE_LOWER);

    $sql = "SELECT 
            p.payment_id as id, 
            p.student_id as student, 
            CONCAT(s.first_name, ' ', s.last_name) as name, 
            p.amount_paid as amount, 
            p.fee_category as type, 
            p.payment_method as method, 
            p.transaction_date as date 
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.student_id
        ORDER BY p.transaction_date DESC 
        LIMIT 20"; // Lakihan natin ang limit para sa modal, pero sa dashboard .slice(0,5) lang tayo.

    $stmt = $pdo->query($sql);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Siguraduhin na ARRAY ang babalik kahit walang data
    if (!$payments) {
        echo json_encode([]);
    } else {
        // I-format ang date
        $formatted = array_map(function ($row) {
            $row['date'] = date('h:i A, l', strtotime($row['date']));
            return $row;
        }, $payments);
        
        echo json_encode($formatted);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([]); // Ibalik ang empty array imbes na error string para hindi mag-white screen
}