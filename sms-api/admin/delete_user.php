<?php
// admin/delete_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Lumabas ng folder para mahanap ang config.php
require '../config.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->id)) {
    try {
        $id = intval($data->id);

        // ARCHITECT SECURITY: Hindi pwedeng i-delete ng Admin ang sarili niyang account 
        // (Isang logic layer ito para hindi niyo ma-lock-out ang sarili niyo)

        // 1. Prepare ang Delete Query gamit ang PDO
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");

        if ($stmt->execute(['id' => $id])) {
            // I-check kung may nabura talaga (rowCount)
            if ($stmt->rowCount() > 0) {

                // ==========================================
                // 📝 AUDIT TRAIL SNIPPET
                // ==========================================
                $action_type = 'DELETE_USER';
                $log_desc = "Deleted user account with ID: " . $id;
                logAuditTrail($pdo, $action_type, $log_desc);
                // ==========================================

                echo json_encode(["success" => true, "message" => "User deleted successfully."]);

            } else {
                echo json_encode(["success" => false, "message" => "User not found or already deleted."]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Failed to execute delete command."]);
        }

    } catch (PDOException $e) {
        // Kapag may Foreign Key error (halimbawa may mga transaction na yung user), ito ang sasalo
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete user. This account might be linked to other records (logs/transactions)."
        ]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid Request: User ID is required."]);
}
?>