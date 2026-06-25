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

if (!isset($_GET['product_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing product_id']);
    exit;
}

$productId = intval($_GET['product_id']);

$sql = "SELECT * FROM reviews WHERE product_id = $productId ORDER BY id DESC";
$result = @$conn->query($sql);

$reviews = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $reviews[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $reviews]);
?>
