<?php
// cashier/process_billing_payment.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

require '../config.php';

// Kunin ang input mula sa React frontend
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['student_id']) && isset($data['allocations'])) {
    $sid = $data['student_id'];
    $allocations = $data['allocations']; // Format: [item_id => amount_to_pay]

    try {
        $pdo->beginTransaction();

        // 1. Hanapin muna ang billing_id ng student (yung pinaka-latest)
        $stmt_bill = $pdo->prepare("SELECT id FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1");
        $stmt_bill->execute([$sid]);
        $billing = $stmt_bill->fetch();

        if (!$billing) {
            throw new Exception("Walang nahanap na billing record para sa student na ito.");
        }
        $billing_id = $billing['id'];

        $actual_total_distributed = 0;
        $tuition_updated = false;

        // 2. I-process ang bawat allocation (Dito ina-update ang tig-5k halimbawa)
        foreach ($allocations as $item_id => $pay_amount) {
            $pay_amount = (float)$pay_amount;
            if ($pay_amount <= 0) continue;

            // UPDATE: Dagdagan ang paid_amount sa breakdown table
            $stmt_upd_item = $pdo->prepare("UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ? AND billing_id = ?");
            $stmt_upd_item->execute([$pay_amount, $item_id, $billing_id]);

            // KUNIN ANG ITEM NAME PARA SA HISTORY RECORD
            $stmt_info = $pdo->prepare("SELECT item_name FROM student_billing_items WHERE id = ?");
            $stmt_info->execute([$item_id]);
            $item_name = $stmt_info->fetchColumn();

            if (stripos($item_name, 'Tuition') !== false) {
                $tuition_updated = true;
            }

            // INSERT SA PAYMENTS TABLE (Recent Transactions list sa UI)
            $stmt_hist = $pdo->prepare("INSERT INTO payments (student_id, amount_paid, payment_method, fee_category, transaction_date) 
                                       VALUES (?, ?, 'Cash', ?, NOW())");
            $stmt_hist->execute([$sid, $pay_amount, $item_name]);

            $actual_total_distributed += $pay_amount;
        }

        // 3. THE MASTER SYNC LOGIC: Re-calculate summary from items
        // Kinukuha natin ang SUM ng lahat ng items para sigurado tayong accurate ang totals
        $stmt_sync = $pdo->prepare("SELECT SUM(amount) as total_bill, SUM(paid_amount) as total_paid FROM student_billing_items WHERE billing_id = ?");
        $stmt_sync->execute([$billing_id]);
        $totals = $stmt_sync->fetch();

        $new_total_amount = (float)$totals['total_bill'];
        $new_paid_amount = (float)$totals['total_paid'];
        $new_balance = $new_total_amount - $new_paid_amount;
        
        // Status logic
        $new_status = ($new_balance <= 0) ? 'Fully Paid' : 'Partially Paid';

        // 4. I-UPDATE NA ANG SUMMARY TABLE (student_billing)
        // Dito ina-overwrite natin yung summary base sa totoong sum ng items
        $upd_summary = $pdo->prepare("UPDATE student_billing SET total_amount = ?, paid_amount = ?, balance = ?, payment_status = ? WHERE id = ?");
        $upd_summary->execute([$new_total_amount, $new_paid_amount, $new_balance, $new_status, $billing_id]);

        // 5. UPDATE ENROLLMENT STATUS BASE SA CHECKBOX
        if (isset($data['mark_as_enrolled']) && $data['mark_as_enrolled'] === true) {
            // Siguraduhin na 'Assessed' ang status sa database mo
            $upd_enroll = $pdo->prepare("UPDATE enrollments SET status = 'Enrolled' WHERE student_id = ? AND status = 'Assessed'");
            $upd_enroll->execute([$sid]);
        }

        $pdo->commit();
        echo json_encode([
            "status" => "success", 
            "message" => "Payment processed and accounts synchronized!",
            "new_balance" => $new_balance
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data sent to server."]);
}
?>