<?php
// registrar/search_students.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder, aakyat tayo ng isa para sa config.php
require '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$students = [];

if (!empty($query)) {
    try {
        /**
         * ARCHITECT SECURE QUERY:
         * Gagamit tayo ng named placeholders (:q) para sa Prepared Statement.
         * Nilagyan natin ng LIMIT 10 para mabilis ang search results sa dropdown.
         */
        $sql = "SELECT student_id, first_name, last_name 
                FROM students 
                WHERE first_name LIKE :q 
                   OR last_name LIKE :q 
                   OR student_id LIKE :q 
                LIMIT 10";

        $stmt = $pdo->prepare($sql);

        // I-execute gamit ang wildcards (%)
        $stmt->execute(['q' => "%$query%"]);

        // Kunin ang lahat ng results
        $students = $stmt->fetchAll();

    } catch (PDOException $e) {
        // Database error logging
        http_response_code(500);
        echo json_encode(["error" => "Database Error: " . $e->getMessage()]);
        exit();
    }
}

// Ibalik ang array. Empty array [] kung walang nahanap para hindi mag-crash ang React.
echo json_encode($students ?: []);
?>