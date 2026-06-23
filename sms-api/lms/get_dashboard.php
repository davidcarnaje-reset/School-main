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

// Gumamit ng config.php na may PDO setup ($pdo)
include_once '../config.php';

if (isset($_GET['student_id'])) {
    $studentId = $_GET['student_id'];

    try {
        // 1. KUNIN ANG ANALYTICS (Time spent & Logins)
        $statQuery = "SELECT lms_login_count, lms_total_minutes FROM students WHERE student_id = :sid";
        $stmt = $pdo->prepare($statQuery);
        $stmt->execute(['sid' => $studentId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$stats) {
            $stats = ["lms_login_count" => 0, "lms_total_minutes" => 0];
        }

        // 2. KUNIN ANG MGA ENROLLED SUBJECTS + CLASS POPULATION + TOTAL MODULES
        $subjQuery = "
            SELECT 
                c.id as class_id,
                s.subject_code as tag,
                s.subject_description as title,
                -- Kunin ang huling beses na binuksan ang subject
                ec.last_accessed, 
                (SELECT COUNT(*) FROM enrolled_classes WHERE class_assignment_id = c.id AND status = 'Enrolled') as student_count,
                (SELECT COUNT(*) FROM classroom_modules WHERE class_id = c.id) as total_lessons,
                (SELECT COUNT(*) FROM student_lesson_progress WHERE class_assignment_id = c.id AND student_id = :sid) as completed_lessons
            FROM enrolled_classes ec
            JOIN class_assignments c ON ec.class_assignment_id = c.id
            JOIN subjects s ON c.subject_id = s.id
            WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
            -- DITO ANG MAGIC: I-sort base sa huling bukas, at limitahan sa 3
            ORDER BY ec.last_accessed DESC 
            LIMIT 3
        ";
        $stmt = $pdo->prepare($subjQuery);
        $stmt->execute(['sid' => $studentId]);
        $subjectsResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $courses = [];
        $colors = ['#2563eb', '#059669', '#7c3aed', '#db2777', '#ea580c'];

        $i = 0;
        foreach ($subjectsResult as $row) {
            $row['color'] = $colors[$i % count($colors)];

            // Map the dynamic counts
            $row['student_count'] = (int) $row['student_count'];
            $row['progress'] = (int) $row['completed_lessons'];
            // Fallback sa 1 para iwas 'division by zero' error sa frontend
            $row['total'] = (int) $row['total_lessons'] > 0 ? (int) $row['total_lessons'] : 1;

            $courses[] = $row;
            $i++;
        }

        // 3. KUNIN ANG MGA PENDING ACTIVITIES/TASKS (ARCHITECT FIX: Idinagdag ang a.class_id)
        $taskQuery = "
            SELECT 
                a.class_id,  -- ETO YUNG KULANG KANINA!
                a.title,
                s.subject_code as `desc`,
                CONCAT(u.first_name, ' ', u.last_name) as teacher,
                a.due_date as duration
            FROM activities a
            JOIN class_assignments c ON a.class_id = c.id
            JOIN enrolled_classes ec ON c.id = ec.class_assignment_id
            JOIN subjects s ON c.subject_id = s.id
            JOIN users u ON a.teacher_id = u.id
            LEFT JOIN student_activity_scores sas ON a.id = sas.activity_id AND sas.student_id = ec.student_id
            WHERE ec.student_id = :sid AND ec.status = 'Enrolled'
              AND (sas.status IS NULL OR sas.status = 'Pending')
            ORDER BY a.due_date ASC LIMIT 4
        ";
        $stmt = $pdo->prepare($taskQuery);
        $stmt->execute(['sid' => $studentId]);
        $tasksResult = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $tasks = [];
        foreach ($tasksResult as $row) {
            if ($row['duration']) {
                $row['duration'] = date("M d, g:i A", strtotime($row['duration']));
            } else {
                $row['duration'] = "No Due Date";
            }
            $tasks[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "stats" => $stats,
            "courses" => $courses,
            "nextLessons" => $tasks
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Missing student_id"]);
}
?>