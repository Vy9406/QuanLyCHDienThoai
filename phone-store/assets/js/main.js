// ... (Keep existing cart logic and formatting)
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const showToast = (message) => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
};

let cart = JSON.parse(localStorage.getItem('phone_cart')) || [];
let currentTotal = 0;
let discountPercent = 0;

const saveCart = () => { localStorage.setItem('phone_cart', JSON.stringify(cart)); updateCartCount(); };
const updateCartCount = () => { const badge = document.getElementById('cart-badge'); if (badge) badge.innerText = cart.reduce((total, item) => total + item.quantity, 0); };

window.addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) { showToast('Đã đạt giới hạn tồn kho!'); return; }
        existing.quantity += 1;
    } else {
        if (product.stock <= 0) return;
        cart.push({ ...product, quantity: 1, selected: true });
    }
    saveCart();
    showToast('Đã thêm vào giỏ hàng');
};

let allProducts = [];
const loadProducts = async () => {
    try {
        await fetch('copy_local_images.php');
        await fetch('cleanup_products.php'); // Clean up 404 products
        const res = await fetch('api/products/get.php');
        const data = await res.json();
        if (data.status === 'success') {
            allProducts = data.data;
            renderProducts(allProducts);
        }
    } catch (e) { console.error(e); }
};

const renderProducts = (products) => {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Randomly pick 4 products for sale
    const saleIds = [];
    if(products.length >= 4) {
        let temp = [...products].sort(() => 0.5 - Math.random());
        saleIds.push(...temp.slice(0, 4).map(p => p.id));
    }

    products.forEach(p => {
        const isOutOfStock = p.stock <= 0;
        const isSale = saleIds.includes(p.id);
        const card = document.createElement('div');
        card.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
        
        let priceHtml = `<p class="product-price">${formatCurrency(p.price)}</p>`;
        let clonedP = {...p};
        if (isSale) {
            priceHtml = `<p class="product-price"><span style="text-decoration:line-through; color:gray; font-size:0.8rem">${formatCurrency(p.price)}</span> ${formatCurrency(p.price * 0.85)}</p>`;
            clonedP.price = p.price * 0.85; // Discounted price for cart
        }

        card.innerHTML = `
            ${isSale ? `<div class="sale-badge">-15%</div>` : ''}
            <img src="image_proxy.php?url=${encodeURIComponent(p.image)}" alt="${p.name}" class="product-img" onerror="this.src='https://placehold.co/600x600/1c1c1e/ffffff?text=No+Image'" onclick="window.openProductDetail('${encodeURIComponent(JSON.stringify(clonedP))}')" style="cursor:pointer">
            <h3 class="product-title" onclick="window.openProductDetail('${encodeURIComponent(JSON.stringify(clonedP))}')" style="cursor:pointer">${p.name}</h3>
            ${priceHtml}
            ${isSale ? `<div class="sale-progress-container"><div class="sale-progress-bar"></div><div class="sale-progress-text">Đã bán 85%</div></div>` : ''}
            <button class="btn btn-primary" style="width:100%; margin-top:10px;" onclick='addToCart(${JSON.stringify(clonedP).replace(/'/g, "\\'")})'>Thêm vào giỏ</button>
        `;
        grid.appendChild(card);
    });
    
    // Initialize 3D Hover Effect
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        });
    });
};

