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

if (isset($_GET['student_id'])) {
    $studentId = $_GET['student_id'];

    try {
        // 1. QUICK STATS (GWA, LMS Time)
        $stmtStats = $pdo->prepare("SELECT lms_total_minutes FROM students WHERE student_id = :sid");
        $stmtStats->execute(['sid' => $studentId]);
        $studentData = $stmtStats->fetch(PDO::FETCH_ASSOC);

        $stmtGwa = $pdo->prepare("SELECT AVG(final_grade) as gwa FROM student_grades WHERE student_id = :sid");
        $stmtGwa->execute(['sid' => $studentId]);
        $gwaData = $stmtGwa->fetch(PDO::FETCH_ASSOC);

        $gwa = $gwaData['gwa'] ? number_format($gwaData['gwa'], 2) : "N/A";
        $totalMins = $studentData ? (int) $studentData['lms_total_minutes'] : 0;

        // 2. OVERALL GRADES (By Quarter)
        $stmtGrades = $pdo->prepare("SELECT quarter, AVG(final_grade) as avg_grade FROM student_grades WHERE student_id = :sid GROUP BY quarter");
        $stmtGrades->execute(['sid' => $studentId]);
        $overallGrades = [];
        while ($row = $stmtGrades->fetch(PDO::FETCH_ASSOC)) {
            $overallGrades[] = ["quarter" => $row['quarter'], "grade" => round($row['avg_grade'], 1)];
        }
        // Fallback kung walang grades pa sa database
        if (empty($overallGrades)) {
            $overallGrades = [
                ["quarter" => "Q1", "grade" => 85],
                ["quarter" => "Q2", "grade" => 88],
                ["quarter" => "Q3", "grade" => 90],
                ["quarter" => "Q4", "grade" => 92]
            ];
        }

        // 3. SUBJECT GRADES (Scores per Activity per Subject)
        $stmtSubjectGrades = $pdo->prepare("
            SELECT s.subject_code, a.title, sas.score, a.max_score 
            FROM student_activity_scores sas
            JOIN activities a ON sas.activity_id = a.id
            JOIN class_assignments ca ON a.class_id = ca.id
            JOIN subjects s ON ca.subject_id = s.id
            WHERE sas.student_id = :sid AND sas.status IN ('Graded', 'Late')
            ORDER BY a.created_at ASC
        ");
        $stmtSubjectGrades->execute(['sid' => $studentId]);

        $subjectGradesData = [];
        $availableSubjects = [];
        while ($row = $stmtSubjectGrades->fetch(PDO::FETCH_ASSOC)) {
            $subj = $row['subject_code'];
            if (!isset($subjectGradesData[$subj])) {
                $subjectGradesData[$subj] = [];
                $availableSubjects[] = $subj;
            }
            $percentage = $row['max_score'] > 0 ? ($row['score'] / $row['max_score']) * 100 : 0;
            $subjectGradesData[$subj][] = [
                "activity" => substr($row['title'], 0, 10) . '...',
                "grade" => round($percentage, 1)
            ];
        }

        // 4. LATE VS ON TIME SUBMISSIONS (Logic handles allowed late passes)
        $stmtSubmissions = $pdo->prepare("
            SELECT s.subject_code, 
                   SUM(CASE WHEN sas.status = 'Graded' THEN 1 ELSE 0 END) as on_time,
                   SUM(CASE WHEN sas.status = 'Late' THEN 1 ELSE 0 END) as late
            FROM student_activity_scores sas
            JOIN activities a ON sas.activity_id = a.id
            JOIN class_assignments ca ON a.class_id = ca.id
            JOIN subjects s ON ca.subject_id = s.id
            WHERE sas.student_id = :sid
            GROUP BY s.subject_code
        ");
        $stmtSubmissions->execute(['sid' => $studentId]);
        $submissionData = [];
        while ($row = $stmtSubmissions->fetch(PDO::FETCH_ASSOC)) {
            $total = $row['on_time'] + $row['late'];
            // Kapag total ay 0 (e.g. puro missed), hindi lalabas sa chart
            if ($total > 0) {
                $submissionData[] = [
                    "subject" => $row['subject_code'],
                    "onTime" => round(($row['on_time'] / $total) * 100),
                    "late" => round(($row['late'] / $total) * 100)
                ];
            }
        }

        // 5. WEEKLY TIME DISTRIBUTION (100% REAL DATA from lms_daily_usage)
        // A. Gumawa ng blankong array para sa huling 7 araw (kasama ngayon)
        $timeSpentMap = [];
        for ($i = 6; $i >= 0; $i--) {
            $dateStr = date('Y-m-d', strtotime("-$i days"));
            $dayName = date('D', strtotime("-$i days")); // Ex: "Sun", "Mon"
            $timeSpentMap[$dateStr] = [
                "day" => $dayName,
                "minutes" => 0 // Default ay 0 kung hindi siya nag-log in nung araw na yun
            ];
        }

        // B. Kunin ang totoong records mula sa database
        $stmtUsage = $pdo->prepare("
            SELECT usage_date, minutes_spent 
            FROM lms_daily_usage 
            WHERE student_id = :sid AND usage_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        ");
        $stmtUsage->execute(['sid' => $studentId]);

        // C. I-fill ang array natin gamit ang totoong minutes
        while ($row = $stmtUsage->fetch(PDO::FETCH_ASSOC)) {
            $uDate = $row['usage_date'];
            if (isset($timeSpentMap[$uDate])) {
                $timeSpentMap[$uDate]['minutes'] = (int) $row['minutes_spent'];
            }
        }

        // D. I-convert pabalik sa list (array format na naiintindihan ng React Recharts)
        $timeSpentData = array_values($timeSpentMap);

        // 6. I-RETURN ANG LAHAT NG DATA
        echo json_encode([
            "status" => "success",
            "stats" => [
                "gwa" => $gwa,
                "total_minutes" => $totalMins,
                "completed_tasks" => array_sum(array_column($submissionData, 'on_time')) + array_sum(array_column($submissionData, 'late'))
            ],
            "overallGrades" => $overallGrades,
            "subjectGrades" => $subjectGradesData,
            "availableSubjects" => array_unique($availableSubjects),
            "submissionData" => $submissionData,
            "timeSpent" => $timeSpentData
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing student_id parameter"]);
}
?>