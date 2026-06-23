<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../config.php';

$student_id = $_GET['student_id'] ?? '';

if (!$student_id) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit;
}

try {
    // 1. KUNIN ANG LOGINS AT STUDY TIME MULA SA STUDENTS TABLE
    $statsStmt = $pdo->prepare("SELECT lms_login_count, lms_total_minutes FROM students WHERE student_id = :sid");
    $statsStmt->execute(['sid' => $student_id]);
    $studentStats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    $lms_logins = $studentStats['lms_login_count'] ?? 0;
    // Pinalitan natin ito para raw minutes na ang ibato!
    $study_minutes = $studentStats['lms_total_minutes'] ?? 0;

    // 2. KUNIN ANG SCHEDULE NGAYONG ARAW
    $dayOfWeek = date('w'); // 0 (Sun) to 6 (Sat)
    $dayMap = [0 => 'Su', 1 => 'M', 2 => 'T', 3 => 'W', 4 => 'Th', 5 => 'F', 6 => 'S'];
    $todayLetter = $dayMap[$dayOfWeek];

    $scheduleStmt = $pdo->prepare("
        SELECT 
            s.subject_code AS subject,
            s.subject_description AS description,
            r.room_name AS room,
            ca.schedule AS time
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        LEFT JOIN rooms r ON ca.room_id = r.id
        WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
          AND ca.days LIKE :today
    ");
    $scheduleStmt->execute(['sid' => $student_id, 'today' => '%' . $todayLetter . '%']);
    $scheduleToday = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. KUNIN ANG PENDING TASKS
    $tasksStmt = $pdo->prepare("
        SELECT 
            a.title,
            s.subject_code AS subject,
            DATE_FORMAT(a.due_date, '%M %d, %Y') as due
        FROM enrolled_classes ec
        JOIN class_assignments ca ON ec.class_assignment_id = ca.id
        JOIN subjects s ON ca.subject_id = s.id
        JOIN activities a ON ca.id = a.class_id
        LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
        WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
          AND (sas.status IS NULL OR sas.status = 'Pending')
        ORDER BY a.due_date ASC LIMIT 5
    ");
    $tasksStmt->execute(['sid' => $student_id]);
    $pendingTasks = $tasksStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. I-CALCULATE ANG TASK COMPLETION RATE (%)
    $totalActStmt = $pdo->prepare("
        SELECT COUNT(a.id) as total 
        FROM enrolled_classes ec
        JOIN activities a ON ec.class_assignment_id = a.class_id
        WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
    ");
    $totalActStmt->execute(['sid' => $student_id]);
    $totalActivities = $totalActStmt->fetchColumn();

    $compActStmt = $pdo->prepare("
        SELECT COUNT(sas.id) as completed 
        FROM enrolled_classes ec
        JOIN activities a ON ec.class_assignment_id = a.class_id
        JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
        WHERE ec.student_id = :sid AND ec.status = 'Enrolled' 
        AND sas.status IN ('Submitted', 'Graded')
    ");
    $compActStmt->execute(['sid' => $student_id]);
    $completedActivities = $compActStmt->fetchColumn();

    $completionRate = 0;
    if ($totalActivities > 0) {
        $completionRate = round(($completedActivities / $totalActivities) * 100);
    }

    // ISEND LAHAT SA REACT
    echo json_encode([
        "success" => true,
        "scheduleToday" => $scheduleToday,
        "pendingTasks" => $pendingTasks,
        "analytics" => [
            "totalMinutes" => $study_minutes, // Pinalitan natin ito mula totalHours!
            "sessions" => $lms_logins,
            "completionRate" => $completionRate
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>