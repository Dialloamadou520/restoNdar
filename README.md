# 🍽️ RestoNdar - Restaurant & Commande en Ligne

Site web de restaurant avec système de commande en ligne complet.

## 📋 Fonctionnalités

### 🛒 Côté Client
- **Page d'accueil** - Présentation du restaurant avec sections hero, fonctionnalités, plats populaires
- **Menu en ligne** - Affichage des plats avec images, prix, descriptions et filtrage par catégorie
- **Commande en ligne** - Ajout au panier, modification des quantités
- **Choix de réception** :
  - 🛵 Livraison (+3,50€)
  - 🏪 Retrait sur place (gratuit)
- **Confirmation de commande** - Via WhatsApp, SMS ou Email

### 👨‍🍳 Côté Restaurateur (Admin)
- **Gestion des plats** - Ajouter, modifier, supprimer des plats
- **Activation/Désactivation** - Marquer un plat comme indisponible (rupture de stock)
- **Commandes en temps réel** - Voir et gérer toutes les commandes
- **Modification des prix** - Changer les prix facilement
- **Tableau de bord** - Statistiques du jour (commandes, chiffre d'affaires)

## 🚀 Installation

### Prérequis
- XAMPP (Apache + MySQL + PHP)
- Navigateur web moderne

### Étapes d'installation

1. **Démarrer XAMPP**
   - Lancez XAMPP Control Panel
   - Démarrez Apache et MySQL

2. **Créer la base de données**
   - Ouvrez phpMyAdmin : http://localhost/phpmyadmin
   - Créez une nouvelle base de données nommée `restondar`
   - Importez le fichier `database/restondar.sql`
   
   Ou exécutez directement dans phpMyAdmin :
   ```sql
   SOURCE C:/xampp/htdocs/RestoNdar/database/restondar.sql;
   ```

3. **Configuration de la base de données**
   - Vérifiez les paramètres dans `config/database.php`
   - Par défaut : host=localhost, user=root, password=(vide)

4. **Accéder au site**
   - Site client : http://localhost/RestoNdar
   - Menu : http://localhost/RestoNdar/menu.php
   - Admin : http://localhost/RestoNdar/admin

## 🔐 Connexion Admin

**Identifiants par défaut :**
- Utilisateur : `admin`
- Mot de passe : `admin123`

> ⚠️ **Important** : Changez le mot de passe en production !

## 📁 Structure du Projet

```
RestoNdar/
├── admin/
│   ├── index.php      # Dashboard admin
│   ├── admin.css      # Styles admin
│   └── admin.js       # Scripts admin
├── api/
│   ├── auth.php       # Authentification
│   ├── dishes.php     # API plats (CRUD)
│   └── orders.php     # API commandes
├── config/
│   └── database.php   # Configuration BDD
├── css/
│   └── style.css      # Styles client
├── database/
│   └── restondar.sql  # Script SQL
├── js/
│   ├── app.js         # Scripts page accueil
│   └── menu.js        # Scripts menu/commande
├── index.html         # Page d'accueil
├── menu.php           # Page menu dynamique
└── menu.html          # Menu statique (backup)
```

## 🔧 Configuration

### Paramètres WhatsApp
Dans `database/restondar.sql`, modifiez le numéro WhatsApp :
```sql
UPDATE settings SET setting_value = '+33XXXXXXXXX' WHERE setting_key = 'whatsapp_number';
```

### Frais de livraison
```sql
UPDATE settings SET setting_value = '3.50' WHERE setting_key = 'delivery_fee';
```

## 📱 API Endpoints

### Plats
- `GET /api/dishes.php` - Liste des plats
- `GET /api/dishes.php?action=categories` - Liste des catégories
- `POST /api/dishes.php` - Créer un plat
- `PUT /api/dishes.php` - Modifier un plat
- `PUT /api/dishes.php?action=toggle` - Activer/Désactiver
- `DELETE /api/dishes.php?id=X` - Supprimer un plat

### Commandes
- `GET /api/orders.php` - Liste des commandes
- `POST /api/orders.php` - Créer une commande
- `PUT /api/orders.php` - Modifier le statut

### Authentification
- `POST /api/auth.php?action=login` - Connexion
- `GET /api/auth.php?action=logout` - Déconnexion
- `GET /api/auth.php?action=check` - Vérifier session

## 🎨 Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : PHP 7+
- **Base de données** : MySQL
- **Fonts** : Google Fonts (Playfair Display, Poppins)
- **Icons** : Font Awesome 6
- **Images** : Unsplash

## 📄 Licence

Ce projet est sous licence MIT.

---

Développé avec ❤️ pour RestoNdar
