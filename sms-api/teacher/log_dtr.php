<?php
/**
 * TEACHER MODULE: LOG DAILY TIME RECORD (DTR)
 * Location: sms-api/teacher/log_dtr.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// --- HANDLE PREFLIGHT (OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }

// 🟢 FIX: Ginamit ang config.php imbes na manual PDO connection
require_once '../config.php';

// I-set ang timezone sa Pilipinas
date_default_timezone_set('Asia/Manila');

// --- AUTH GATEKEEPER ---
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? apache_request_headers()['Authorization'] ?? '';
if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->teacher_id) || !isset($data->log_type) || !isset($data->latitude) || !isset($data->longitude)) {
    echo json_encode(["status" => "error", "message" => "Incomplete data or location not provided."]);
    exit();
}

try {
    // 🟢 SETUP NG SCHOOL COORDINATES (Norzagaray Area / Obando Area)
   $school_lat = 14.9079167; 
    $school_lng = 121.0331667; 
    $max_distance_meters = 150; // Radius ng school

    $user_lat = floatval($data->latitude);
    $user_lng = floatval($data->longitude);

    // --- HAVERSINE FORMULA PARA SA DISTANCE ---
    $theta = $user_lng - $school_lng;
    $dist = sin(deg2rad($user_lat)) * sin(deg2rad($school_lat)) +  cos(deg2rad($user_lat)) * cos(deg2rad($school_lat)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    $distance_in_meters = ($miles * 1.609344) * 1000;

    if ($distance_in_meters > $max_distance_meters) {
        echo json_encode([
            "status" => "error", 
            "message" => "Access Denied. You are " . round($distance_in_meters) . " meters away. You must be at the school premises to log your time."
        ]);
        exit();
    }

    $teacher_id = intval($data->teacher_id);
    $log_type = $data->log_type;
    $current_date = date('Y-m-d');
    $current_time = date('H:i:s'); 

    // --- DATABASE TRANSACTION ---
    $pdo->beginTransaction();

    // Check existing record for today
    $checkStmt = $pdo->prepare("SELECT id, time_in, time_out FROM teacher_dtr WHERE teacher_id = :teacher_id AND record_date = :record_date LIMIT 1");
    $checkStmt->execute([':teacher_id' => $teacher_id, ':record_date' => $current_date]);
    $record = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($log_type === 'time_in') {
        if (!$record) {
            $insert_query = "INSERT INTO teacher_dtr (teacher_id, record_date, time_in) VALUES (:teacher_id, :record_date, :current_time)";
            $insert_stmt = $pdo->prepare($insert_query);
            $insert_stmt->execute([
                ':teacher_id' => $teacher_id,
                ':record_date' => $current_date,
                ':current_time' => $current_time
            ]);
            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Time In recorded successfully."]);
        } else {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "You have already timed in today."]);
        }

    } else if ($log_type === 'time_out') {
        if ($record) {
            if ($record['time_out'] == null) {
                $update_query = "UPDATE teacher_dtr SET time_out = :current_time WHERE id = :id";
                $update_stmt = $pdo->prepare($update_query);
                $update_stmt->execute([
                    ':current_time' => $current_time,
                    ':id' => $record['id']
                ]);
                $pdo->commit();
                echo json_encode(["status" => "success", "message" => "Time Out recorded successfully."]);
            } else {
                $pdo->rollBack();
                echo json_encode(["status" => "error", "message" => "You have already timed out today."]);
            }
        } else {
            $pdo->rollBack();
            echo json_encode(["status" => "error", "message" => "Cannot Time Out without a Time In record."]);
        }
    } else {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => "Invalid log type."]);
    }

} catch(Exception $exception) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database Error: " . $exception->getMessage()]);
}
?>