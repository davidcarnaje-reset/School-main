<?php
// notifications/create_notification.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../config.php';

// Siguraduhin na ang logAuditTrail function ay accessible (nasa config.php ito diba?)

$sender_id = $_POST['sender_id'] ?? 1;
$sender_role = $_POST['sender_role'] ?? 'admin';

$type = $_POST['type'] ?? 'Announcement';
$targetType = $_POST['targetType'] ?? 'role';
$targetRole = $_POST['targetRole'] ?? '';
$targetUserId = $_POST['targetUserId'] ?? '';

$title = trim($_POST['title'] ?? '');
$message = trim($_POST['message'] ?? '');
$dueDate = $_POST['dueDate'] ?? null;

if (empty($title) || empty($message)) {
    echo json_encode(["success" => false, "message" => "Title and Message are required."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. HANDLE IMAGE ATTACHMENT
    $attachment_filename = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $target_dir = "../uploads/notifications/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $file_extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
        $attachment_filename = "notif_" . time() . "_" . uniqid() . "." . $file_extension;
        move_uploaded_file($_FILES["image"]["tmp_name"], $target_dir . $attachment_filename);
    }

    // 2. SAVE NOTIFICATION
    $final_message = $message;
    if ($type === 'Task Reminder' && !empty($dueDate)) {
        $final_message = "[DUE: " . date('F d, Y', strtotime($dueDate)) . "]\n\n" . $message;
    }

    $notif_stmt = $pdo->prepare("INSERT INTO notifications (sender_id, sender_role, type, title, message, attachment) VALUES (?, ?, ?, ?, ?, ?)");
    $notif_stmt->execute([$sender_id, $sender_role, $type, $title, $final_message, $attachment_filename]);
    $notification_id = $pdo->lastInsertId();

    // 3. 🟢 FIXED TARGETING ENGINE 🟢
    $recipients = [];
    $recipient_count_for_log = 0; // Para mabilang sa audit trail kahit 'all' ang isave natin

    if ($targetType === 'user' && !empty($targetUserId)) {
        // SPECIFIC: Ise-save ang eksaktong ID ng user
        $recipients[] = ['id' => $targetUserId, 'role' => $targetRole];
        $recipient_count_for_log = 1;
    } 
    else if ($targetType === 'role') {
        // GENERAL BY ROLE (e.g. All Teachers): Ang ID ay magiging 'all', ang role ay 'teacher'
        $recipients[] = ['id' => 'all', 'role' => $targetRole];
        
        // Bilangin lang para sa Audit Log
        if ($targetRole === 'student') {
            $recipient_count_for_log = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
        } else {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = ?");
            $stmt->execute([$targetRole]);
            $recipient_count_for_log = $stmt->fetchColumn();
        }
    } 
    else {
        // GENERAL EVERYONE: Ang ID ay 'all', ang role ay 'all'
        $recipients[] = ['id' => 'all', 'role' => 'all'];
        
        // Bilangin lang para sa Audit Log
        $countUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $countStudents = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $recipient_count_for_log = $countUsers + $countStudents;
    }

    // 4. BULK INSERT RECIPIENTS
    if (count($recipients) > 0) {
        $query = "INSERT INTO notification_recipients (notification_id, recipient_id, recipient_role) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($query);
        foreach ($recipients as $r) {
            $stmt->execute([$notification_id, $r['id'], $r['role']]);
        }
    } else {
        throw new Exception("No recipients found for the selected target.");
    }

    // ==========================================
    // 📝 AUDIT TRAIL SNIPPET
    // ==========================================
    $log_target = ($targetType === 'all') ? "Everyone" : ($targetType === 'role' ? "all {$targetRole}s" : "User $targetUserId");
    $action_type = 'CREATE_NOTIFICATION';
    // Ginamit natin ang $recipient_count_for_log para tama pa rin ang bilang sa records mo
    $log_desc = "Sent a $type: '$title' to $log_target. Estimated Recipients: " . $recipient_count_for_log;

    // Tinatawag ang function na galing sa config.php
    logAuditTrail($pdo, $action_type, $log_desc);
    // ==========================================

    $pdo->commit();

    echo json_encode(["success" => true, "message" => "Notification sent successfully!"]);

} catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>