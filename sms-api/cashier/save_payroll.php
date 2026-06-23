<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true); // Gawing true para maging associative array

if (!$data || !isset($data['period_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid or missing data."]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. I-update ang Drafts (payroll_entries)
    $sql = "INSERT INTO payroll_entries 
            (period_id, employee_id, days_worked, overtime_hours, late_minutes, net_pay, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            days_worked = VALUES(days_worked),
            overtime_hours = VALUES(overtime_hours),
            late_minutes = VALUES(late_minutes),
            net_pay = VALUES(net_pay),
            status = VALUES(status)";
            
    $stmt = $pdo->prepare($sql);
    foreach ($data['entries'] as $entry) {
        $stmt->execute([
            $data['period_id'], 
            $entry['employee_id'], 
            $entry['days_worked'], 
            $entry['overtime_hours'], 
            $entry['late_minutes'], 
            $entry['net_pay'],
            $data['final_status'] == 'Paid' ? 'Paid' : 'Pending'
        ]);
    }

    // 2. Kung FINALIZE na (Paid), ilipat sa Archive at i-close ang Period
    if ($data['final_status'] === 'Paid') {
        $sqlArchive = "INSERT INTO payroll_entries_completed 
                       (period_id, employee_id, full_name, position, days_worked, ot_hours, late_minutes, net_pay)
                       SELECT pe.period_id, pe.employee_id, CONCAT(e.first_name, ' ', e.last_name), e.position, 
                              pe.days_worked, pe.overtime_hours, pe.late_minutes, pe.net_pay
                       FROM payroll_entries pe
                       JOIN employees e ON pe.employee_id = e.id
                       WHERE pe.period_id = ?";
        $pdo->prepare($sqlArchive)->execute([$data['period_id']]);

        $pdo->prepare("UPDATE payroll_periods SET status = 'Completed' WHERE id = ?")->execute([$data['period_id']]);
    }

    $pdo->commit();
    echo json_encode(["status" => "success", "message" => "Payroll updated successfully!"]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}