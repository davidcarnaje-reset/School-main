<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';

// Basahin ang JSON data at i-convert sa associative array (true)
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['studentId']) && !empty($data['amount'])) {
    $student_id = $conn->real_escape_string($data['studentId']);
    $amount = $conn->real_escape_string($data['amount']);
    $method = $conn->real_escape_string($data['method']);
    $fee_category = $conn->real_escape_string($data['fee_category']); // Tinitiyak na ito ang ginagamit

    $sql = "INSERT INTO payments (student_id, amount_paid, payment_method, fee_category, transaction_date) 
            VALUES ('$student_id', '$amount', '$method', '$fee_category', NOW())";

    if ($conn->query($sql) === TRUE) {
        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Payment processed successfully", "category_saved" => $fee_category]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database Error: " . $errorInfo[2]]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
}

$conn->close();
?>