<?php
// apply_scholarship_to_billing.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    $app_id = $data['application_id'];
    $student_id = $data['student_id'];
    $val = (float)$data['discount_value']; 
    $type = $data['discount_type']; 
    $sch_name = $data['scholarship_name'] ?? 'Scholarship Grant';

    try {
        $pdo->beginTransaction();

        // 1. Kunin ang Old Balance bago galawin
        $stmt = $pdo->prepare("SELECT id, balance FROM student_billing WHERE student_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$student_id]);
        $billing = $stmt->fetch(PDO::FETCH_ASSOC);
        $billing_id = $billing['id'];
        $old_balance = (float)$billing['balance'];

        $stmt_items = $pdo->prepare("SELECT id, item_name, amount, paid_amount FROM student_billing_items 
                                    WHERE billing_id = ? AND (amount - paid_amount) > 0 
                                    ORDER BY CASE WHEN item_name LIKE '%Tuition%' THEN 0 ELSE 1 END");
        $stmt_items->execute([$billing_id]);
        $items = $stmt_items->fetchAll(PDO::FETCH_ASSOC);

        $applied_details = [];
        $total_grant_used = 0;

        if ($type === 'Percentage') {
            foreach ($items as $item) {
                if (stripos($item['item_name'], 'Tuition') !== false) {
                    $current_tuition_balance = (float)$item['amount'] - (float)$item['paid_amount'];
                    $computed_discount = $current_tuition_balance * ($val / 100);
                    
                    $upd = $pdo->prepare("UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ?");
                    $upd->execute([$computed_discount, $item['id']]);
                    
                    $applied_details[] = [
                        "item_name" => $item['item_name'], 
                        "discount" => $computed_discount
                    ];
                    $total_grant_used = $computed_discount;

                    $hist = $pdo->prepare("INSERT INTO payments (student_id, amount_paid, payment_method, fee_category, transaction_date) VALUES (?, ?, 'Scholarship', ?, NOW())");
                    $hist->execute([$student_id, $computed_discount, $item['item_name']]);
                    break; 
                }
            }
        } else {
            $remaining_grant = $val;
            foreach ($items as $item) {
                if ($remaining_grant <= 0) break;
                $item_balance = (float)$item['amount'] - (float)$item['paid_amount'];
                $apply = min($remaining_grant, $item_balance);

                $upd = $pdo->prepare("UPDATE student_billing_items SET paid_amount = paid_amount + ? WHERE id = ?");
                $upd->execute([$apply, $item['id']]);

                $applied_details[] = ["item_name" => $item['item_name'], "discount" => $apply];
                $total_grant_used += $apply;
                
                $remaining_grant -= $apply;
            }
        }

        // 2. MASTER SYNC & GET NEW BALANCE
        $stmt_sync = $pdo->prepare("SELECT SUM(amount) as total_bill, SUM(paid_amount) as total_paid FROM student_billing_items WHERE billing_id = ?");
        $stmt_sync->execute([$billing_id]);
        $totals = $stmt_sync->fetch();
        $new_balance = (float)$totals['total_bill'] - (float)$totals['total_paid'];
        
        $upd_summary = $pdo->prepare("UPDATE student_billing SET paid_amount = ?, balance = ?, payment_status = ? WHERE id = ?");
        $upd_summary->execute([(float)$totals['total_paid'], $new_balance, ($new_balance <= 0 ? 'Fully Paid' : 'Partially Paid'), $billing_id]);

        // 3. Status Update (Fixed variable name)
        $pdo->prepare("UPDATE scholarship_applications SET status = 'Applied' WHERE id = ?")->execute([$app_id]);

        $pdo->commit();

        // 4. IBALIK LAHAT NG KAILANGAN NG REACT PARA WALANG UNDEFINED
        echo json_encode([
            "status" => "success", 
            "old_balance" => $old_balance,
            "new_balance" => $new_balance,
            "total_deduction" => $total_grant_used,
            "applied_items" => $applied_details
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}