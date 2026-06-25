<?php
require_once '../../db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $customerName = $conn->real_escape_string($data['customer_name'] ?? '');
    $customerPhone = $conn->real_escape_string($data['customer_phone'] ?? '');
    $customerAddress = $conn->real_escape_string($data['customer_address'] ?? '');
    $totalAmount = $data['total_amount'] ?? 0;
    $discountApplied = $data['discount_applied'] ?? 0;
    $paymentMethod = $conn->real_escape_string($data['payment_method'] ?? 'COD');
    $cartItems = $data['items'] ?? [];
    // Lấy user_id từ session (nếu đã đăng nhập) hoặc từ body request
    $userId = 'NULL';
    if (isset($_SESSION['user_id']) && $_SESSION['user_id']) {
        $userId = intval($_SESSION['user_id']);
    } elseif (isset($data['user_id']) && $data['user_id']) {
        $userId = intval($data['user_id']);
    }

    if (empty($customerName) || empty($customerPhone) || empty($cartItems)) {
        echo json_encode(['status' => 'error', 'message' => 'Vui lòng điền đủ thông tin bắt buộc']);
        exit;
    }

    $conn->begin_transaction();

    try {
        // 1. Insert order (bao gồm user_id)
        $sqlOrder = "INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, discount_applied, payment_method) 
                     VALUES ($userId, '$customerName', '$customerPhone', '$customerAddress', $totalAmount, $discountApplied, '$paymentMethod')";
        
        $conn->query($sqlOrder);
        $orderId = $conn->insert_id;

        // 2. Insert order items & Update stock
        foreach ($cartItems as $item) {
            $productId = $item['id'];
            $qty = $item['quantity'];
            $price = $item['price'];

            // Check stock first
            $stockResult = $conn->query("SELECT stock FROM products WHERE id = $productId");
            $productRow = $stockResult->fetch_assoc();
            if ($productRow['stock'] < $qty) {
                throw new Exception("Sản phẩm ID $productId không đủ số lượng tồn kho");
            }

            // Insert item
            $sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price) 
                        VALUES ($orderId, $productId, $qty, $price)";
            $conn->query($sqlItem);

            // Deduct stock
            $conn->query("UPDATE products SET stock = stock - $qty WHERE id = $productId");
        }

        $conn->commit();
        echo json_encode(['status' => 'success', 'message' => 'Đặt hàng thành công!', 'order_id' => $orderId]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
