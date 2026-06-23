<?php
/**
 * STUDENT PORTAL: GET PERSONAL SCHOLARSHIP APPLICATIONS
 * Location: sms-api/student/get_student_application.php
 * Status: SECURE / PDO / PATH-ADJUSTED
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

// 1. PATH ADJUSTMENT: Umakyat ng isa (../) para mahanap si config.php
require_once '../config.php';

$email = $_GET['email'] ?? '';

if (!empty($email)) {
    try {
        /**
         * SQL ARCHITECTURE:
         * Ginagamit natin ang 'scholarships_catalog' base sa database screenshot mo.
         * Named placeholder (:email) para 100% protection sa SQL Injection.
         */
        $sql = "SELECT 
                    sa.id, 
                    sc.name AS scholarship_name, 
                    sa.status, 
                    sa.date_applied, 
                    sa.sy
                FROM scholarship_applications sa
                INNER JOIN students st ON sa.student_id = st.student_id
                INNER JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
                WHERE st.email = :email
                ORDER BY sa.date_applied DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $email]);

        $applications = [];

        while ($row = $stmt->fetch()) {
            // Formatting: Mar 26, 2026 format para sa UI
            $row['date_applied'] = date("M d, Y", strtotime($row['date_applied']));
            $applications[] = $row;
        }

        // Response format na tugma sa React axios.get logic mo
        echo json_encode([
            "status" => "success",
            "data" => $applications ?: []
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Email is required."
    ]);
}
?>