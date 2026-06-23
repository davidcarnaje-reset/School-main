<?php
// config.php
session_start(); // 👈 ARCHITECT UPDATE: Kailangan ito para mabasa ang nag-login na user

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "sms_db";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die(json_encode(["success" => false, "message" => "Database connection failed!"]));
}

// ==============================================================================
// ARCHITECT UPDATE: SMARTER AUDIT TRAIL FUNCTION
// Tatlong parameters na lang ang kailangan: $pdo, $action_type, at $description
// ==============================================================================
function logAuditTrail($pdo, $action_type, $description)
{
    try {
        // AUTOMATIC USER DETECTION:
        // Kukunin niya sa $_SESSION. Kung walang naka-login (dahil tine-test pa lang natin), 
        // gagamit siya ng default na '1' at 'System/Admin' para hindi mag-error.
        $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1;
        $role = isset($_SESSION['role']) ? $_SESSION['role'] : 'Admin';

        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

        $query = "INSERT INTO audit_logs (user_id, user_role, action_type, description, ip_address) 
                  VALUES (:user_id, :user_role, :action_type, :description, :ip_address)";

        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':user_role', $role);
        $stmt->bindParam(':action_type', $action_type);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':ip_address', $ip_address);

        $stmt->execute();
    } catch (PDOException $e) {
        error_log("Audit Trail Error: " . $e->getMessage());
    }
}
?>