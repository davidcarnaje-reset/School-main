<?php
// registrar/get_academic_programs.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Gamitin ang PDO connection
require '../config.php';

try {
    // Pinatili natin ang sorting logic mo dahil ito ang pinaka-malinis tingnan sa UI
    $sql = "SELECT id, department, program_code, program_description, major, status 
            FROM academic_programs 
            ORDER BY department DESC, program_code ASC";

    $stmt = $pdo->query($sql);
    $programs = $stmt->fetchAll();

    // ARCHITECT TIP: Mag-return ng empty array [] imbes na null 
    // para hindi mag-crash ang .filter() at .map() sa React frontend.
    echo json_encode($programs ?: []);

} catch (PDOException $e) {
    // Error handling para sa debugging
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>