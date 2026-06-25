<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Auto-create messages table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    message TEXT NOT NULL,
    from_role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Chưa đăng nhập']);
    exit;
}

$sessionUserId = intval($_SESSION['user_id']);
$role = $_SESSION['role'] ?? 'customer';

if ($role === 'admin') {
    // Admin xem hội thoại với 1 khách hàng cụ thể
    $withUserId = intval($_GET['user_id'] ?? 0);
    if (!$withUserId) {
        echo json_encode(['status' => 'error', 'message' => 'Thiếu user_id']);
        exit;
    }
    // Lấy tin nhắn: từ admin tới user đó, và từ user đó tới admin (to_user_id = 0)
    $sql = "SELECT m.*, u.full_name, u.username FROM messages m
            LEFT JOIN users u ON m.from_user_id = u.id
            WHERE (m.from_user_id = $withUserId AND m.to_user_id = 0)
               OR (m.from_user_id = $sessionUserId AND m.to_user_id = $withUserId AND m.from_role = 'admin')
            ORDER BY m.created_at ASC";
    
    // Đánh dấu đã đọc
    $conn->query("UPDATE messages SET is_read = 1 WHERE from_user_id = $withUserId AND to_user_id = 0 AND is_read = 0");
} else {
    // Customer xem hội thoại của mình với admin
    $sql = "SELECT m.*, u.full_name, u.username FROM messages m
            LEFT JOIN users u ON m.from_user_id = u.id
            WHERE (m.from_user_id = $sessionUserId AND m.to_user_id = 0)
               OR (m.to_user_id = $sessionUserId AND m.from_role = 'admin')
            ORDER BY m.created_at ASC";
    
    // Đánh dấu đã đọc các tin nhắn từ admin
    $conn->query("UPDATE messages SET is_read = 1 WHERE to_user_id = $sessionUserId AND from_role = 'admin' AND is_read = 0");
}

$result = $conn->query($sql);
$messages = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $messages]);
?>
