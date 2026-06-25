<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once '../../db_connect.php';

// Đây là trang khách hàng được VNPAY redirect về sau khi thanh toán xong
$vnp_HashSecret = "70OHR4ORAV8QIP8YG2LK9KMCYDM9R111"; 

$vnp_SecureHash = $_GET['vnp_SecureHash'];
$inputData = array();
foreach ($_GET as $key => $value) {
    if (substr($key, 0, 4) == "vnp_") {
        $inputData[$key] = $value;
    }
}
unset($inputData['vnp_SecureHash']);
ksort($inputData);
$i = 0;
$hashData = "";
foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
}
$secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

$orderId = $_GET['vnp_TxnRef'];

if ($secureHash == $vnp_SecureHash) {
    if ($_GET['vnp_ResponseCode'] == '00') {
        // Cập nhật trạng thái thành công
        $conn->query("UPDATE orders SET status = 'processing' WHERE id = $orderId");
        
        // Trừ tồn kho
        $items = $conn->query("SELECT product_id, quantity FROM order_items WHERE order_id = $orderId");
        while($row = $items->fetch_assoc()) {
            $pid = $row['product_id']; $qty = $row['quantity'];
            $conn->query("UPDATE products SET stock = stock - $qty WHERE id = $pid");
        }

        echo "<h2>Giao dịch thành công! Đơn hàng đã được ghi nhận.</h2>";
        echo "<a href='../../index.html'>Quay về trang chủ</a>";
        echo "<script>localStorage.removeItem('phone_cart');</script>"; // Xóa giỏ hàng
    } else {
        $conn->query("UPDATE orders SET status = 'cancelled' WHERE id = $orderId");
        echo "<h2>Giao dịch bị hủy hoặc thất bại!</h2>";
        echo "<a href='../../index.html'>Quay về trang chủ</a>";
    }
} else {
    // Chữ ký không hợp lệ
    echo "<h2>Lỗi chữ ký bảo mật VNPAY!</h2>";
    echo "<a href='../../index.html'>Quay về trang chủ</a>";
}
?>
