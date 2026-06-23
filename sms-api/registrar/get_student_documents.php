<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include '../config.php';

$student_id = isset($_GET['student_id']) ? $conn->real_escape_string($_GET['student_id']) : '';
$documents = [];

if (!empty($student_id)) {
    $sql = "SELECT id, document_name, file_path, status, date_uploaded 
            FROM student_documents 
            WHERE student_id = '$student_id'";

    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $documents[] = $row;
        }
    }
}
echo json_encode($documents);
?>