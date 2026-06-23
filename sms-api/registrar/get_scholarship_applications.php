<?php
// registrar/get_scholarship_applications.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder, aakyat tayo ng isa para sa config.php
require '../config.php';

try {
    /**
     * ARCHITECT SQL:
     * 1. JOIN Students - para makuha ang Full Name.
     * 2. JOIN Scholarships Catalog - para makuha ang pangalan ng Scholarship (e.g., 'Academic Grant').
     * 3. REQUIREMENTS_FILE - Importante ito para sa AI OCR scanning sa React.
     */
    $sql = "SELECT 
                sa.id, 
                sa.student_id, 
                s.first_name, 
                s.last_name, 
                sc.name AS scholarship_name, 
                sa.sy, 
                sa.status, 
                sa.date_applied,
                sa.requirements_file 
            FROM scholarship_applications sa
            JOIN students s ON sa.student_id = s.student_id
            JOIN scholarships_catalog sc ON sa.scholarship_id = sc.id
            ORDER BY sa.date_applied DESC";

    // Gagamit ng PDO query (para sa simple GET requests na walang parameters)
    $stmt = $pdo->query($sql);
    $applications = $stmt->fetchAll();

    // Ibalik ang array (Empty array [] kung walang nahanap para hindi mag-crash ang React)
    echo json_encode($applications ?: []);

} catch (PDOException $e) {
    // Database error logging
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database Error: " . $e->getMessage()
    ]);
}
?>