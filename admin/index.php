<?php
session_start();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - RestoNdar</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body>
    <!-- Login Screen -->
    <div class="login-screen" id="loginScreen">
        <div class="login-container">
            <div class="login-header">
                <div class="login-logo">
                    <i class="fas fa-utensils"></i>
                </div>
                <h1>RestoNdar Admin</h1>
                <p>Connectez-vous pour gérer votre restaurant</p>
            </div>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Nom d'utilisateur</label>
                    <input type="text" id="username" required placeholder="admin">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Mot de passe</label>
                    <input type="password" id="password" required placeholder="••••••••">
                </div>
                <div class="login-error" id="loginError"></div>
                <button type="submit" class="btn btn-primary btn-login">
                    <i class="fas fa-sign-in-alt"></i> Se Connecter
                </button>
            </form>
            <div class="login-footer">
                <p>Identifiants par défaut: admin / admin123</p>
            </div>
        </div>
    </div>

    <!-- Admin Dashboard -->
    <div class="admin-wrapper" id="adminWrapper" style="display: none;">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fas fa-utensils"></i>
                    <span>RestoNdar</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active" data-section="dashboard">
                    <i class="fas fa-chart-line"></i>
                    <span>Tableau de Bord</span>
                </a>
                <a href="#" class="nav-item" data-section="orders">
                    <i class="fas fa-clipboard-list"></i>
                    <span>Commandes</span>
                    <span class="badge" id="pendingOrdersBadge">0</span>
                </a>
                <a href="#" class="nav-item" data-section="dishes">
                    <i class="fas fa-hamburger"></i>
                    <span>Plats</span>
                </a>
                <a href="#" class="nav-item" data-section="categories">
                    <i class="fas fa-tags"></i>
                    <span>Catégories</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <button class="btn-logout" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="admin-header">
                <button class="mobile-menu-btn" id="mobileMenuBtn">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="header-title">
                    <h1 id="pageTitle">Tableau de Bord</h1>
                </div>
                <div class="header-actions">
                    <button class="btn-refresh" onclick="refreshData()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <div class="admin-user">
                        <i class="fas fa-user-circle"></i>
                        <span id="adminName">Admin</span>
                    </div>
                </div>
            </header>

            <!-- Dashboard Section -->
            <section class="content-section active" id="dashboardSection">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon bg-blue">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="todayOrders">0</h3>
                            <p>Commandes Aujourd'hui</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-green">
                            <i class="fas fa-euro-sign"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="todayRevenue">0 €</h3>
                            <p>Chiffre d'Affaires</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-orange">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="pendingOrders">0</h3>
                            <p>Commandes en Attente</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon bg-red">
                            <i class="fas fa-utensils"></i>
                        </div>
                        <div class="stat-info">
                            <h3 id="totalDishes">0</h3>
                            <p>Plats au Menu</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="card recent-orders">
                        <div class="card-header">
                            <h2><i class="fas fa-clock"></i> Commandes Récentes</h2>
                            <a href="#" onclick="showSection('orders')">Voir tout</a>
                        </div>
                        <div class="card-body">
                            <div id="recentOrdersList" class="orders-list"></div>
                        </div>
                    </div>
                    <div class="card popular-dishes">
                        <div class="card-header">
                            <h2><i class="fas fa-star"></i> Plats Populaires</h2>
                        </div>
                        <div class="card-body">
                            <div id="popularDishesList" class="dishes-list"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Orders Section -->
            <section class="content-section" id="ordersSection">
                <div class="section-header">
                    <div class="filters">
                        <select id="orderStatusFilter" onchange="filterOrders()">
                            <option value="all">Tous les statuts</option>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="preparing">En préparation</option>
                            <option value="ready">Prête</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                        </select>
                        <input type="date" id="orderDateFilter" onchange="filterOrders()">
                    </div>
                </div>
                <div class="orders-grid" id="ordersGrid"></div>
            </section>

            <!-- Dishes Section -->
            <section class="content-section" id="dishesSection">
                <div class="section-header">
                    <div class="filters">
                        <select id="dishCategoryFilter" onchange="filterDishes()">
                            <option value="all">Toutes catégories</option>
                        </select>
                        <select id="dishAvailabilityFilter" onchange="filterDishes()">
                            <option value="all">Tous</option>
                            <option value="available">Disponibles</option>
                            <option value="unavailable">Indisponibles</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="openDishModal()">
                        <i class="fas fa-plus"></i> Ajouter un Plat
                    </button>
                </div>
                <div class="dishes-grid" id="dishesGrid"></div>
            </section>

            <!-- Categories Section -->
            <section class="content-section" id="categoriesSection">
                <div class="section-header">
                    <button class="btn btn-primary" onclick="openCategoryModal()">
                        <i class="fas fa-plus"></i> Ajouter une Catégorie
                    </button>
                </div>
                <div class="categories-grid" id="categoriesGrid"></div>
            </section>
        </main>
    </div>

    <!-- Order Detail Modal -->
    <div class="modal-overlay" id="orderModal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h2><i class="fas fa-receipt"></i> Détails de la Commande</h2>
                <button class="modal-close" onclick="closeModal('orderModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="orderModalBody"></div>
        </div>
    </div>

    <!-- Dish Modal -->
    <div class="modal-overlay" id="dishModal">
        <div class="modal">
            <div class="modal-header">
                <h2 id="dishModalTitle"><i class="fas fa-hamburger"></i> Ajouter un Plat</h2>
                <button class="modal-close" onclick="closeModal('dishModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="dishForm">
                    <input type="hidden" id="dishId">
                    <div class="form-group">
                        <label>Catégorie *</label>
                        <select id="dishCategory" required></select>
                    </div>
                    <div class="form-group">
                        <label>Nom du plat *</label>
                        <input type="text" id="dishName" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="dishDescription" rows="3"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Prix (€) *</label>
                            <input type="number" id="dishPrice" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Image URL</label>
                            <input type="url" id="dishImage">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="dishAvailable" checked>
                                Disponible
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label>
                                <input type="checkbox" id="dishPopular">
                                Populaire
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('dishModal')">Annuler</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <h2><i class="fas fa-exclamation-triangle"></i> Confirmation</h2>
                <button class="modal-close" onclick="closeModal('deleteModal')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p id="deleteMessage">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Annuler</button>
                    <button class="btn btn-danger" id="confirmDeleteBtn">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast">
        <i class="toast-icon fas fa-check-circle"></i>
        <span class="toast-message"></span>
    </div>

    <script src="admin.js"></script>
</body>
</html>
