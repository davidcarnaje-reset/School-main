<?php
include_once '../config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$studentId = $_GET['student_id'] ?? ''; // e.g., '2026-0003'
$classId = $_GET['class_id'] ?? '';

if (!$studentId || !$classId) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit;
}

try {
    // ==========================================
    // ARCHITECT FIX 1: UPDATE LAST ACCESSED PARA PUMUNTA SA UNAHAN NG DASHBOARD
    // ==========================================
    $updateAccess = $pdo->prepare("UPDATE enrolled_classes SET last_accessed = NOW() WHERE student_id = ? AND class_assignment_id = ?");
    $updateAccess->execute([$studentId, $classId]);

    // ==========================================
    // ARCHITECT FIX 2: KUNIN ANG SUBJECT AT TEACHER INFO PARA WALA NANG "TBA"
    // ==========================================
    $infoQuery = "
        SELECT 
            s.subject_code as tag, 
            s.subject_description as title, 
            CONCAT(u.first_name, ' ', u.last_name) as teacher
        FROM class_assignments ca
        JOIN subjects s ON ca.subject_id = s.id
        LEFT JOIN users u ON ca.teacher_id = u.id
        WHERE ca.id = :class_id
    ";
    $stmtInfo = $pdo->prepare($infoQuery);
    $stmtInfo->execute(['class_id' => $classId]);
    $courseInfo = $stmtInfo->fetch(PDO::FETCH_ASSOC);

    // ==========================================
    // 1. FETCH MAIN FEED (Activities + Modules using UNION)
    // ==========================================
    $feedQuery = "
        SELECT 
            CONCAT('act_', a.id) as id,
            CASE 
                WHEN a.category IN ('exam', 'prelim', 'midterm', 'finals') THEN 'exam'
                ELSE 'activity'
            END as type,
            a.title,
            a.description as desc_text,
            DATE_FORMAT(a.created_at, '%M %d, %Y') as date,
            DATE_FORMAT(a.created_at, '%h:%i %p') as time,
            a.created_at as sort_date,
            a.max_score as total,
            sas.score,
            sas.status as submission_status,
            COALESCE(sas.attempts, 0) as attempts,
            COALESCE(a.max_attempts, 1) as max_attempts
        FROM activities a
        LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = :student_id
        WHERE a.class_id = :class_id

        UNION ALL

        SELECT 
            CONCAT('mod_', m.id) as id,
            'lecture' as type,
            m.title,
            'Uploaded Document/Module' as desc_text,
            DATE_FORMAT(m.created_at, '%M %d, %Y') as date,
            DATE_FORMAT(m.created_at, '%h:%i %p') as time,
            m.created_at as sort_date,
            NULL as total,
            NULL as score,
            NULL as submission_status,
            NULL as attempts,
            NULL as max_attempts
        FROM classroom_modules m
        WHERE m.class_id = :class_id

        ORDER BY sort_date DESC
    ";

    $stmtFeed = $pdo->prepare($feedQuery);
    $stmtFeed->execute(['class_id' => $classId, 'student_id' => $studentId]);
    $feedResults = $stmtFeed->fetchAll(PDO::FETCH_ASSOC);

    // Linisin ang format para sakto sa React props natin
    $feed = array_map(function ($item) {
        return [
            "id" => $item['id'],
            "type" => $item['type'],
            "title" => $item['title'],
            "desc" => $item['desc_text'],
            "date" => $item['date'],
            "time" => $item['time'],
            "score" => $item['score'],
            "total" => $item['total'] ? (int) $item['total'] : null,
            "status" => $item['submission_status'],
            "attempts" => $item['attempts'] !== null ? (int) $item['attempts'] : null,
            "max_attempts" => $item['max_attempts'] !== null ? (int) $item['max_attempts'] : null
        ];
    }, $feedResults);

    // ==========================================
    // 2. FETCH DUE SOON (Upcoming Deadlines mula sa activities table)
    // ==========================================
    $dueQuery = "
        SELECT 
            id, 
            title, 
            DATE_FORMAT(due_date, '%M %d, %Y') as date,
            DATE_FORMAT(due_date, '%h:%i %p') as time
        FROM activities 
        WHERE class_id = :class_id 
          AND due_date > NOW() 
        ORDER BY due_date ASC 
        LIMIT 3
    ";
    $stmtDue = $pdo->prepare($dueQuery);
    $stmtDue->execute(['class_id' => $classId]);
    $dueSoon = $stmtDue->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // 3. FETCH RECENT GRADES (Mula sa student_activity_scores)
    // ==========================================
    $gradesQuery = "
        SELECT 
            a.id, 
            a.title, 
            CASE 
                WHEN a.category IN ('exam', 'prelim', 'midterm', 'finals') THEN 'exam'
                ELSE 'activity'
            END as type,
            sas.score, 
            a.max_score as total, 
            DATE_FORMAT(sas.date_graded, '%M %d, %Y') as date
        FROM student_activity_scores sas
        JOIN activities a ON sas.activity_id = a.id
        WHERE a.class_id = :class_id 
          AND sas.student_id = :student_id
          AND sas.status = 'Graded'
        ORDER BY sas.date_graded DESC 
        LIMIT 5
    ";
    $stmtGrades = $pdo->prepare($gradesQuery);
    $stmtGrades->execute(['class_id' => $classId, 'student_id' => $studentId]);
    $recentGrades = $stmtGrades->fetchAll(PDO::FETCH_ASSOC);

    // ==========================================
    // 4. GET QUARTER STANDING (Mula sa student_grades table)
    // ==========================================
    $standingQuery = "
        SELECT final_grade, remarks 
        FROM student_grades 
        WHERE class_id = :class_id AND student_id = :student_id 
        ORDER BY last_updated DESC LIMIT 1
    ";
    $stmtStanding = $pdo->prepare($standingQuery);
    $stmtStanding->execute(['class_id' => $classId, 'student_id' => $studentId]);
    $gradeRecord = $stmtStanding->fetch(PDO::FETCH_ASSOC);

    $standing = [
        "status" => $gradeRecord && $gradeRecord['remarks'] ? $gradeRecord['remarks'] : "Evaluating",
        "grade" => $gradeRecord ? (float) $gradeRecord['final_grade'] : 0
    ];

    // ==========================================
    // OUTPUT FINAL JSON
    // ==========================================
    echo json_encode([
        "status" => "success",
        "course_info" => $courseInfo, // ARCHITECT FIX: Pasa ang exact info
        "feed" => $feed,
        "due_soon" => $dueSoon,
        "recent_grades" => $recentGrades,
        "standing" => $standing
    ]);

} catch (PDOException $e) {
    error_log("Classroom Feed Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Database error"]);
}
?>