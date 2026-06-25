<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

// Ensure table exists
$conn->query("CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $productId = intval($data['product_id'] ?? 0);
    $userName = $conn->real_escape_string($data['user_name'] ?? 'Khách');
    $rating = intval($data['rating'] ?? 5);
    $comment = $conn->real_escape_string($data['comment'] ?? '');

    if ($productId <= 0 || empty($comment)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng điền đủ thông tin']);
        exit;
    }

    $sql = "INSERT INTO reviews (product_id, user_name, rating, comment) VALUES ($productId, '$userName', $rating, '$comment')";
    
    if (@$conn->query($sql) === TRUE) {
        echo json_encode(['status' => 'success', 'message' => 'Đã gửi đánh giá']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Lỗi lưu đánh giá']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
}
?>
