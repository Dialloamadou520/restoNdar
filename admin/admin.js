// ===== Global State =====
let categories = [];
let dishes = [];
let orders = [];
let currentUser = null;

// ===== API Base URL =====
const API_BASE = '../api';

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', function() {
    initLogin();
    initNavigation();
    initForms();
    checkAuth();
});

// ===== Authentication =====
function checkAuth() {
    fetch(`${API_BASE}/auth.php?action=check`)
        .then(res => res.json())
        .then(data => {
            if (data.authenticated) {
                currentUser = data.user;
                showAdmin();
            } else {
                showLogin();
            }
        })
        .catch(() => showLogin());
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const res = await fetch(`${API_BASE}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            showAdmin();
        } else {
            errorEl.textContent = data.error || 'Erreur de connexion';
            errorEl.classList.add('show');
        }
    } catch (err) {
        errorEl.textContent = 'Erreur de connexion au serveur';
        errorEl.classList.add('show');
    }
}

function handleLogout() {
    fetch(`${API_BASE}/auth.php?action=logout`)
        .then(() => {
            currentUser = null;
            showLogin();
        });
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminWrapper').style.display = 'none';
}

function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminWrapper').style.display = 'flex';
    
    if (currentUser) {
        document.getElementById('adminName').textContent = currentUser.name || currentUser.username;
    }
    
    loadAllData();
    startOrdersPolling();
}

// ===== Data Loading =====
async function loadAllData() {
    await Promise.all([
        loadCategories(),
        loadDishes(),
        loadOrders()
    ]);
    updateDashboard();
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/dishes.php?action=categories`);
        const data = await res.json();
        if (data.success) {
            categories = data.data;
            renderCategories();
            populateCategorySelects();
        }
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

async function loadDishes() {
    try {
        const res = await fetch(`${API_BASE}/dishes.php`);
        const data = await res.json();
        if (data.success) {
            dishes = data.data;
            renderDishes();
        }
    } catch (err) {
        console.error('Error loading dishes:', err);
    }
}

async function loadOrders() {
    try {
        const status = document.getElementById('orderStatusFilter')?.value || 'all';
        const date = document.getElementById('orderDateFilter')?.value || '';
        
        let url = `${API_BASE}/orders.php`;
        const params = new URLSearchParams();
        if (status !== 'all') params.append('status', status);
        if (date) params.append('date', date);
        if (params.toString()) url += '?' + params.toString();
        
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            orders = data.data;
            renderOrders();
            updatePendingBadge();
        }
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

function refreshData() {
    loadAllData();
    showToast('Données actualisées');
}

// ===== Orders Polling (Real-time) =====
let pollingInterval = null;

function startOrdersPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(() => {
        loadOrders();
    }, 30000); // Every 30 seconds
}

// ===== Navigation =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
        });
    });
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function showSection(sectionName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName + 'Section')?.classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Tableau de Bord',
        orders: 'Commandes',
        dishes: 'Plats',
        categories: 'Catégories'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || sectionName;
    
    // Close mobile menu
    document.querySelector('.sidebar')?.classList.remove('active');
}

// ===== Dashboard =====
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.created_at.startsWith(today));
    
    document.getElementById('todayOrders').textContent = todayOrders.length;
    document.getElementById('todayRevenue').textContent = 
        Math.round(todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)).toLocaleString('fr-FR') + ' FCFA';
    document.getElementById('pendingOrders').textContent = 
        orders.filter(o => o.status === 'pending').length;
    document.getElementById('totalDishes').textContent = dishes.length;
    
    // Recent orders
    const recentOrdersList = document.getElementById('recentOrdersList');
    if (recentOrdersList) {
        const recent = orders.slice(0, 5);
        recentOrdersList.innerHTML = recent.map(order => `
            <div class="order-item" onclick="viewOrder(${order.id})">
                <div class="order-info">
                    <div class="order-number">${order.order_number}</div>
                    <div class="order-customer">${order.customer_firstname} ${order.customer_lastname}</div>
                    <div class="order-time">${formatDateTime(order.created_at)}</div>
                </div>
                <span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span>
                <div class="order-total">${Math.round(parseFloat(order.total)).toLocaleString('fr-FR')} FCFA</div>
            </div>
        `).join('') || '<p style="text-align:center;color:#999">Aucune commande</p>';
    }
    
    // Popular dishes
    const popularDishesList = document.getElementById('popularDishesList');
    if (popularDishesList) {
        const popular = dishes.filter(d => d.is_popular).slice(0, 5);
        popularDishesList.innerHTML = popular.map(dish => `
            <div class="order-item">
                <img src="${dish.image_url}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">
                <div class="order-info">
                    <div class="order-number">${dish.name}</div>
                    <div class="order-customer">${dish.category_name}</div>
                </div>
                <div class="order-total">${Math.round(parseFloat(dish.price)).toLocaleString('fr-FR')} FCFA</div>
            </div>
        `).join('') || '<p style="text-align:center;color:#999">Aucun plat populaire</p>';
    }
}

