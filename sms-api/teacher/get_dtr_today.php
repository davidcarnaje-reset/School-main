<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// I-set ang timezone sa Pilipinas
date_default_timezone_set('Asia/Manila');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    $pdo = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Kunin ang teacher_id mula sa URL parameter
    $teacher_id = isset($_GET['teacher_id']) ? $_GET['teacher_id'] : null;

    if (!$teacher_id) {
        echo json_encode(["status" => "error", "message" => "Teacher ID is required."]);
        exit();
    }

    $current_date = date('Y-m-d');

    // Hanapin ang record ngayong araw
    $query = "SELECT time_in, time_out FROM teacher_dtr WHERE teacher_id = :teacher_id AND record_date = :record_date";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':teacher_id', $teacher_id);
    $stmt->bindParam(':record_date', $current_date);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            "status" => "success", 
            "data" => [
                "time_in" => $row['time_in'] ? date("H:i", strtotime($row['time_in'])) : null,
                "time_out" => $row['time_out'] ? date("H:i", strtotime($row['time_out'])) : null
            ]
        ]);
    } else {
        // Kapag walang record, ibalik lang na null ang mga oras
        echo json_encode([
            "status" => "success", 
            "data" => [
                "time_in" => null,
                "time_out" => null
            ]
        ]);
    }

} catch(PDOException $exception) {
    echo json_encode(["status" => "error", "message" => "Connection error: " . $exception->getMessage()]);
}
?>