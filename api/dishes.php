<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'categories') {
                getCategories($db);
            } elseif (isset($_GET['id'])) {
                getDish($db, $_GET['id']);
            } else {
                getDishes($db);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            createDish($db, $data);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if ($action === 'toggle') {
                toggleAvailability($db, $data);
            } else {
                updateDish($db, $data);
            }
            break;
            
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            deleteDish($db, $id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getDishes($db) {
    $category = $_GET['category'] ?? null;
    $available = $_GET['available'] ?? null;
    
    $sql = "SELECT d.*, c.name as category_name, c.slug as category_slug 
            FROM dishes d 
            JOIN categories c ON d.category_id = c.id";
    
    $conditions = [];
    $params = [];
    
    if ($category && $category !== 'all') {
        $conditions[] = "c.slug = ?";
        $params[] = $category;
    }
    
    if ($available !== null) {
        $conditions[] = "d.is_available = ?";
        $params[] = $available === 'true' ? 1 : 0;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY c.display_order, d.name";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $dishes = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $dishes]);
}

function getDish($db, $id) {
    $stmt = $db->prepare("SELECT d.*, c.name as category_name FROM dishes d JOIN categories c ON d.category_id = c.id WHERE d.id = ?");
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    
    if ($dish) {
        echo json_encode(['success' => true, 'data' => $dish]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Dish not found']);
    }
}

function getCategories($db) {
    $stmt = $db->query("SELECT * FROM categories ORDER BY display_order");
    $categories = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $categories]);
}

function createDish($db, $data) {
    $sql = "INSERT INTO dishes (category_id, name, description, price, image_url, is_available, is_popular) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['category_id'],
        $data['name'],
        $data['description'] ?? '',
        $data['price'],
        $data['image_url'] ?? '',
        $data['is_available'] ?? 1,
        $data['is_popular'] ?? 0
    ]);
    
    $id = $db->lastInsertId();
    echo json_encode(['success' => true, 'message' => 'Plat créé avec succès', 'id' => $id]);
}

function updateDish($db, $data) {
    $sql = "UPDATE dishes SET 
            category_id = ?, 
            name = ?, 
            description = ?, 
            price = ?, 
            image_url = ?,
            is_available = ?,
            is_popular = ?
            WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['category_id'],
        $data['name'],
        $data['description'] ?? '',
        $data['price'],
        $data['image_url'] ?? '',
        $data['is_available'] ?? 1,
        $data['is_popular'] ?? 0,
        $data['id']
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Plat mis à jour avec succès']);
}

function toggleAvailability($db, $data) {
    $stmt = $db->prepare("UPDATE dishes SET is_available = NOT is_available WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    $stmt = $db->prepare("SELECT is_available FROM dishes WHERE id = ?");
    $stmt->execute([$data['id']]);
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true, 
        'message' => $result['is_available'] ? 'Plat activé' : 'Plat désactivé (rupture)',
        'is_available' => (bool)$result['is_available']
    ]);
}

function deleteDish($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM dishes WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Plat supprimé avec succès']);
}
