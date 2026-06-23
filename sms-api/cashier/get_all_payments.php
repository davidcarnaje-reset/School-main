<?php
// cashier/get_all_payments.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

try {
    // ARCHITECT UPDATE: Kinuha natin ang Full Name ng student via JOIN
    // Pinagsama rin natin ang first_name at last_name para sa React Table
    $sql = "SELECT 
                p.payment_id as id, 
                p.student_id as student, 
                CONCAT(s.first_name, ' ', s.last_name) as name, 
                p.amount_paid as amount, 
                p.fee_category as type, 
                p.payment_method as method,
                DATE_FORMAT(p.transaction_date, '%b %d, %Y - %h:%i %p') as date 
            FROM payments p
            LEFT JOIN students s ON p.student_id = s.student_id
            ORDER BY p.transaction_date DESC"; // <--- Lahat ng records kukunin natin

    $stmt = $pdo->query($sql);
    $allPayments = $stmt->fetchAll();

    // Siguraduhing mag-return ng empty array [] imbes na null kung walang records
    echo json_encode($allPayments ?: []);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>