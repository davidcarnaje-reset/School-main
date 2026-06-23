<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config.php';

if (isset($_GET['user_id']) && isset($_GET['user_role'])) {
    $userId = $_GET['user_id'];
    $userRole = $_GET['user_role'];

    try {
        // ADVANCED SQL: Kinukuha ang pinaka-latest na message kada contact
        // At tinitingnan kung sa `users` o `students` table kukunin ang pangalan
        $query = "
            WITH RankedMessages AS (
                SELECT 
                    IF(sender_id = :uid AND sender_role = :urole, receiver_id, sender_id) AS contact_id,
                    IF(sender_id = :uid AND sender_role = :urole, receiver_role, sender_role) AS contact_role,
                    message, 
                    created_at, 
                    is_read, 
                    sender_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY 
                            IF(sender_id = :uid AND sender_role = :urole, receiver_id, sender_id),
                            IF(sender_id = :uid AND sender_role = :urole, receiver_role, sender_role)
                        ORDER BY created_at DESC
                    ) as rn
                FROM messages
                WHERE (sender_id = :uid AND sender_role = :urole)
                   OR (receiver_id = :uid AND receiver_role = :urole)
            )
            SELECT 
                rm.contact_id, 
                rm.contact_role, 
                rm.message as last_message, 
                rm.created_at as last_time, 
                rm.is_read, 
                rm.sender_id,
                COALESCE(u.full_name, CONCAT(s.first_name, ' ', s.last_name)) AS contact_name,
                COALESCE(u.profile_image, s.profile_image) AS profile_image
            FROM RankedMessages rm
            LEFT JOIN users u ON rm.contact_id = u.id AND rm.contact_role != 'student'
            LEFT JOIN students s ON rm.contact_id = s.student_id AND rm.contact_role = 'student'
            WHERE rm.rn = 1
            ORDER BY rm.created_at DESC
        ";

        $stmt = $pdo->prepare($query);
        // Ipapasa natin yung parameters (:uid at :urole) ng apat na beses dahil ilang beses natin siyang ginamit sa query
        $stmt->execute([
            'uid' => $userId,
            'urole' => $userRole
        ]);

        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format the time directly in PHP for easier React rendering
        $formattedContacts = array_map(function ($contact) use ($userId) {
            // Check if the current user is the sender of the last message
            $contact['is_you'] = ($contact['sender_id'] == $userId) ? true : false;

            // Format time (e.g., "2h", "Yesterday", "Tue")
            $time = strtotime($contact['last_time']);
            $diff = time() - $time;

            if ($diff < 86400 && date('d') == date('d', $time)) {
                $contact['display_time'] = date('g:i A', $time); // Today: "2:30 PM"
            } elseif ($diff < 172800 && date('d', strtotime('-1 day')) == date('d', $time)) {
                $contact['display_time'] = 'Yesterday';
            } else {
                $contact['display_time'] = date('M d', $time); // Older: "Apr 15"
            }

            return $contact;
        }, $contacts);

        echo json_encode([
            "status" => "success",
            "contacts" => $formattedContacts
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
}
?>