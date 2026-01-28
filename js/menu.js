// ===== Cart State =====
let cart = JSON.parse(localStorage.getItem('restondar_cart')) || [];
let dishes = [];
let categories = [];
let lastOrderData = null;

// ===== API Base URL =====
const API_BASE = 'api';

// ===== DOM Elements =====
const cartToggle = document.getElementById('cartToggle');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartCount = document.getElementById('cartCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const orderModal = document.getElementById('orderModal');
const closeModal = document.getElementById('closeModal');
const successModal = document.getElementById('successModal');
const orderForm = document.getElementById('orderForm');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
    updateCartUI();
    initEventListeners();
    initDeliveryToggle();
});

// ===== Demo Data (fallback when database not available) =====
const demoCategories = [
    { id: 1, name: 'Entrées', slug: 'entrees', icon: 'fas fa-leaf' },
    { id: 2, name: 'Plats', slug: 'plats', icon: 'fas fa-drumstick-bite' },
    { id: 3, name: 'Pizzas', slug: 'pizzas', icon: 'fas fa-pizza-slice' },
    { id: 4, name: 'Burgers', slug: 'burgers', icon: 'fas fa-hamburger' },
    { id: 5, name: 'Desserts', slug: 'desserts', icon: 'fas fa-ice-cream' },
    { id: 6, name: 'Boissons', slug: 'boissons', icon: 'fas fa-glass-cheers' }
];

