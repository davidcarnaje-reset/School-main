<?php
header("Access-Control-Allow-Origin: *"); // Ito ang magbibigay ng permission sa AI
header("Access-Control-Allow-Methods: GET");

$file = isset($_GET['file']) ? basename($_GET['file']) : '';
// Tiyakin na tama ang path papunta sa requirements folder mo
$path = '../uploads/requirements/' . $file;

if (!empty($file) && file_exists($path)) {
    $mime = mime_content_type($path);
    header("Content-Type: " . $mime);
    readfile($path);
} else {
    http_response_code(404);
    echo "Image not found.";
}
?>