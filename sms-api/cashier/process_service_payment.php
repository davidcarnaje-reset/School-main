<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['request_ids'])) {
    try {
        // SIMULAN ANG TRANSACTION (Para siguradong sabay silang mag-u-update)
        $pdo->beginTransaction();

        foreach ($data['request_ids'] as $id) {
            // 1. Kunin muna ang detalye ng request (Sino ang student at magkano?)
            $stmt = $pdo->prepare("
                SELECT sr.student_id, fc.amount, fc.item_name 
                FROM service_requests sr
                JOIN fees_catalog fc ON sr.fee_id = fc.id
                WHERE sr.id = :id
            ");
            $stmt->execute(['id' => $id]);
            $req = $stmt->fetch();

            if ($req) {
                // 2. I-update ang Service Request status to 'Paid'
                $update = $pdo->prepare("UPDATE service_requests SET status = 'Paid' WHERE id = :id");
                $update->execute(['id' => $id]);

                // 3. I-RECORD SA PAYMENTS TABLE (Para pumasok sa Reports!)
                $payment_sql = "INSERT INTO payments (student_id, amount_paid, fee_category, payment_method, transaction_date) 
                                VALUES (:sid, :amt, :cat, 'Cash', NOW())";
                $pay_stmt = $pdo->prepare($payment_sql);
                $pay_stmt->execute([
                    'sid' => $req['student_id'],
                    'amt' => $req['amount'],
                    'cat' => 'Service: ' . $req['item_name']
                ]);
            }
        }

        // KUNG LAHAT OKAY, I-COMMIT NA SA DATABASE
        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Payment successfully processed and recorded!"]);

    } catch (Exception $e) {
        // KUNG MAY ERROR, I-CANCEL LAHAT (Rollback) para iwas discrepancy
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No items selected."]);
}
?>