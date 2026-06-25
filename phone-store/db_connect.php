<?php
// Cấu hình Database
$host = 'localhost';
$user = 'root';
$password = ''; // XAMPP mặc định không có mật khẩu
$dbname = 'phone_store';

// Bật hiển thị lỗi (dùng cho môi trường dev)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Tạo kết nối
$conn = new mysqli($host, $user, $password, $dbname);

// Kiểm tra kết nối
if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error', 
        'message' => 'Connection failed: ' . $conn->connect_error
    ]));
}

// Set charset utf8 để hiển thị tiếng Việt
$conn->set_charset("utf8mb4");

// Start session cho toàn bộ project
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
