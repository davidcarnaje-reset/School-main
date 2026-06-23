<?php
/**
 * STUDENT FOLDER: ACCOUNTING & MASTER FETCH
 * Location: sms-api/student/get_students.php
 * Status: SECURE / PDO / FULL INTEGRATION WITH SECTION NAME
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

// 1. PATH ADJUSTMENT: Aakyat ng isa (../) dahil nasa 'student' folder tayo
require_once '../config.php';

try {
    /**
     * SQL ARCHITECTURE:
     * Nag-dagdag tayo ng LEFT JOIN sa 'sections' table para makuha ang 'section_name'.
     * Ito ang dahilan kung bakit "TBA" ang lumalabas dati—dahil ID lang ang meron tayo.
     */
    $sql = "SELECT 
                s.*, 
                e.grade_level, 
                e.school_year, 
                e.payment_plan, 
                e.enrollment_type,
                e.status as enrollment_status,
                e.section_id,     -- Numeric ID
                e.program_id,     -- Numeric ID
                -- KUKUNIN NATIN ANG TOTOONG PANGALAN NG SECTION DITO --
                sec.section_name as actual_section_name, 
                -- ACADEMIC PROGRAM DATA --
                ap.program_code as ap_code,
                ap.program_description as ap_desc,
                -- BILLING DATA --
                b.id as billing_id, 
                b.payment_status,
                b.total_amount,
                b.paid_amount,
                b.balance,
                b.last_payment_date
            FROM students s 
            LEFT JOIN enrollments e ON e.id = (
                SELECT id FROM enrollments 
                WHERE student_id = s.student_id 
                ORDER BY id DESC LIMIT 1
            )
            -- JOIN PARA MAKUHA ANG PANGALAN NG SECTION --
            LEFT JOIN sections sec ON e.section_id = sec.id 
            LEFT JOIN academic_programs ap ON e.program_id = ap.id
            LEFT JOIN student_billing b ON s.student_id = b.student_id
            ORDER BY s.id DESC";

    $stmt = $pdo->query($sql);
    $students = [];

    while ($row = $stmt->fetch()) {
        // SECURITY: Proteksyon sa credentials
        unset($row['password']);

        // Data Cleaning & Type Casting para sa React
        $row['paid_amount'] = (float) ($row['paid_amount'] ?? 0);
        $row['total_amount'] = (float) ($row['total_amount'] ?? 0);
        $row['balance'] = (float) ($row['balance'] ?? 0);
        
        // IDs as Integers
        $row['section_id'] = $row['section_id'] ? (int)$row['section_id'] : null;
        $row['program_id'] = $row['program_id'] ? (int)$row['program_id'] : null;

        // UI HELPERS
        // I-a-assign natin ang nakuha nating 'actual_section_name' sa 'section' key
        $row['program_code'] = $row['ap_code'] ?? 'N/A';
        $row['section'] = $row['actual_section_name'] ?? 'TBA'; 

        $students[] = $row;
    }

    // 2. Fetching all billing items breakdown (Para sa SOA)
    $stmtItems = $pdo->query("SELECT billing_id, item_name, amount, paid_amount FROM student_billing_items");
    $billingItems = $stmtItems->fetchAll();

    echo json_encode([
        "success" => true,
        "students" => $students,
        "billing_items" => $billingItems
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>