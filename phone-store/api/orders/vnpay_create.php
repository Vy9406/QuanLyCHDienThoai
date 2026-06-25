<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once '../../db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Save order as pending
    $customerName = $conn->real_escape_string($data['customer_name'] ?? '');
    $customerPhone = $conn->real_escape_string($data['customer_phone'] ?? '');
    $customerAddress = $conn->real_escape_string($data['customer_address'] ?? '');
    $totalAmount = $data['total_amount'] ?? 0;
    $discountApplied = $data['discount_applied'] ?? 0;
    $userId = $data['user_id'] ? intval($data['user_id']) : 'NULL';

    $sqlOrder = "INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, discount_applied, payment_method, status) 
                 VALUES ($userId, '$customerName', '$customerPhone', '$customerAddress', $totalAmount, $discountApplied, 'VNPAY', 'pending')";
    
    $conn->query($sqlOrder);
    $orderId = $conn->insert_id;

    foreach ($data['items'] as $item) {
        $productId = intval($item['id']);
        $qty = intval($item['quantity']);
        $price = $item['price'];
        $conn->query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($orderId, $productId, $qty, $price)");
    }

    // VNPAY Sandbox Config
    $vnp_TmnCode = "AB3LALK9"; 
    $vnp_HashSecret = "70OHR4ORAV8QIP8YG2LK9KMCYDM9R111"; 
    $vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    $vnp_Returnurl = "http://localhost/phone-store/api/orders/vnpay_return.php";

    $vnp_TxnRef = $orderId; 
    $vnp_OrderInfo = "Thanh toan don hang " . $orderId;
    $vnp_Amount = $totalAmount * 100;
    $vnp_IpAddr = $_SERVER['REMOTE_ADDR'];
    $startTime = date("YmdHis");
    $expire = date('YmdHis',strtotime('+15 minutes',strtotime($startTime)));

    $inputData = array(
        "vnp_Version" => "2.1.0",
        "vnp_TmnCode" => $vnp_TmnCode,
        "vnp_Amount" => $vnp_Amount,
        "vnp_Command" => "pay",
        "vnp_CreateDate" => $startTime,
        "vnp_CurrCode" => "VND",
        "vnp_IpAddr" => $vnp_IpAddr,
        "vnp_Locale" => "vn",
        "vnp_OrderInfo" => $vnp_OrderInfo,
        "vnp_OrderType" => "other",
        "vnp_ReturnUrl" => $vnp_Returnurl,
        "vnp_TxnRef" => $vnp_TxnRef,
        "vnp_ExpireDate" => $expire
    );

    ksort($inputData);
    $query = "";
    $i = 0;
    $hashdata = "";
    foreach ($inputData as $key => $value) {
        if ($i == 1) {
            $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
        } else {
            $hashdata .= urlencode($key) . "=" . urlencode($value);
            $i = 1;
        }
        $query .= urlencode($key) . "=" . urlencode($value) . '&';
    }

    $vnp_Url = $vnp_Url . "?" . $query;
    if (isset($vnp_HashSecret)) {
        $vnpSecureHash =   hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
    }

    echo json_encode(['status' => 'success', 'url' => $vnp_Url]);
}
?>
