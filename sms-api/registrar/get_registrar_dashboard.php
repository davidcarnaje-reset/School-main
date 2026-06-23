<?php
// registrar/get_registrar_dashboard.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// ARCHITECT UPDATE: Dahil nasa 'registrar' folder, kailangan ng ../
require '../config.php';

try {
    // 1. STATS COLLECTION (Gamit ang PDO query + fetchColumn para sa bibilis)
    $total_students = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
    $total_enrolled = $pdo->query("SELECT COUNT(*) FROM enrollments WHERE status = 'Enrolled'")->fetchColumn();
    $pending_reg = $pdo->query("SELECT COUNT(*) FROM enrollments WHERE status = 'Pending'")->fetchColumn();
    $awaiting_pay = $pdo->query("SELECT COUNT(*) FROM enrollments WHERE status = 'Assessed'")->fetchColumn();

    // 2. DOCUMENT REQUESTS (Status check: Pending/Processing)
    $pending_req = $pdo->query("SELECT COUNT(*) FROM service_requests WHERE status != 'Released'")->fetchColumn();

    // 3. REVENUE SUMMARY (Total Collection)
    $total_revenue = $pdo->query("SELECT SUM(paid_amount) FROM student_billing")->fetchColumn();

    // 4. GRADE DISTRIBUTION (Grouping logic)
    $grade_stmt = $pdo->query("SELECT grade_level, COUNT(*) as count FROM enrollments GROUP BY grade_level");
    $grade_stats = $grade_stmt->fetchAll();

    // 5. RECENT ACTIVITIES (JOIN Logic)
    $recent_query = "SELECT s.first_name, s.last_name, e.status, e.created_at 
                     FROM students s 
                     JOIN enrollments e ON s.student_id = e.student_id 
                     ORDER BY e.id DESC LIMIT 5";
    $recent_stmt = $pdo->query($recent_query);
    $recent_activities = [];

    while ($row = $recent_stmt->fetch()) {
        $status_label = $row['status'];
        // ARCHITECT TIP: Clean labels para sa UI mapping mo sa React
        if ($row['status'] == 'Pending')
            $status_label = 'FOR ASSESSMENT';
        if ($row['status'] == 'Assessed')
            $status_label = 'WAITING FOR PAYMENT';

        $recent_activities[] = [
            "first_name" => $row['first_name'],
            "last_name" => $row['last_name'],
            "status" => $status_label,
            "date_added" => $row['created_at']
        ];
    }

    // 6. FINAL JSON RESPONSE
    echo json_encode([
        "success" => true,
        "stats" => [
            "total_students" => (int) $total_students,
            "total_enrolled" => (int) $total_enrolled,
            "pending_registrar" => (int) $pending_reg,
            "awaiting_payment" => (int) $awaiting_pay,
            "pending_requests" => (int) $pending_req,
            "total_revenue" => (float) $total_revenue
        ],
        "grade_distribution" => $grade_stats ?: [],
        "recent_activities" => $recent_activities ?: []
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>