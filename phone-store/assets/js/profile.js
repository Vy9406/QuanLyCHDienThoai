const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const loadOrders = async () => {
    try {
        const res = await fetch('api/orders/get_user_orders.php');
        const data = await res.json();
        const list = document.getElementById('order-list');
        
        if (data.status === 'success') {
            if (data.data.length === 0) {
                list.innerHTML = '<p style="color:var(--text-muted);">Bạn chưa có đơn hàng nào.</p>';
                return;
            }
            let html = '';
            data.data.forEach(order => {
                const isDelivered = order.status === 'Đã giao' || false;
                html += `
                <div style="background:var(--card-bg); padding:20px; border-radius:10px; margin-bottom:20px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                        <strong style="font-size:1.2rem;">Đơn hàng #${order.id}</strong>
                        <span style="color: ${isDelivered ? '#4cd964' : '#ff9500'}; font-weight:bold;">${order.status || 'Đang giao hàng'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap: 15px;">
                        <div>
                            <p style="margin-bottom:5px;"><strong>Người nhận:</strong> ${order.customer_name} - ${order.customer_phone}</p>
                            <p style="margin-bottom:5px;"><strong>Địa chỉ:</strong> ${order.customer_address}</p>
                            <p style="margin-bottom:5px;"><strong>Phương thức:</strong> ${order.payment_method}</p>
                            <p style="margin-bottom:5px;"><strong>Tổng tiền:</strong> <span style="color:var(--primary); font-weight:bold;">${formatCurrency(order.total_amount)}</span></p>
                        </div>
                    </div>
                </div>
                `;
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = `<p style="color:red;">${data.message}</p>`;
        }
    } catch(e) {
        document.getElementById('order-list').innerHTML = '<p>Lỗi tải đơn hàng.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
