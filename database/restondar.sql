-- RestoNdar Database Schema
-- Run this file in phpMyAdmin to create the database

CREATE DATABASE IF NOT EXISTS restondar;
USE restondar;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT 'fas fa-utensils',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dishes table
CREATE TABLE IF NOT EXISTS dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_firstname VARCHAR(100) NOT NULL,
    customer_lastname VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(200) NOT NULL,
    delivery_type ENUM('delivery', 'pickup') NOT NULL,
    address VARCHAR(500),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    instructions TEXT,
    payment_method ENUM('wave', 'orange_money', 'card', 'cash') DEFAULT 'cash',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    dish_id INT NOT NULL,
    dish_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(200),
    role ENUM('admin', 'manager') DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, slug, icon, display_order) VALUES
('Entrées', 'entrees', 'fas fa-leaf', 1),
('Plats', 'plats', 'fas fa-drumstick-bite', 2),
('Pizzas', 'pizzas', 'fas fa-pizza-slice', 3),
('Burgers', 'burgers', 'fas fa-hamburger', 4),
('Desserts', 'desserts', 'fas fa-ice-cream', 5),
('Boissons', 'boissons', 'fas fa-glass-cheers', 6);

-- Insert sample dishes (prices in FCFA for Senegal market)
INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_popular) VALUES
-- Entrées
(1, 'Salade César', 'Laitue romaine, croûtons, parmesan, sauce César maison', 3500, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400', TRUE, TRUE),
(1, 'Soupe à l''Oignon', 'Oignons caramélisés, bouillon de bœuf, gruyère gratiné', 2500, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', TRUE, FALSE),
(1, 'Bruschetta', 'Pain grillé, tomates fraîches, basilic, huile d''olive', 3000, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', TRUE, FALSE),

-- Plats
(2, 'Poulet Yassa', 'Poulet mariné aux oignons et citron, riz blanc', 4500, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400', TRUE, TRUE),
(2, 'Thiéboudienne', 'Riz au poisson, légumes frais, sauce tomate', 5000, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', TRUE, TRUE),
(2, 'Mafé Bœuf', 'Bœuf mijoté sauce arachide, riz blanc', 5500, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', TRUE, TRUE),
(2, 'Poulet Braisé', 'Poulet grillé, frites maison, sauce piment', 4000, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400', TRUE, FALSE),

-- Pizzas
(3, 'Pizza Margherita', 'Sauce tomate, mozzarella, basilic frais, huile d''olive', 4500, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', TRUE, TRUE),
(3, 'Pizza 4 Fromages', 'Mozzarella, gorgonzola, chèvre, parmesan', 5500, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', TRUE, FALSE),
(3, 'Pizza Pepperoni', 'Sauce tomate, mozzarella, pepperoni épicé', 5000, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', TRUE, FALSE),

-- Burgers
(4, 'Burger Classic', 'Steak haché, cheddar, salade, tomate, oignon', 3500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', TRUE, TRUE),
(4, 'Burger Gourmet', 'Bœuf Angus, cheddar affiné, bacon, sauce maison', 4500, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', TRUE, TRUE),
(4, 'Burger Veggie', 'Galette de légumes, avocat, roquette, sauce yaourt', 3000, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400', TRUE, FALSE),

-- Desserts
(5, 'Tiramisu', 'Biscuits café, mascarpone, cacao', 2500, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', TRUE, TRUE),
(5, 'Crème Brûlée', 'Crème vanille, caramel croustillant', 2000, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400', TRUE, FALSE),
(5, 'Fondant au Chocolat', 'Cœur coulant, glace vanille, crème chantilly', 3000, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', TRUE, FALSE),

-- Boissons
(6, 'Jus de Bissap', 'Hibiscus frais, sucre, menthe', 1000, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', TRUE, TRUE),
(6, 'Jus de Gingembre', 'Gingembre frais, citron, menthe', 1000, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400', TRUE, FALSE),
(6, 'Café Touba', 'Café sénégalais épicé au poivre de Guinée', 500, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400', TRUE, FALSE);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password, full_name, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', 'admin@restondar.fr', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('restaurant_name', 'RestoNdar'),
('restaurant_phone', '+221 77 352 53 82'),
('restaurant_email', 'contact@restondar.sn'),
('restaurant_address', 'Saint-Louis, Sénégal'),
('delivery_fee', '1000'),
('whatsapp_number', '+221773525382'),
('opening_hours', 'Lun - Dim: 11h00 - 23h00'),
('currency', 'FCFA');
