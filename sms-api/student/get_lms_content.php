<?php
/**
 * STUDENT FOLDER: ENROLLED SECTIONS FETCH
 * Location: sms-api/student/get_lms_content.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit();
}

// Inayos ang path para tumugma sa config.php ng system [cite: 19]
require_once '../config.php';

try {
    // Kunin ang section_id mula sa React frontend
    $section_id = isset($_GET['section_id']) ? $_GET['section_id'] : null;

    if (!$section_id) {
        echo json_encode(["success" => false, "sections" => [], "message" => "No section ID provided"]);
        exit;
    }

    /**
     * SQL QUERY:
     * Kukunin ang detalye ng section base sa section_id ng estudyante.
     */
    $sql = "SELECT * FROM sections WHERE id = :section_id AND status = 'Active'";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['section_id' => $section_id]);
    
    $enrolled_sections = $stmt->fetchAll();

    echo json_encode([
        "success" => true,
        "enrolled_sections" => $enrolled_sections
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>