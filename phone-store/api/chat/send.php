<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Auto-create messages table
$conn->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    message TEXT NOT NULL,
    from_role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $message = $conn->real_escape_string($data['message'] ?? '');
    
    // Admin gửi: to_user_id là user_id của khách hàng
    // Customer gửi: to_user_id = 0 (admin), from_user_id = user_id của mình

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'Chưa đăng nhập']);
        exit;
    }

    if (empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'Tin nhắn trống']);
        exit;
    }

    $fromUserId = intval($_SESSION['user_id']);
    $role = $_SESSION['role'] ?? 'customer';

    if ($role === 'admin') {
        // Admin gửi cho 1 user cụ thể
        $toUserId = intval($data['to_user_id'] ?? 0);
        $fromRole = 'admin';
    } else {
        // Customer gửi cho admin (to_user_id = 0 = admin)
        $toUserId = 0;
        $fromRole = 'customer';
    }

    $sql = "INSERT INTO messages (from_user_id, to_user_id, message, from_role) 
            VALUES ($fromUserId, $toUserId, '$message', '$fromRole')";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Lỗi lưu tin nhắn']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
}
?>