const renderCartItems = () => {
    const itemsContainer = document.getElementById('cart-items');
    if (!itemsContainer) return;
    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p>Giỏ hàng trống.</p>';
        document.getElementById('checkout-total').innerText = 'Tổng: 0đ';
        return;
    }
    let html = '';
    cart.forEach((item, index) => {
        const isChecked = item.selected !== false ? 'checked' : '';
        html += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding:15px 0;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <input type="checkbox" style="width:20px; height:20px; cursor:pointer;" ${isChecked} onchange="toggleSelectCartItem(${index})">
                    <img src="image_proxy.php?url=${encodeURIComponent(item.image)}" style="width:60px; height:60px; object-fit:contain;" onerror="this.src='https://placehold.co/600x600/1c1c1e/ffffff?text=IMG'">
                    <div>
                        <h4 style="font-size:1.1rem">${item.name}</h4>
                        <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                            <span style="color:var(--text-muted)">${formatCurrency(item.price)}</span>
                            <div style="display:flex; align-items:center; border:1px solid var(--border-color); border-radius:5px; overflow:hidden;">
                                <button type="button" style="padding:2px 8px; border:none; background:var(--bg-color); cursor:pointer;" onclick="updateCartQuantity(${index}, -1)">-</button>
                                <span style="padding:0 10px; font-size:0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
                                <button type="button" style="padding:2px 8px; border:none; background:var(--bg-color); cursor:pointer;" onclick="updateCartQuantity(${index}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn" style="padding: 6px 12px; font-size:0.85em; background:rgba(255,0,0,0.1); color:red; border:none;" onclick="removeFromCart(${index})">Xóa</button>
            </div>
        `;
    });
    itemsContainer.innerHTML = html;
    updateTotalDisplay();
};

window.toggleSelectCartItem = (index) => {
    if (cart[index]) {
        cart[index].selected = cart[index].selected === false ? true : false;
        saveCart();
        updateTotalDisplay();
    }
};

window.updateCartQuantity = (index, delta) => {
    if (cart[index]) {
        const newQty = cart[index].quantity + delta;
        if (newQty < 1) {
            removeFromCart(index);
            return;
        }
        if (newQty > cart[index].stock) {
            showToast('Đã đạt giới hạn tồn kho!');
            return;
        }
        cart[index].quantity = newQty;
        saveCart();
        renderCartItems();
    }
};

window.removeFromCart = (index) => { cart.splice(index, 1); saveCart(); renderCartItems(); };

const updateTotalDisplay = () => {
    currentTotal = cart.reduce((total, item) => item.selected !== false ? total + (item.price * item.quantity) : total, 0);
    const discountAmount = (currentTotal * discountPercent) / 100;
    const finalTotal = currentTotal - discountAmount;
    const totalEl = document.getElementById('checkout-total');
    if(!totalEl) return;
    let text = `Tổng: ${formatCurrency(currentTotal)}`;
    if (discountPercent > 0) {
        text = `Tổng: ${formatCurrency(currentTotal)} <br>
                <span style="font-size:1.2rem; color:green">Giảm ${discountPercent}%: -${formatCurrency(discountAmount)}</span><br>
                <span style="color:var(--primary); font-size:2.5rem; font-weight:800;">Thanh toán: ${formatCurrency(finalTotal)}</span>`;
    }
    totalEl.innerHTML = text;
};

window.applyCoupon = async () => {
    const code = document.getElementById('coupon-code').value;
    if(!code) return;
    try {
        const res = await fetch('api/coupons/check.php', { method: 'POST', body: JSON.stringify({code}) });
        const data = await res.json();
        const msgEl = document.getElementById('coupon-msg');
        if(data.status === 'success') {
            discountPercent = data.discount_percent;
            msgEl.innerText = data.message; msgEl.style.color = 'green';
        } else {
            discountPercent = 0;
            msgEl.innerText = data.message; msgEl.style.color = 'red';
        }
        updateTotalDisplay();
    } catch(e) { console.error(e); }
};

// --- AUTH LOGIC ---
let isRegisterMode = false;
let currentUser = null;

window.toggleAuthMode = () => {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Khách Hàng';
    document.getElementById('auth-submit-btn').innerText = isRegisterMode ? 'Đăng Ký' : 'Đăng Nhập';
    document.getElementById('auth-fullname-group').style.display = isRegisterMode ? 'block' : 'none';
    document.getElementById('auth-toggle-link').innerText = isRegisterMode ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay';
};

window.checkCustomerAuth = async () => {
    try {
        const res = await fetch('api/auth/check.php', { cache: 'no-store' });
        const data = await res.json();
        if (data.is_logged_in) {
            currentUser = data.user;
            const loginBtn = document.getElementById('login-btn');
            if(loginBtn) loginBtn.style.display = 'none';
            const userProfile = document.getElementById('user-profile');
            if(userProfile) userProfile.style.display = 'flex';
            const userGreeting = document.getElementById('user-greeting');
            if(userGreeting) userGreeting.innerText = `Xin chào, ${currentUser.full_name || currentUser.username}`;
            
            // Auto-fill checkout form if open
            const custName = document.getElementById('cust-name');
            if(custName) custName.value = currentUser.full_name || currentUser.username;

            // Hiện nút Chat với Shop
            const supportBtn = document.getElementById('support-chat-btn');
            if(supportBtn) supportBtn.style.display = 'block';
            // Bắt đầu polling tin nhắn mới mỗi 5 giây
            startSupportPolling();
        } else {
            // Logout state
            const loginBtn = document.getElementById('login-btn');
            if(loginBtn) loginBtn.style.display = 'inline-block';
            const userProfile = document.getElementById('user-profile');
            if(userProfile) userProfile.style.display = 'none';
        }
    } catch(e){}
};

let currentDetailProductId = null;
let currentReviewRating = 5;

// ==========================================
// SUPPORT CHAT LOGIC (User <-> Admin)
// ==========================================
let supportPollingInterval = null;
let lastSupportMessageCount = 0;

window.toggleSupportChat = () => {
    const w = document.getElementById('support-chat-window');
    const isOpen = w.style.display !== 'none' && w.style.display !== '';
    w.style.display = isOpen ? 'none' : 'flex';
    w.style.flexDirection = 'column';
    if (!isOpen) { loadSupportMessages(true); }
};

const renderSupportMessages = (messages) => {
    const body = document.getElementById('support-chat-body');
    if (!body) return;
    if (messages.length === 0) {
        body.innerHTML = '<p style="color:#888; text-align:center; margin-top:20px; font-size:0.85rem;">Chưa có tin nhắn nào.<br>Hãy đặt câu hỏi cho shop nhé!</p>';
        return;
    }
    let html = '';
    messages.forEach(m => {
        const isMine = m.from_role === 'customer';
        const senderName = isMine ? 'Bạn' : 'Shop';
        const time = new Date(m.created_at).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
        html += `
        <div class="support-msg ${isMine ? 'mine' : 'theirs'}">
            <div class="bubble">${m.message}</div>
            <div class="meta">${senderName} • ${time}</div>
        </div>`;
    });
    body.innerHTML = html;
    body.scrollTop = body.scrollHeight;
};

const loadSupportMessages = async (scrollToBottom = false) => {
    try {
        const res = await fetch('api/chat/get.php');
        const data = await res.json();
        if (data.status === 'success') {
            renderSupportMessages(data.data);
            // Kiểm tra tin nhắn chưa đọc từ admin
            const unread = data.data.filter(m => m.from_role === 'admin' && m.is_read == 0).length;
            const badge = document.getElementById('support-unread-badge');
            if (badge) {
                if (unread > 0) {
                    badge.style.display = 'inline';
                    badge.innerText = unread;
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch(e) {}
};

const startSupportPolling = () => {
    if (supportPollingInterval) return;
    supportPollingInterval = setInterval(() => {
        loadSupportMessages();
    }, 4000);
};

window.sendSupportMessage = async () => {
    const input = document.getElementById('support-input');
    const msg = input ? input.value.trim() : '';
    if (!msg) return;
    input.value = '';
    try {
        const res = await fetch('api/chat/send.php', {
            method: 'POST',
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        if (data.status === 'success') {
            loadSupportMessages(true);
        }
    } catch(e) { alert('Lỗi gửi tin nhắn!'); }
};

window.openProductDetail = (pStr) => {
    const p = JSON.parse(decodeURIComponent(pStr));
    currentDetailProductId = p.id;
    document.getElementById('detail-img').src = 'image_proxy.php?url=' + encodeURIComponent(p.image);
    document.getElementById('detail-name').innerText = p.name;
    document.getElementById('detail-price').innerText = formatCurrency(p.price);
    
    document.getElementById('detail-add-btn').onclick = () => { addToCart(p); showToast('Đã thêm ' + p.name + ' vào giỏ!'); };
    document.getElementById('detail-buy-btn').onclick = () => { addToCart(p); document.getElementById('product-modal').style.display='none'; toggleCart(); };
    
    document.getElementById('product-modal').style.display = 'flex';
    
    // Load reviews
    loadReviews(p.id);
    
    // Reset form
    document.getElementById('review-comment').value = '';
    setReviewStars(5);
};

const loadReviews = async (productId) => {
    const list = document.getElementById('reviews-list');
    list.innerHTML = '<p style="color:var(--text-muted)">Đang tải bình luận...</p>';
    try {
        const res = await fetch(`api/reviews/get.php?product_id=${productId}`);
        const data = await res.json();
        if (data.status === 'success') {
            if (data.data.length === 0) {
                list.innerHTML = '<p style="color:var(--text-muted)">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>';
                return;
            }
            let html = '';
            data.data.forEach(r => {
                const starsHtml = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                html += `
                <div class="review-item">
                    <div class="review-header">
                        <strong>${r.user_name}</strong>
                        <span class="review-time">${new Date(r.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="review-stars">${starsHtml}</div>
                    <p style="margin-top:8px;">${r.comment}</p>
                </div>
                `;
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = '<p style="color:red">Lỗi tải bình luận.</p>';
        }
    } catch(e) {
        list.innerHTML = '<p style="color:red">Lỗi tải bình luận.</p>';
    }
};

const setReviewStars = (rating) => {
    currentReviewRating = rating;
    document.querySelectorAll('#review-stars span').forEach(star => {
        if (parseInt(star.dataset.value) <= rating) {
            star.classList.add('active');
            star.style.color = '#ffd700';
        } else {
            star.classList.remove('active');
            star.style.color = '#ccc';
        }
    });
};

window.logoutCustomer = async () => {
    await fetch('api/auth/logout.php');
    window.location.reload();
};

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); loadProducts(); window.checkCustomerAuth();

    // Star rating interaction
    const stars = document.querySelectorAll('#review-stars span');
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            setReviewStars(parseInt(e.target.dataset.value));
        });
    });

    // Submit review
    const submitBtn = document.getElementById('submit-review-btn');
    if(submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name = document.getElementById('review-name').value.trim();
            const comment = document.getElementById('review-comment').value.trim();
            if (!name || !comment) {
                alert('Vui lòng nhập tên và nội dung đánh giá!');
                return;
            }
            submitBtn.disabled = true;
            submitBtn.innerText = 'Đang gửi...';
            const payload = { product_id: currentDetailProductId, user_name: name, rating: currentReviewRating, comment: comment };
            try {
                const res = await fetch('api/reviews/add.php', { method: 'POST', body: JSON.stringify(payload) });
                const data = await res.json();
                if (data.status === 'success') {
                    document.getElementById('review-comment').value = '';
                    loadReviews(currentDetailProductId);
                    showToast('Cảm ơn bạn đã đánh giá!');
                } else { alert(data.message); }
            } catch(e) { alert('Lỗi gửi đánh giá!'); }
            submitBtn.disabled = false;
            submitBtn.innerText = 'Gửi đánh giá';
        });
    }
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const target = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', (e) => renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()))));

    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => { document.getElementById('cart-modal').style.display = 'flex'; renderCartItems(); });

    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('auth-username').value;
            const p = document.getElementById('auth-password').value;
            const endpoint = isRegisterMode ? 'api/auth/register.php' : 'api/auth/login.php';
            const body = { username: u, password: p };
            if(isRegisterMode) body.full_name = document.getElementById('auth-fullname').value;
            
            const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
            const data = await res.json();
            if(data.status === 'success') {
                showToast(data.message);
                document.getElementById('login-modal').style.display = 'none';
                window.checkCustomerAuth();
            } else { alert(data.message); }
        });
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const checkoutItems = cart.filter(item => item.selected !== false);
            if(checkoutItems.length === 0) { showToast('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!'); return; }

            const payload = {
                user_id: currentUser ? currentUser.id : null,
                customer_name: document.getElementById('cust-name').value,
                customer_phone: document.getElementById('cust-phone').value,
                customer_address: document.getElementById('cust-address').value,
                payment_method: document.getElementById('payment-method').value,
                total_amount: currentTotal - (currentTotal * discountPercent / 100),
                discount_applied: currentTotal * discountPercent / 100,
                items: checkoutItems
            };

            if(payload.payment_method === 'VNPAY') {
                const res = await fetch('api/orders/vnpay_create.php', { method: 'POST', body: JSON.stringify(payload) });
                const data = await res.json();
                if(data.status === 'success') {
                    // Pre-remove items before redirecting, or keep them? 
                    // Better to keep them in cart and remove on return, but since we don't have a complex state machine,
                    // we will remove them now so they don't buy twice.
                    cart = cart.filter(item => item.selected === false);
                    saveCart();
                    window.location.href = data.url; 
                } else { alert('Lỗi tạo thanh toán VNPAY'); }
                return;
            }

            const res = await fetch('api/orders/place_order.php', { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            if(data.status === 'success') {
                document.getElementById('cart-modal').style.display = 'none';
                showToast('ĐẶT HÀNG THÀNH CÔNG! Đang chuyển hướng...');
                cart = cart.filter(item => item.selected === false);
                saveCart(); 
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else { alert('Lỗi: ' + data.message); }
        });
    }
});

// ==========================================
// ULTIMATE FEATURES JS LOGIC
// ==========================================

// --- Feature 1: AI Chatbot ---
window.toggleChat = () => {
    const w = document.getElementById('ai-chat-window');
    w.style.display = (w.style.display === 'flex') ? 'none' : 'flex';
};
window.aiAnswer = (step, answer) => {
    const body = document.getElementById('chat-body');
    const opts = document.getElementById(`chat-opts-${step}`);
    if (opts) opts.style.display = 'none';
    body.innerHTML += `<div class="chat-msg user-msg">${answer}</div>`;
    
    setTimeout(() => {
        if (step === 1) {
            window.aiBudget = answer;
            body.innerHTML += `<div class="chat-msg ai-msg">Tuyệt vời. Bạn chú trọng nhất vào điểm gì khi mua máy?</div>
                <div class="chat-options" id="chat-opts-2">
                    <button onclick="aiAnswer(2, 'Chụp ảnh đẹp')">Chụp ảnh đẹp</button>
                    <button onclick="aiAnswer(2, 'Chơi game mượt')">Chơi game mượt</button>
                    <button onclick="aiAnswer(2, 'Thiết kế sang trọng')">Thiết kế sang</button>
                </div>`;
        } else if (step === 2) {
            window.aiNeed = answer;
            body.innerHTML += `<div class="chat-msg ai-msg">Ghi nhận! Cuối cùng, bạn thích thương hiệu nào?</div>
                <div class="chat-options" id="chat-opts-3">
                    <button onclick="aiAnswer(3, 'Apple')">Apple</button>
                    <button onclick="aiAnswer(3, 'Samsung')">Samsung</button>
                    <button onclick="aiAnswer(3, 'Bất kỳ')">Bất kỳ</button>
                </div>`;
        } else if (step === 3) {
            window.aiBrand = answer;
            body.innerHTML += `<div class="chat-msg ai-msg">Đang phân tích dữ liệu...</div>`;
            setTimeout(() => { recommendProductsAI(); }, 1000);
        }
        body.scrollTop = body.scrollHeight;
    }, 500);
};

const recommendProductsAI = () => {
    const body = document.getElementById('chat-body');
    let filtered = allProducts;
    if (window.aiBrand !== 'Bất kỳ') {
        filtered = filtered.filter(p => p.brand === window.aiBrand);
    }
    if (filtered.length === 0) filtered = allProducts;
    const result = filtered.slice(0, 2);
    
    let html = `<div class="chat-msg ai-msg">Dựa trên yêu cầu của bạn, đây là những lựa chọn tuyệt vời nhất:</div>`;
    result.forEach(p => {
        html += `
        <div class="chat-product-recommendation">
            <img src="image_proxy.php?url=${encodeURIComponent(p.image)}" onerror="this.src='https://placehold.co/50x50'">
            <div>
                <div style="font-weight:bold; font-size:0.85rem">${p.name}</div>
                <div style="color:var(--primary); font-size:0.8rem">${formatCurrency(p.price)}</div>
                <button onclick='addToCart(${JSON.stringify(p).replace(/'/g, "\\'")})' style="font-size:0.7rem; padding:3px 8px; margin-top:5px; background:#0a84ff; color:white; border:none; border-radius:5px; cursor:pointer;">Mua ngay</button>
            </div>
        </div>`;
    });
    body.innerHTML += html;
    body.scrollTop = body.scrollHeight;
};

// --- Feature 2: Flash Sale & FOMO ---
const startFlashSaleTimer = () => {
    let timeLeft = 2 * 3600 + 45 * 60 + 30;
    const timerEl = document.getElementById('flash-timer');
    if (!timerEl) return;
    setInterval(() => {
        if(timeLeft <= 0) return;
        timeLeft--;
        const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
        const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerEl.innerHTML = `Kết thúc sau: <span>${h}</span>:<span>${m}</span>:<span>${s}</span>`;
    }, 1000);
};

// Init Extra Features
document.addEventListener('DOMContentLoaded', () => {
    startFlashSaleTimer();
});
