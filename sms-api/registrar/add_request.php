<?php
/**
 * REGISTRAR: ADD STUDENT REQUEST ENGINE
 * Logic: Create Request -> Generate Bill -> Create Billing Item
 * Status: SECURE / PDO / TRANSACTIONAL
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php'; // Gagamit ng $pdo variable

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->student_id) && !empty($data->fee_id)) {
    try {
        // 1. Simulan ang PDO Transaction para iwas "Ghost Records"
        $pdo->beginTransaction();

        // 2. Kuhanin ang presyo at pangalan ng dokumento mula sa catalog (Prepared Statement)
        $stmt_fee = $pdo->prepare("SELECT item_name, amount FROM fees_catalog WHERE id = ? LIMIT 1");
        $stmt_fee->execute([$data->fee_id]);
        $fee = $stmt_fee->fetch();

        if (!$fee) {
            throw new Exception("Ang napiling dokumento ay wala sa catalog.");
        }

        $item_name = $fee['item_name'];
        $amount = (float) $fee['amount'];
        $sy = "2026-2027"; // Default Academic Year

        // 3. INSERT sa SERVICE_REQUESTS (Registrar Side)
        $sql_req = "INSERT INTO service_requests (student_id, fee_id, status, created_at) 
                    VALUES (:sid, :fid, 'Pending Payment', NOW())";
        $stmt_req = $pdo->prepare($sql_req);
        $stmt_req->execute([
            'sid' => $data->student_id,
            'fid' => $data->fee_id
        ]);

        // 4. INSERT sa STUDENT_BILLING (Cashier Main Record)
        // Dito papasok ang "Accountability" ng utang ng estudyante
        $sql_bill = "INSERT INTO student_billing (student_id, school_year, total_amount, balance, payment_status) 
                     VALUES (:sid, :sy, :total, :bal, 'Unpaid')";
        $stmt_bill = $pdo->prepare($sql_bill);
        $stmt_bill->execute([
            'sid' => $data->student_id,
            'sy' => $sy,
            'total' => $amount,
            'bal' => $amount
        ]);

        // Kunin ang ID ng bagong gawang Bill
        $billing_id = $pdo->lastInsertId();

        // 5. INSERT sa STUDENT_BILLING_ITEMS (Receipt Breakdown)
        // Para malaman ni Cashier kung ano ang partikular na binabayaran
        $sql_item = "INSERT INTO student_billing_items (billing_id, item_name, amount) 
                     VALUES (:bid, :iname, :amt)";
        $stmt_item = $pdo->prepare($sql_item);
        $stmt_item->execute([
            'bid' => $billing_id,
            'iname' => "Request: " . $item_name,
            'amt' => $amount
        ]);

        // 6. COMMIT ALL CHANGES
        // Kung umabot dito nang walang error, i-save na lahat sa DB
        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Request logged successfully! Bill generated for Cashier.",
            "student_id" => $data->student_id,
            "billing_id" => $billing_id
        ]);

    } catch (Exception $e) {
        // Kapag may pumalya sa kahit anong step, I-ROLLBACK LAHAT
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Process Error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields (Student ID or Fee ID)."
    ]);
}
?>