const demoDishes = [
    { id: 1, name: 'Salade César', description: 'Laitue romaine, croûtons, parmesan', price: 3500, category_slug: 'entrees', category_name: 'Entrées', is_popular: true, image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400' },
    { id: 2, name: 'Poulet Yassa', description: 'Poulet mariné aux oignons et citron, riz', price: 4500, category_slug: 'plats', category_name: 'Plats', is_popular: true, image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400' },
    { id: 3, name: 'Thiéboudienne', description: 'Riz au poisson, légumes frais', price: 5000, category_slug: 'plats', category_name: 'Plats', is_popular: true, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' },
    { id: 4, name: 'Mafé Bœuf', description: 'Bœuf mijoté sauce arachide, riz', price: 5500, category_slug: 'plats', category_name: 'Plats', is_popular: true, image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400' },
    { id: 5, name: 'Pizza Margherita', description: 'Sauce tomate, mozzarella, basilic', price: 4500, category_slug: 'pizzas', category_name: 'Pizzas', is_popular: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { id: 6, name: 'Burger Classic', description: 'Steak haché, cheddar, salade, tomate', price: 3500, category_slug: 'burgers', category_name: 'Burgers', is_popular: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { id: 7, name: 'Burger Gourmet', description: 'Bœuf Angus, bacon, sauce maison', price: 4500, category_slug: 'burgers', category_name: 'Burgers', is_popular: true, image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400' },
    { id: 8, name: 'Tiramisu', description: 'Biscuits café, mascarpone, cacao', price: 2500, category_slug: 'desserts', category_name: 'Desserts', is_popular: true, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
    { id: 9, name: 'Jus de Bissap', description: 'Hibiscus frais, sucre, menthe', price: 1000, category_slug: 'boissons', category_name: 'Boissons', is_popular: true, image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },
    { id: 10, name: 'Café Touba', description: 'Café sénégalais épicé', price: 500, category_slug: 'boissons', category_name: 'Boissons', is_popular: false, image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400' }
];

// ===== Load Menu from API =====
async function loadMenu() {
    try {
        // Load categories
        const catRes = await fetch(`${API_BASE}/dishes.php?action=categories`);
        const catData = await catRes.json();
        if (catData.success) {
            categories = catData.data;
            renderCategoryFilters();
        } else {
            throw new Error('API error');
        }

        // Load dishes (only available)
        const dishRes = await fetch(`${API_BASE}/dishes.php?available=true`);
        const dishData = await dishRes.json();
        if (dishData.success) {
            dishes = dishData.data;
            renderDishes();
        } else {
            throw new Error('API error');
        }
    } catch (err) {
        console.warn('API unavailable, loading demo data:', err);
        // Use demo data as fallback
        categories = demoCategories;
        dishes = demoDishes;
        renderCategoryFilters();
        renderDishes();
        
        // Show info banner
        const menuSection = document.querySelector('.menu-section .container');
        if (menuSection && !document.getElementById('demoBanner')) {
            const banner = document.createElement('div');
            banner.id = 'demoBanner';
            banner.innerHTML = `
                <div style="background: linear-gradient(135deg, #ff9800, #ff5722); color: white; padding: 15px 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-info-circle"></i> <strong>Mode Démo</strong> - Importez la base de données pour activer toutes les fonctionnalités.
                </div>
            `;
            menuSection.insertBefore(banner, menuSection.firstChild);
        }
    }
}


// ===== Render Category Filters =====
function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    container.innerHTML = `
        <button class="filter-btn active" data-category="all">
            <i class="fas fa-th-large"></i> Tous
        </button>
        ${categories.map(cat => `
            <button class="filter-btn" data-category="${cat.slug}">
                <i class="${cat.icon}"></i> ${cat.name}
            </button>
        `).join('')}
    `;

    // Add click handlers
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterDishes(this.dataset.category);
        });
    });
}

// ===== Filter Dishes =====
function filterDishes(category) {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.classList.remove('hidden');
            item.style.animation = 'fadeInUp 0.5s ease';
        } else {
            item.classList.add('hidden');
        }
    });
}

// ===== Render Dishes =====
function renderDishes() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;

    if (dishes.length === 0) {
        grid.innerHTML = `
            <div class="no-dishes">
                <i class="fas fa-utensils"></i>
                <p>Aucun plat disponible pour le moment</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = dishes.map(dish => `
        <div class="menu-item" data-category="${dish.category_slug}" data-id="${dish.id}">
            <div class="item-image">
                <img src="${dish.image_url || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${dish.name}">
                <span class="item-category">${dish.category_name}</span>
                ${dish.is_popular ? '<span class="item-popular"><i class="fas fa-star"></i></span>' : ''}
            </div>
            <div class="item-content">
                <h3>${dish.name}</h3>
                <p>${dish.description || ''}</p>
                <div class="item-footer">
                    <span class="item-price">${formatPrice(dish.price)}</span>
                    <button class="btn-add-cart" onclick="addToCart(${dish.id})">
                        <i class="fas fa-plus"></i> Ajouter
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Delivery Toggle =====
function initDeliveryToggle() {
    const deliveryOptions = document.querySelectorAll('input[name="deliveryType"]');
    const deliveryAddress = document.getElementById('deliveryAddress');
    const deliveryFee = document.getElementById('deliveryFee');
    const summaryDelivery = document.getElementById('summaryDelivery');

    if (deliveryOptions.length > 0) {
        deliveryOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.value === 'delivery') {
                    if (deliveryAddress) deliveryAddress.style.display = 'block';
                    if (deliveryFee) deliveryFee.textContent = '1 000 FCFA';
                    if (summaryDelivery) summaryDelivery.textContent = '1 000 FCFA';
                } else {
                    if (deliveryAddress) deliveryAddress.style.display = 'none';
                    if (deliveryFee) deliveryFee.textContent = '0 FCFA';
                    if (summaryDelivery) summaryDelivery.textContent = '0 FCFA';
                }
                updateTotals();
            });
        });
    }
}

