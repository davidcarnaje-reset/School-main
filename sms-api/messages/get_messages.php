<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// 1. SALUHIN ANG AXIOS PREFLIGHT REQUEST
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';

if (isset($_GET['user_id']) && isset($_GET['user_role']) && isset($_GET['contact_id']) && isset($_GET['contact_role'])) {

    $userId = $_GET['user_id'];
    $userRole = $_GET['user_role'];
    $contactId = $_GET['contact_id'];
    $contactRole = $_GET['contact_role'];

    try {
        // 2. I-UPDATE ANG MGA UNREAD MESSAGES TO "READ"
        // (Basta galing sa contact at ipinadala sa logged-in user)
        $updateQuery = "
            UPDATE messages 
            SET is_read = 1 
            WHERE sender_id = :cid AND sender_role = :crole 
              AND receiver_id = :uid AND receiver_role = :urole 
              AND is_read = 0
        ";
        $stmtUpdate = $pdo->prepare($updateQuery);
        $stmtUpdate->execute([
            'cid' => $contactId,
            'crole' => $contactRole,
            'uid' => $userId,
            'urole' => $userRole
        ]);

        // 3. KUNIN ANG BUONG CONVERSATION HISTORY
        // Ordered from Oldest to Newest (ASC) para tama ang sunod-sunod sa Chat UI
        $selectQuery = "
            SELECT 
                id, 
                sender_id, 
                sender_role, 
                message, 
                is_read, 
                created_at 
            FROM messages
            WHERE (sender_id = :uid AND sender_role = :urole AND receiver_id = :cid AND receiver_role = :crole)
               OR (sender_id = :cid AND sender_role = :crole AND receiver_id = :uid AND receiver_role = :urole)
            ORDER BY created_at ASC
        ";
        $stmtSelect = $pdo->prepare($selectQuery);
        $stmtSelect->execute([
            'uid' => $userId,
            'urole' => $userRole,
            'cid' => $contactId,
            'crole' => $contactRole
        ]);

        $messages = $stmtSelect->fetchAll(PDO::FETCH_ASSOC);

        // 4. I-FORMAT ANG DATA PARA MAS MADALI SA REACT
        $formattedMessages = array_map(function ($msg) use ($userId, $userRole) {

            // I-check kung ang logged-in user ba ang nag-send
            $isSender = ($msg['sender_id'] == $userId && $msg['sender_role'] == $userRole);

            return [
                "id" => $msg['id'],
                "text" => $msg['message'],
                "is_you" => $isSender, // True = Right side (Blue bubble), False = Left side (White bubble)
                "time" => date("h:i A", strtotime($msg['created_at'])), // Formatted e.g., "02:30 PM"
                "date" => date("Y-m-d", strtotime($msg['created_at'])),
                "is_read" => (bool) $msg['is_read']
            ];

        }, $messages);

        echo json_encode([
            "status" => "success",
            "data" => $formattedMessages
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required parameters (user and contact IDs/roles)"]);
}
?>