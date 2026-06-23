<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';

$search = $_GET['id'] ?? '';

if ($search) {
    try {
        // 1. Kunin ang pinaka-latest na billing summary ng student
        $sql_billing = "SELECT b.id, b.student_id, b.total_amount, b.paid_amount, b.balance, 
                               b.payment_status, s.first_name, s.last_name
                        FROM student_billing b
                        JOIN students s ON b.student_id = s.student_id
                        WHERE b.student_id = :id ORDER BY b.id DESC LIMIT 1";

        $stmt_billing = $pdo->prepare($sql_billing);
        $stmt_billing->execute(['id' => $search]);
        $billing = $stmt_billing->fetch(PDO::FETCH_ASSOC);

        if ($billing) {
            // 2. Kunin ang lahat ng items para sa billing_id na ito
            // Hindi muna tayo mag-filter sa SQL para makita natin lahat sa React
            $sql_items = "SELECT id, item_name, amount, paid_amount 
                          FROM student_billing_items 
                          WHERE billing_id = :bid";
            $stmt_items = $pdo->prepare($sql_items);
            $stmt_items->execute(['bid' => $billing['id']]);
            $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

            // 3. History/Recent Payments
            $sql_history = "SELECT transaction_date, amount_paid, payment_method, fee_category 
                            FROM payments WHERE student_id = :sid 
                            ORDER BY transaction_date DESC LIMIT 5";
            $stmt_history = $pdo->prepare($sql_history);
            $stmt_history->execute(['sid' => $search]);
            $history = $stmt_history->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "summary" => $billing,
                "items" => $items ?: [],
                "recent_payments" => $history ?: [] // Siguraduhing 'recent_payments' ang key
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "No billing record found for this ID."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>