// ===== Event Listeners =====
function initEventListeners() {
    if (cartToggle) cartToggle.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openOrderModal);
    if (closeModal) closeModal.addEventListener('click', closeOrderModal);
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);

    // Mobile menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            if (!document.getElementById('mobile-menu-styles')) {
                const style = document.createElement('style');
                style.id = 'mobile-menu-styles';
                style.textContent = `
                    @media (max-width: 768px) {
                        .nav-links.active {
                            display: flex !important;
                            flex-direction: column;
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background: white;
                            padding: 20px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        }
                        .nav-links.active a {
                            color: #333 !important;
                            padding: 15px 0;
                            border-bottom: 1px solid #eee;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }
}

// ===== Cart Functions =====
function addToCart(dishId) {
    const dish = dishes.find(d => d.id == dishId);
    if (!dish) return;

    const existingItem = cart.find(item => item.id === dishId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: dish.id,
            name: dish.name,
            price: parseFloat(dish.price),
            image: dish.image_url,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showAddedNotification(dish.name);
    
    if (cartSidebar && !cartSidebar.classList.contains('active')) {
        toggleCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('restondar_cart', JSON.stringify(cart));
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartUI();
}

// ===== Update Cart UI =====
function updateCartUI() {
    updateAllCartCounts();
    
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '';
        if (cartEmpty) cartEmpty.classList.remove('hidden');
        if (cartFooter) cartFooter.classList.add('hidden');
    } else {
        if (cartEmpty) cartEmpty.classList.add('hidden');
        if (cartFooter) cartFooter.classList.remove('hidden');
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/70'}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">${formatPrice(item.price)}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTotals();
}

function updateAllCartCounts() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked');
    const deliveryFeeValue = deliveryType && deliveryType.value === 'pickup' ? 0 : 1000;
    const total = subtotal + (cart.length > 0 ? deliveryFeeValue : 0);

    if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
    if (cartTotal) cartTotal.textContent = formatPrice(total);

    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
    if (summaryTotal) summaryTotal.textContent = formatPrice(total);
}

// ===== Toggle Cart Sidebar =====
function toggleCart() {
    if (cartSidebar) cartSidebar.classList.toggle('active');
    if (cartOverlay) cartOverlay.classList.toggle('active');
    document.body.style.overflow = cartSidebar && cartSidebar.classList.contains('active') ? 'hidden' : '';
}

// ===== Order Modal =====
function openOrderModal() {
    if (cart.length === 0) return;
    
    toggleCart();
    
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    if (orderSummaryItems) {
        orderSummaryItems.innerHTML = cart.map(item => `
            <div class="summary-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    updateTotals();
    
    if (orderModal) {
        orderModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeOrderModal() {
    if (orderModal) {
        orderModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== Handle Order Submit =====
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    // Validate delivery address if delivery selected
    if (deliveryType === 'delivery') {
        const address = document.getElementById('address').value;
        const postalCode = document.getElementById('postalCode').value;
        const city = document.getElementById('city').value;
        
        if (!address || !postalCode || !city) {
            alert('Veuillez remplir tous les champs de l\'adresse de livraison.');
            return;
        }
    }

    // Prepare order data
    const orderData = {
        firstname: document.getElementById('firstName').value,
        lastname: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        delivery_type: deliveryType,
        address: document.getElementById('address')?.value || '',
        postal_code: document.getElementById('postalCode')?.value || '',
        city: document.getElementById('city')?.value || '',
        instructions: document.getElementById('instructions')?.value || '',
        payment_method: paymentType,
        items: cart
    };

    try {
        const res = await fetch(`${API_BASE}/orders.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await res.json();

        if (data.success) {
            lastOrderData = data;
            
            // Update order number
            document.getElementById('orderNumber').textContent = data.order_number;
            
            // Set WhatsApp link
            const whatsappBtn = document.getElementById('whatsappBtn');
            if (whatsappBtn && data.whatsapp_url) {
                whatsappBtn.href = data.whatsapp_url;
            }
            
            // Set Email link
            const emailBtn = document.getElementById('emailBtn');
            if (emailBtn) {
                const subject = encodeURIComponent(`Confirmation commande ${data.order_number} - RestoNdar`);
                const body = encodeURIComponent(`Bonjour,\n\nMa commande ${data.order_number} a bien été passée.\n\nMerci !`);
                emailBtn.href = `mailto:contact@restondar.sn?subject=${subject}&body=${body}`;
            }

            // Close order modal and show success
            closeOrderModal();
            
            if (successModal) {
                successModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Clear cart
            clearCart();
            
            // Reset form
            if (orderForm) orderForm.reset();
        } else {
            alert(data.error || 'Erreur lors de la commande. Veuillez réessayer.');
        }
    } catch (err) {
        console.error('API unavailable, using fallback:', err);
        
        // Fallback: Generate WhatsApp message directly
        const orderNumber = 'RN' + Date.now().toString().slice(-8);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFeeVal = deliveryType === 'delivery' ? 1000 : 0;
        const total = subtotal + deliveryFeeVal;
        
        // Build WhatsApp message
        let message = `🍽️ *NOUVELLE COMMANDE*\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `📋 N° ${orderNumber}\n\n`;
        message += `*Client:*\n`;
        message += `👤 ${orderData.firstname} ${orderData.lastname}\n`;
        message += `📞 ${orderData.phone}\n`;
        message += `📧 ${orderData.email}\n\n`;
        
        if (deliveryType === 'delivery') {
            message += `*🛵 Livraison:*\n`;
            message += `${orderData.address}\n`;
            message += `${orderData.postal_code} ${orderData.city}\n`;
            if (orderData.instructions) {
                message += `📝 ${orderData.instructions}\n`;
            }
        } else {
            message += `*🏪 Retrait sur place*\n`;
        }
        
        message += `\n*Commande:*\n`;
        cart.forEach(item => {
            message += `• ${item.quantity}x ${item.name} - ${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA\n`;
        });
        
        message += `\n━━━━━━━━━━━━━━━━━\n`;
        message += `Sous-total: ${subtotal.toLocaleString('fr-FR')} FCFA\n`;
        if (deliveryFeeVal > 0) {
            message += `Livraison: ${deliveryFeeVal.toLocaleString('fr-FR')} FCFA\n`;
        }
        message += `*TOTAL: ${total.toLocaleString('fr-FR')} FCFA*\n\n`;
        
        const paymentLabels = { 'wave': 'Wave', 'orange_money': 'Orange Money', 'card': 'Carte Bancaire', 'cash': 'Espèces' };
        message += `💳 Paiement: ${paymentLabels[paymentType] || 'Espèces'}`;
        
        const whatsappNumber = '221773525382';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Update UI
        document.getElementById('orderNumber').textContent = orderNumber;
        
        const whatsappBtn = document.getElementById('whatsappBtn');
        if (whatsappBtn) whatsappBtn.href = whatsappUrl;
        
        const emailBtn = document.getElementById('emailBtn');
        if (emailBtn) {
            const subject = encodeURIComponent(`Confirmation commande ${orderNumber} - RestoNdar`);
            const body = encodeURIComponent(`Bonjour,\n\nMa commande ${orderNumber} a bien été passée.\n\nMerci !`);
            emailBtn.href = `mailto:contact@restondar.sn?subject=${subject}&body=${body}`;
        }

        closeOrderModal();
        
        if (successModal) {
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        clearCart();
        if (orderForm) orderForm.reset();
    }
}

// ===== Close Success Modal =====
function closeSuccessModal() {
    if (successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    window.location.href = 'index.html';
}

// ===== Notification =====
function showAddedNotification(name) {
    const notification = document.createElement('div');
    notification.className = 'add-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${name} ajouté au panier</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #27ae60;
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        box-shadow: 0 5px 20px rgba(39, 174, 96, 0.4);
        z-index: 3000;
        animation: slideUp 0.3s ease forwards;
    `;

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideUp {
                to { transform: translateX(-50%) translateY(0); }
            }
            @keyframes slideDown {
                to { transform: translateX(-50%) translateY(100px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===== Format Price =====
function formatPrice(price) {
    return Math.round(parseFloat(price)).toLocaleString('fr-FR') + ' FCFA';
}
