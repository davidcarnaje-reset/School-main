<?php
// cashier/get_pending_scholarships.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Gamitin ang PDO connection para sa security
require '../config.php';

try {
        // Pinatili natin ang JOIN logic mo dahil ito ang pinaka-accurate.
        // Idinagdag lang natin ang sc.id para sa unique identification.
        $sql = "SELECT 
                sa.id, 
                sa.student_id, 
                sa.status, 
                s.first_name, 
                s.last_name, 
                sc.name as scholarship_name, 
                sc.discount_value as value, 
                sc.discount_type
            FROM scholarship_applications sa
            JOIN students s ON sa.student_id = s.student_id
            JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
            WHERE sa.status = 'Pending'
            ORDER BY sa.date_applied DESC";

        $stmt = $pdo->query($sql);
        $list = $stmt->fetchAll();

        // Siguraduhin na ang numeric values ay naka-float para sa React math
        foreach ($list as &$row) {
                $row['value'] = (float) $row['value'];
        }

        // ARCHITECT TIP: I-return ang empty array [] kung walang pending para hindi mag-crash ang React
        echo json_encode($list ?: []);

} catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
}
?>