function updatePendingBadge() {
    const pending = orders.filter(o => o.status === 'pending').length;
    document.getElementById('pendingOrdersBadge').textContent = pending;
}

// ===== Payment Helpers =====
function getPaymentLabel(method) {
    const labels = {
        'wave': 'Wave',
        'orange_money': 'Orange Money',
        'card': 'Carte Bancaire',
        'cash': 'Espèces'
    };
    return labels[method] || method;
}

function getPaymentIcon(method) {
    const icons = {
        'wave': 'fas fa-mobile-alt',
        'orange_money': 'fas fa-mobile-alt',
        'card': 'fas fa-credit-card',
        'cash': 'fas fa-money-bill-wave'
    };
    return icons[method] || 'fas fa-wallet';
}

// ===== Render Orders =====
function renderOrders() {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;
    
    grid.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-card-header">
                <h3>
                    <i class="fas fa-receipt"></i>
                    ${order.order_number}
                </h3>
                <span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span>
            </div>
            <div class="order-card-body">
                <div class="order-customer-info">
                    <p><i class="fas fa-user"></i> ${order.customer_firstname} ${order.customer_lastname}</p>
                    <p><i class="fas fa-phone"></i> ${order.customer_phone}</p>
                    <p><i class="fas fa-${order.delivery_type === 'delivery' ? 'motorcycle' : 'store'}"></i> 
                       ${order.delivery_type === 'delivery' ? 'Livraison' : 'Retrait sur place'}</p>
                    <p><i class="${getPaymentIcon(order.payment_method)}"></i> ${getPaymentLabel(order.payment_method)}</p>
                    <p><i class="fas fa-clock"></i> ${formatDateTime(order.created_at)}</p>
                </div>
                <div class="order-items-preview">
                    ${order.items.map(i => `${i.quantity}x ${i.dish_name}`).join(', ')}
                </div>
            </div>
            <div class="order-card-footer">
                <div class="order-card-total">${Math.round(parseFloat(order.total)).toLocaleString('fr-FR')} FCFA</div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                </div>
            </div>
        </div>
    `).join('') || '<p style="text-align:center;color:#999;grid-column:1/-1">Aucune commande</p>';
}

function filterOrders() {
    loadOrders();
}

// ===== View Order Detail =====
function viewOrder(orderId) {
    const order = orders.find(o => o.id == orderId);
    if (!order) return;
    
    const modalBody = document.getElementById('orderModalBody');
    modalBody.innerHTML = `
        <div class="order-detail">
            <div class="order-detail-header">
                <span class="order-detail-number">${order.order_number}</span>
                <span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span>
            </div>
            
            <div class="order-detail-section">
                <h4><i class="fas fa-user"></i> Client</h4>
                <div class="order-detail-info">
                    <p><i class="fas fa-user"></i> ${order.customer_firstname} ${order.customer_lastname}</p>
                    <p><i class="fas fa-phone"></i> ${order.customer_phone}</p>
                    <p><i class="fas fa-envelope"></i> ${order.customer_email}</p>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h4><i class="fas fa-${order.delivery_type === 'delivery' ? 'motorcycle' : 'store'}"></i> 
                    ${order.delivery_type === 'delivery' ? 'Livraison' : 'Retrait sur place'}</h4>
                ${order.delivery_type === 'delivery' ? `
                    <div class="order-detail-info">
                        <p><i class="fas fa-map-marker-alt"></i> ${order.address}</p>
                        <p><i class="fas fa-city"></i> ${order.postal_code} ${order.city}</p>
                        ${order.instructions ? `<p><i class="fas fa-sticky-note"></i> ${order.instructions}</p>` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="order-detail-section">
                <h4><i class="${getPaymentIcon(order.payment_method)}"></i> Paiement</h4>
                <div class="order-detail-info">
                    <p class="payment-badge payment-${order.payment_method}">
                        <i class="${getPaymentIcon(order.payment_method)}"></i> ${getPaymentLabel(order.payment_method)}
                    </p>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h4><i class="fas fa-utensils"></i> Articles commandés</h4>
                <div class="order-detail-items">
                    ${order.items.map(item => `
                        <div class="order-detail-item">
                            <span>${item.quantity}x ${item.dish_name}</span>
                            <span>${Math.round(parseFloat(item.total_price)).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    `).join('')}
                    <div class="order-detail-totals">
                        <div class="total-row">
                            <span>Sous-total</span>
                            <span>${Math.round(parseFloat(order.subtotal)).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div class="total-row">
                            <span>Livraison</span>
                            <span>${Math.round(parseFloat(order.delivery_fee)).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total</span>
                            <span>${Math.round(parseFloat(order.total)).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="order-detail-section">
                <h4><i class="fas fa-tasks"></i> Modifier le statut</h4>
                <div class="status-update">
                    <button class="status-btn ${order.status === 'pending' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'pending')">En attente</button>
                    <button class="status-btn ${order.status === 'confirmed' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'confirmed')">Confirmée</button>
                    <button class="status-btn ${order.status === 'preparing' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'preparing')">En préparation</button>
                    <button class="status-btn ${order.status === 'ready' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'ready')">Prête</button>
                    <button class="status-btn ${order.status === 'delivered' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'delivered')">Livrée</button>
                    <button class="status-btn ${order.status === 'cancelled' ? 'active' : ''}" 
                            onclick="updateOrderStatus(${order.id}, 'cancelled')">Annulée</button>
                </div>
            </div>
        </div>
    `;
    
    openModal('orderModal');
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_BASE}/orders.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: orderId, status })
        });
        
        const data = await res.json();
        if (data.success) {
            showToast(data.message);
            await loadOrders();
            updateDashboard();
            viewOrder(orderId); // Refresh modal
        } else {
            showToast(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur de connexion', 'error');
    }
}

