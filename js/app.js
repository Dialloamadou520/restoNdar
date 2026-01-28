// ===== Cart State =====
let cart = JSON.parse(localStorage.getItem('restondar_cart')) || [];

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
    updateCartUI();
    initNavbar();
    initCategoryFilter();
    initDeliveryToggle();
    initEventListeners();
});

// ===== Navbar Scroll Effect =====
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar.classList.contains('navbar-fixed')) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// ===== Category Filter =====
function initCategoryFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter items
            menuItems.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeInUp 0.5s ease';
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
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
                    if (deliveryFee) deliveryFee.textContent = '3,50 €';
                    if (summaryDelivery) summaryDelivery.textContent = '3,50 €';
                } else {
                    if (deliveryAddress) deliveryAddress.style.display = 'none';
                    if (deliveryFee) deliveryFee.textContent = '0,00 €';
                    if (summaryDelivery) summaryDelivery.textContent = '0,00 €';
                }
                updateTotals();
            });
        });
    }
}

// ===== Event Listeners =====
function initEventListeners() {
    // Cart toggle
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', toggleCart);
    }
    
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
    }

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openOrderModal);
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', closeOrderModal);
    }

    // Order form submission
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }

    // Update all cart counts on page
    updateAllCartCounts();
}

// ===== Cart Functions =====
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id,
            name,
            price,
            image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showAddedNotification(name);
    
    // Open cart sidebar
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
                    <img src="${item.image}" alt="${item.name}">
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
    
    // Update all cart count elements
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked');
    const deliveryFeeValue = deliveryType && deliveryType.value === 'pickup' ? 0 : 3.50;
    const total = subtotal + (cart.length > 0 ? deliveryFeeValue : 0);

    if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
    if (cartTotal) cartTotal.textContent = formatPrice(total);

    // Update modal summary
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
    
    // Populate order summary
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
function handleOrderSubmit(e) {
    e.preventDefault();
    
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    
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

    // Generate order number
    const orderNumber = '#' + Math.floor(10000 + Math.random() * 90000);
    document.getElementById('orderNumber').textContent = orderNumber;

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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'add-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${name} ajouté au panier</span>
    `;
    
    // Add styles dynamically
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

    // Add keyframes animation
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

    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===== Format Price =====
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + ' €';
}

// ===== Contact Form Handler =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
        this.reset();
    });
}

// ===== Mobile Menu Toggle =====
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        // Add mobile menu styles if not present
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
