<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json; charset=UTF-8");

// Siguraduhin na tama ang path ng config.php mo
include_once '../config.php';

$student_id = isset($_GET['id']) ? $conn->real_escape_string($_GET['id']) : '';

if (!empty($student_id)) {
    // 1. Pakicheck kung 'students' ang pangalan ng table mo
    // 2. Pakicheck kung 'student_id' ang column name (minsan 'id' lang o 'student_no')
    $sql = "SELECT first_name, last_name FROM students WHERE TRIM(student_id) LIKE TRIM('$student_id') LIMIT 1";

    $result = $conn->query($sql);

    if ($result) {
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode([
                "status" => "found",
                "name" => strtoupper($row['first_name'] . " " . $row['last_name'])
            ]);
        } else {
            // Kung walang nahanap na record
            echo json_encode(["status" => "not_found", "debug" => "No record for ID: " . $student_id]);
        }
    } else {
        // Kung may error sa SQL query mismo (halimbawa: maling table name)
        echo json_encode(["success" => false, "message" => "Database Error: " . $errorInfo[2]]);
    }
} else {
    echo json_encode(["status" => "empty", "message" => "No ID provided"]);
}

$conn->close();
?>