// ===== Render Dishes =====
function renderDishes() {
    const grid = document.getElementById('dishesGrid');
    if (!grid) return;
    
    grid.innerHTML = dishes.map(dish => `
        <div class="dish-card ${!dish.is_available ? 'unavailable' : ''}">
            <div class="dish-card-image">
                <img src="${dish.image_url || 'https://via.placeholder.com/300x160?text=No+Image'}" alt="${dish.name}">
                <div class="dish-card-badges">
                    ${dish.is_popular ? '<span class="dish-badge badge-popular"><i class="fas fa-star"></i> Populaire</span>' : ''}
                    ${!dish.is_available ? '<span class="dish-badge badge-unavailable">Rupture</span>' : ''}
                </div>
            </div>
            <div class="dish-card-body">
                <h3>${dish.name}</h3>
                <p>${dish.description || 'Aucune description'}</p>
                <div class="dish-card-footer">
                    <span class="dish-price">${Math.round(parseFloat(dish.price)).toLocaleString('fr-FR')} FCFA</span>
                    <div class="dish-actions">
                        <button class="btn-icon btn-edit" title="Modifier" onclick="editDish(${dish.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-toggle" title="${dish.is_available ? 'Désactiver' : 'Activer'}" 
                                onclick="toggleDishAvailability(${dish.id})">
                            <i class="fas fa-${dish.is_available ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Supprimer" onclick="confirmDeleteDish(${dish.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('') || '<p style="text-align:center;color:#999;grid-column:1/-1">Aucun plat</p>';
}

function filterDishes() {
    const category = document.getElementById('dishCategoryFilter')?.value || 'all';
    const availability = document.getElementById('dishAvailabilityFilter')?.value || 'all';
    
    let filtered = [...dishes];
    
    if (category !== 'all') {
        filtered = filtered.filter(d => d.category_slug === category);
    }
    
    if (availability === 'available') {
        filtered = filtered.filter(d => d.is_available);
    } else if (availability === 'unavailable') {
        filtered = filtered.filter(d => !d.is_available);
    }
    
    const grid = document.getElementById('dishesGrid');
    const originalDishes = dishes;
    dishes = filtered;
    renderDishes();
    dishes = originalDishes;
}

function populateCategorySelects() {
    const selects = ['dishCategoryFilter', 'dishCategory'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        if (selectId === 'dishCategoryFilter') {
            select.innerHTML = '<option value="all">Toutes catégories</option>' +
                categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
        } else {
            select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    });
}

// ===== Dish CRUD =====
function openDishModal(dish = null) {
    document.getElementById('dishModalTitle').innerHTML = dish ? 
        '<i class="fas fa-hamburger"></i> Modifier le Plat' : 
        '<i class="fas fa-hamburger"></i> Ajouter un Plat';
    
    document.getElementById('dishId').value = dish?.id || '';
    document.getElementById('dishCategory').value = dish?.category_id || categories[0]?.id || '';
    document.getElementById('dishName').value = dish?.name || '';
    document.getElementById('dishDescription').value = dish?.description || '';
    document.getElementById('dishPrice').value = dish?.price || '';
    document.getElementById('dishImage').value = dish?.image_url || '';
    document.getElementById('dishAvailable').checked = dish ? dish.is_available : true;
    document.getElementById('dishPopular').checked = dish?.is_popular || false;
    
    openModal('dishModal');
}

function editDish(dishId) {
    const dish = dishes.find(d => d.id == dishId);
    if (dish) openDishModal(dish);
}

async function toggleDishAvailability(dishId) {
    try {
        const res = await fetch(`${API_BASE}/dishes.php?action=toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: dishId })
        });
        
        const data = await res.json();
        if (data.success) {
            showToast(data.message);
            await loadDishes();
            updateDashboard();
        } else {
            showToast(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur de connexion', 'error');
    }
}

