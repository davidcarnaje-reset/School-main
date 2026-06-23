<?php
// cashier/process_scholarship_apply.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
require '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['student_scholarship_id'])) {
    try {
        $pdo->beginTransaction();

        // 1. Update status to 'Applied'
        $stmt = $pdo->prepare("UPDATE student_scholarships SET status = 'Applied', applied_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $data['student_scholarship_id']]);

        // 2. Dito mo pwede ilagay ang logic para awtomatikong bawasan 
        // ang 'balance' sa billing table kung gusto mo ng real-time update.

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Scholarship applied to student account."]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}