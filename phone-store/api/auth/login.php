<?php
require_once '../../db_connect.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Nhận dữ liệu JSON từ frontend
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.']);
        exit;
    }

    // Escape để chống SQL Injection
    $username = $conn->real_escape_string($username);
    // Trong thực tế, phải dùng password_verify, nhưng ở đây dùng pass thẳng để demo dễ dàng
    $password = $conn->real_escape_string($password); 

    $sql = "SELECT id, username, full_name, role FROM users WHERE username = '$username' AND password = '$password'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Lưu session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        echo json_encode([
            'status' => 'success', 
            'message' => 'Đăng nhập thành công',
            'user' => [
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Tài khoản hoặc mật khẩu không chính xác.']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
$conn->close();
?>