function confirmDeleteDish(dishId) {
    const dish = dishes.find(d => d.id == dishId);
    document.getElementById('deleteMessage').textContent = 
        `Êtes-vous sûr de vouloir supprimer "${dish?.name}" ?`;
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteDish(dishId);
    openModal('deleteModal');
}

async function deleteDish(dishId) {
    try {
        const res = await fetch(`${API_BASE}/dishes.php?id=${dishId}`, {
            method: 'DELETE'
        });
        
        const data = await res.json();
        if (data.success) {
            showToast('Plat supprimé avec succès');
            closeModal('deleteModal');
            await loadDishes();
            updateDashboard();
        } else {
            showToast(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur de connexion', 'error');
    }
}

function initForms() {
    const dishForm = document.getElementById('dishForm');
    if (dishForm) {
        dishForm.addEventListener('submit', handleDishSubmit);
    }
}

async function handleDishSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('dishId').value;
    const dishData = {
        category_id: document.getElementById('dishCategory').value,
        name: document.getElementById('dishName').value,
        description: document.getElementById('dishDescription').value,
        price: document.getElementById('dishPrice').value,
        image_url: document.getElementById('dishImage').value,
        is_available: document.getElementById('dishAvailable').checked ? 1 : 0,
        is_popular: document.getElementById('dishPopular').checked ? 1 : 0
    };
    
    if (id) dishData.id = id;
    
    try {
        const res = await fetch(`${API_BASE}/dishes.php`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dishData)
        });
        
        const data = await res.json();
        if (data.success) {
            showToast(data.message);
            closeModal('dishModal');
            await loadDishes();
            updateDashboard();
        } else {
            showToast(data.error || 'Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur de connexion', 'error');
    }
}

// ===== Render Categories =====
function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(cat => {
        const dishCount = dishes.filter(d => d.category_id == cat.id).length;
        return `
            <div class="category-card">
                <div class="category-icon">
                    <i class="${cat.icon}"></i>
                </div>
                <div class="category-info">
                    <h3>${cat.name}</h3>
                    <p>${dishCount} plat${dishCount > 1 ? 's' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Modal Functions =====
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const msg = toast.querySelector('.toast-message');
    
    icon.className = 'toast-icon fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
    msg.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Utility Functions =====
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR') + ' ' + 
           date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status) {
    const labels = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        preparing: 'En préparation',
        ready: 'Prête',
        delivered: 'Livrée',
        cancelled: 'Annulée'
    };
    return labels[status] || status;
}
