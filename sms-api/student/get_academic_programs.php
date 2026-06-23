<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Kunin lang ang mga Active na programs
$sql = "SELECT id, department as dept, program_code as code, program_description as `desc`, major 
        FROM academic_programs 
        WHERE status = 'Active' 
        ORDER BY department DESC, program_code ASC";

$result = $conn->query($sql);
$programs = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $programs[] = $row;
    }
    echo json_encode($programs);
} else {
    echo json_encode(["success" => false, "message" => "Database Error: " . $errorInfo[2]]);
}

$conn->close();
?>