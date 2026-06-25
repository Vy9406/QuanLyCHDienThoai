window.checkAdminAuth = async () => {
    try {
        const res = await fetch('api/auth/check.php');
        const data = await res.json();
        if (!data.is_logged_in || data.user.role !== 'admin') {
            window.location.href = 'login.html';
        }
    } catch (e) { window.location.href = 'login.html'; }
};

window.logout = async () => {
    await fetch('api/auth/logout.php');
    window.location.href = 'login.html';
};

window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    if(tabId === 'products') loadAdminProducts();
    if(tabId === 'orders') loadAdminOrders();
    if(tabId === 'dashboard') loadDashboard();
    if(tabId === 'chat') loadAdminConversations();
};

let productsList = [];

window.loadAdminProducts = async () => {
    const res = await fetch('api/products/get.php');
    const data = await res.json();
    if (data.status === 'success') {
        productsList = data.data;
        const tbody = document.getElementById('admin-product-table');
        tbody.innerHTML = '';
        data.data.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="image_proxy.php?url=${encodeURIComponent(p.image)}" width="50" height="50" style="object-fit:contain" onerror="this.src='https://placehold.co/50x50/1c1c1e/ffffff?text=IMG'"></td>
                    <td>${p.name}</td>
                    <td>${formatCurrency(p.price)}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button class="btn btn-primary" onclick="editProduct(${p.id})">Sửa</button>
                        <button class="btn" style="background:red;color:white" onclick="deleteProduct(${p.id})">Xóa</button>
                    </td>
                </tr>
            `;
        });
    }
};

window.openProductModal = () => {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '0';
    document.getElementById('modal-title').innerText = 'Thêm Sản Phẩm';
    document.getElementById('product-modal').style.display = 'flex';
};

window.editProduct = (id) => {
    const p = productsList.find(x => x.id == id);
    if(!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-brand').value = p.brand;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-image-url').value = p.image;
    document.getElementById('prod-desc').value = p.description;
    
    document.getElementById('modal-title').innerText = 'Sửa Sản Phẩm';
    document.getElementById('product-modal').style.display = 'flex';
};

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('prod-name').value);
    formData.append('brand', document.getElementById('prod-brand').value);
    formData.append('price', document.getElementById('prod-price').value);
    formData.append('stock', document.getElementById('prod-stock').value);
    formData.append('description', document.getElementById('prod-desc').value);
    
    const fileInput = document.getElementById('prod-image-file');
    if(fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    } else {
        formData.append('image_url', document.getElementById('prod-image-url').value);
    }

    const endpoint = id == 0 ? 'api/products/add.php' : 'api/products/update.php';
    if(id != 0) formData.append('id', id);
    
    // existing_image is needed for update fallback
    if(id != 0) formData.append('existing_image', document.getElementById('prod-image-url').value);

    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json();
    if(data.status === 'success') {
        showToast('Lưu thành công');
        document.getElementById('product-modal').style.display = 'none';
        loadAdminProducts();
    } else { alert(data.message); }
});

window.deleteProduct = async (id) => {
    if(!confirm('Chắc chắn xóa?')) return;
    const res = await fetch('api/products/delete.php', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id})
    });
    const data = await res.json();
    if(data.status === 'success') {
        showToast('Đã xóa'); loadAdminProducts();
    }
};

window.loadAdminOrders = async () => {
    const res = await fetch('api/orders/get.php');
    const data = await res.json();
    if (data.status === 'success') {
        const tbody = document.getElementById('admin-orders-table');
        tbody.innerHTML = '';
        data.data.forEach(o => {
            const statusColor = o.status === 'completed' ? 'green' : (o.status === 'pending' ? 'orange' : 'var(--primary)');
            tbody.innerHTML += `
                <tr>
                    <td>#${o.id}</td>
                    <td>${o.customer_name}</td>
                    <td>${o.customer_phone}</td>
                    <td>${formatCurrency(o.total_amount)}</td>
                    <td>${o.payment_method}</td>
                    <td><strong style="color:${statusColor}">${o.status.toUpperCase()}</strong></td>
                    <td>
                        <select onchange="updateOrderStatus(${o.id}, this.value)">
                            <option value="">Đổi trạng thái...</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipping">Shipping</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button class="btn" style="padding:2px 5px; font-size:0.8em; background:#ff3b30; color:white; border:none;" onclick="exportPDF(${o.id})">Xuất PDF</button>
                    </td>
                </tr>
            `;
        });
    }
};

window.updateOrderStatus = async (id, status) => {
    if(!status) return;
    const res = await fetch('api/orders/update_status.php', {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id, status})
    });
    const data = await res.json();
    if(data.status === 'success') {
        showToast('Cập nhật thành công');
        loadAdminOrders();
        loadDashboard(); // Refresh chart
    }
};

let chartInstance = null;
window.loadDashboard = async () => {
    const res = await fetch('api/orders/get.php');
    const data = await res.json();
    if (data.status === 'success') {
        const orders = data.data;
        document.getElementById('total-orders-count').innerText = orders.length;
        const totalRev = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
        document.getElementById('total-revenue').innerText = formatCurrency(totalRev);

        // Prepare chart data (Group by date)
        const dateMap = {};
        orders.forEach(o => {
            const date = o.created_at.split(' ')[0];
            if(!dateMap[date]) dateMap[date] = 0;
            dateMap[date] += parseFloat(o.total_amount);
        });
        const labels = Object.keys(dateMap).sort();
        const chartData = labels.map(l => dateMap[l]);

        const ctx = document.getElementById('revenueChart').getContext('2d');
        if(chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Doanh thu theo ngày (VND)',
                    data: chartData,
                    borderColor: '#0a84ff',
                    backgroundColor: 'rgba(10, 132, 255, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true }
        });
    }
};

window.exportPDF = (orderId) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Tìm thông tin đơn hàng
    const o = productsList.length ? null : null; // Hack: Lấy dữ liệu từ bảng UI vì lười gọi thêm API lấy detail
    const row = Array.from(document.querySelectorAll('#admin-orders-table tr')).find(tr => tr.innerText.includes('#' + orderId));
    if(!row) return;

    doc.setFontSize(22);
    doc.setTextColor(10, 132, 255);
    doc.text("HOA DON MUA HANG - PHONE STORE", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Ma Don Hang: #" + orderId, 20, 40);
    doc.text("Khach hang: " + row.children[1].innerText, 20, 50);
    doc.text("Dien thoai: " + row.children[2].innerText, 20, 60);
    doc.text("Trang thai: " + row.children[5].innerText, 20, 70);
    doc.text("Phuong thuc: " + row.children[4].innerText, 20, 80);

    doc.setLineWidth(0.5);
    doc.line(20, 90, 190, 90);
    
    doc.setFontSize(16);
    doc.text("Tong thanh toan: " + row.children[3].innerText, 20, 110);
    
    doc.setFontSize(10);
    doc.text("Cam on quy khach da mua sam tai Phone Store!", 20, 130);
    
    doc.save("HoaDon_" + orderId + ".pdf");
    if(typeof showToast === 'function') {
        showToast('Tải PDF thành công!');
    } else {
        alert('Tải PDF thành công!');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.checkAdminAuth().then(() => { 
        window.loadDashboard(); 
        window.loadAdminProducts(); // Pre-load products for PDF
        startAdminChatPolling();
    });
});

// ==========================================
// ADMIN CHAT LOGIC
// ==========================================
let currentChatUserId = null;
let adminChatPolling = null;

const loadAdminConversations = async () => {
    try {
        const res = await fetch('api/chat/conversations.php');
        const data = await res.json();
        const container = document.getElementById('conv-items');
        if (!container) return;
        
        if (data.status === 'success') {
            let totalUnread = 0;
            if (data.data.length === 0) {
                container.innerHTML = '<p style="padding:15px; color:#888; font-size:0.85rem;">Chưa có tin nhắn nào.</p>';
            } else {
                let html = '';
                data.data.forEach(c => {
                    const unread = parseInt(c.unread_count || 0);
                    totalUnread += unread;
                    const isActive = currentChatUserId === parseInt(c.user_id);
                    html += `
                    <div onclick="openAdminChat(${c.user_id}, '${c.full_name || c.username}')"
                         style="padding:12px 15px; cursor:pointer; border-bottom:1px solid var(--border-color); background:${isActive ? 'rgba(10,132,255,0.1)' : 'transparent'}; transition:background 0.2s;"
                         onmouseover="this.style.background='rgba(10,132,255,0.08)'" 
                         onmouseout="this.style.background='${isActive ? 'rgba(10,132,255,0.1)' : 'transparent'}'">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="font-size:0.9rem;">${c.full_name || c.username}</strong>
                            ${unread > 0 ? `<span style="background:red; color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem;">${unread}</span>` : ''}
                        </div>
                        <div style="font-size:0.78rem; color:#888; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.last_message || ''}</div>
                    </div>`;
                });
                container.innerHTML = html;
            }
            // Cập nhật badge trên menu
            const badge = document.getElementById('admin-chat-badge');
            if (badge) {
                badge.style.display = totalUnread > 0 ? 'inline' : 'none';
                badge.innerText = totalUnread;
            }
        }
    } catch(e) {}
};

window.openAdminChat = async (userId, name) => {
    currentChatUserId = parseInt(userId);
    const header = document.getElementById('admin-chat-header');
    if (header) header.innerText = `💬 ${name}`;
    await loadAdminChatMessages();
    // Re-render conversations to update active state
    loadAdminConversations();
};

const loadAdminChatMessages = async () => {
    if (!currentChatUserId) return;
    try {
        const res = await fetch(`api/chat/get.php?user_id=${currentChatUserId}`);
        const data = await res.json();
        const body = document.getElementById('admin-chat-body');
        if (!body) return;
        if (data.status === 'success') {
            if (data.data.length === 0) {
                body.innerHTML = '<p style="color:#888; text-align:center; margin-top:30px;">Chưa có tin nhắn nào.</p>';
                return;
            }
            let html = '';
            data.data.forEach(m => {
                const isMine = m.from_role === 'admin';
                const senderName = isMine ? 'Admin' : (m.full_name || m.username || 'Khách');
                const time = new Date(m.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
                html += `
                <div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin-bottom:12px;">
                    <div style="max-width:75%; padding:10px 14px; border-radius:15px; background:${isMine ? '#0a84ff' : '#2c2c2e'}; color:white; font-size:0.88rem; border-bottom-${isMine ? 'right' : 'left'}-radius:4px;">
                        ${m.message}
                    </div>
                    <div style="font-size:0.7rem; color:#888; margin-top:3px;">${senderName} • ${time}</div>
                </div>`;
            });
            body.innerHTML = html;
            body.scrollTop = body.scrollHeight;
        }
    } catch(e) {}
};

window.adminSendMessage = async () => {
    if (!currentChatUserId) { alert('Vui lòng chọn một cuộc hội thoại trước!'); return; }
    const input = document.getElementById('admin-chat-input');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;
    input.value = '';
    try {
        const res = await fetch('api/chat/send.php', {
            method: 'POST',
            body: JSON.stringify({ message: msg, to_user_id: currentChatUserId })
        });
        const data = await res.json();
        if (data.status === 'success') {
            loadAdminChatMessages();
            loadAdminConversations();
        }
    } catch(e) { alert('Lỗi gửi tin nhắn!'); }
};

const startAdminChatPolling = () => {
    if (adminChatPolling) return;
    adminChatPolling = setInterval(() => {
        loadAdminConversations();
        if (currentChatUserId) loadAdminChatMessages();
    }, 5000);
};
