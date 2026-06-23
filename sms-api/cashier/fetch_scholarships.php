<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// GAMITIN ANG config.php DAHIL ITO ANG NASA add_student.php MO
include 'config.php'; 

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Kunin ang mga active scholarships mula sa catalog
$sql = "SELECT id, name, discount_type, discount_value FROM scholarships_catalog WHERE status = 'Active'";
$result = $conn->query($sql);

$scholarships = array();

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $scholarships[] = $row;
    }
}

// I-send ang data sa React frontend
echo json_encode($scholarships);
?>