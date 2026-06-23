<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit;

require_once '../config.php';
$period_id = $_GET['period_id'] ?? null;

if (!$period_id) {
    echo json_encode(["status" => "error", "message" => "No Period ID"]);
    exit;
}

try {
    // 1. Kunin ang mga active employees
    $empStmt = $pdo->query("SELECT id FROM employees WHERE status = 'Active'");
    $activeEmployees = $empStmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. I-insert ang mga wala pa sa payroll_entries para sa period na ito
    $insStmt = $pdo->prepare("INSERT IGNORE INTO payroll_entries (period_id, employee_id) VALUES (?, ?)");
    foreach ($activeEmployees as $empId) {
        $insStmt->execute([$period_id, $empId]);
    }

    // 3. I-return ang records kasama ang employee info (JOIN)
    $sql = "SELECT pe.*, e.first_name, e.last_name, e.position, e.basic_salary, e.department 
            FROM payroll_entries pe 
            JOIN employees e ON pe.employee_id = e.id 
            WHERE pe.period_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$period_id]);
    
    echo json_encode(["status" => "success", "entries" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}