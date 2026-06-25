<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $conn->real_escape_string($data['username'] ?? '');
    $password = $conn->real_escape_string($data['password'] ?? '');
    $fullname = $conn->real_escape_string($data['full_name'] ?? '');

    if (empty($username) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng điền đủ thông tin']);
        exit;
    }

    // Check if exists
    $check = $conn->query("SELECT id FROM users WHERE username = '$username'");
    if($check->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Tên đăng nhập đã tồn tại']);
        exit;
    }

    $sql = "INSERT INTO users (username, password, full_name, role) VALUES ('$username', '$password', '$fullname', 'customer')";
    if($conn->query($sql)) {
        // Auto login
        $_SESSION['user_id'] = $conn->insert_id;
        $_SESSION['username'] = $username;
        $_SESSION['role'] = 'customer';
        $_SESSION['full_name'] = $fullname;
        
        echo json_encode(['status' => 'success', 'message' => 'Đăng ký thành công!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Lỗi DB']);
    }
}
?>
