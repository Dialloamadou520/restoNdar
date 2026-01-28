<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
            if (isset($_GET['id'])) {
                getOrder($db, $_GET['id']);
            } else {
                getOrders($db);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            createOrder($db, $data);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            updateOrderStatus($db, $data);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getOrders($db) {
    $status = $_GET['status'] ?? null;
    $date = $_GET['date'] ?? null;
    
    $sql = "SELECT * FROM orders";
    $conditions = [];
    $params = [];
    
    if ($status && $status !== 'all') {
        $conditions[] = "status = ?";
        $params[] = $status;
    }
    
    if ($date) {
        $conditions[] = "DATE(created_at) = ?";
        $params[] = $date;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Get items for each order
    foreach ($orders as &$order) {
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
    }
    
    echo json_encode(['success' => true, 'data' => $orders]);
}

function getOrder($db, $id) {
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? OR order_number = ?");
    $stmt->execute([$id, $id]);
    $order = $stmt->fetch();
    
    if ($order) {
        $stmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
        
        echo json_encode(['success' => true, 'data' => $order]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
    }
}

function createOrder($db, $data) {
    $db->beginTransaction();
    
    try {
        // Generate order number
        $orderNumber = 'RN' . date('Ymd') . strtoupper(substr(uniqid(), -5));
        
        // Calculate totals
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        
        $deliveryFee = $data['delivery_type'] === 'delivery' ? 1000 : 0;
        $total = $subtotal + $deliveryFee;
        
        // Insert order
        $sql = "INSERT INTO orders (
            order_number, customer_firstname, customer_lastname, customer_phone, customer_email,
            delivery_type, address, postal_code, city, instructions, payment_method,
            subtotal, delivery_fee, total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $orderNumber,
            $data['firstname'],
            $data['lastname'],
            $data['phone'],
            $data['email'],
            $data['delivery_type'],
            $data['address'] ?? '',
            $data['postal_code'] ?? '',
            $data['city'] ?? '',
            $data['instructions'] ?? '',
            $data['payment_method'] ?? 'cash',
            $subtotal,
            $deliveryFee,
            $total
        ]);
        
        $orderId = $db->lastInsertId();
        
        // Insert order items
        $sql = "INSERT INTO order_items (order_id, dish_id, dish_name, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($sql);
        
        foreach ($data['items'] as $item) {
            $stmt->execute([
                $orderId,
                $item['id'],
                $item['name'],
                $item['quantity'],
                $item['price'],
                $item['price'] * $item['quantity']
            ]);
        }
        
        $db->commit();
        
        // Get settings for WhatsApp
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('whatsapp_number', 'restaurant_name')");
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        // Build WhatsApp message
        $whatsappMessage = buildWhatsAppMessage($data, $orderNumber, $subtotal, $deliveryFee, $total);
        $whatsappUrl = "https://wa.me/" . preg_replace('/[^0-9]/', '', $settings['whatsapp_number'] ?? '') . "?text=" . urlencode($whatsappMessage);
        
        echo json_encode([
            'success' => true,
            'message' => 'Commande créée avec succès',
            'order_number' => $orderNumber,
            'order_id' => $orderId,
            'total' => $total,
            'whatsapp_url' => $whatsappUrl
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

function buildWhatsAppMessage($data, $orderNumber, $subtotal, $deliveryFee, $total) {
    $message = "🍽️ *NOUVELLE COMMANDE*\n";
    $message .= "━━━━━━━━━━━━━━━━━\n";
    $message .= "📋 N° " . $orderNumber . "\n\n";
    
    $message .= "*Client:*\n";
    $message .= "👤 " . $data['firstname'] . " " . $data['lastname'] . "\n";
    $message .= "📞 " . $data['phone'] . "\n";
    $message .= "📧 " . $data['email'] . "\n\n";
    
    if ($data['delivery_type'] === 'delivery') {
        $message .= "*🛵 Livraison:*\n";
        $message .= $data['address'] . "\n";
        $message .= $data['postal_code'] . " " . $data['city'] . "\n";
        if (!empty($data['instructions'])) {
            $message .= "📝 " . $data['instructions'] . "\n";
        }
    } else {
        $message .= "*🏪 Retrait sur place*\n";
    }
    
    $message .= "\n*Commande:*\n";
    foreach ($data['items'] as $item) {
        $message .= "• " . $item['quantity'] . "x " . $item['name'] . " - " . number_format($item['price'] * $item['quantity'], 0, ',', ' ') . " FCFA\n";
    }
    
    $message .= "\n━━━━━━━━━━━━━━━━━\n";
    $message .= "Sous-total: " . number_format($subtotal, 0, ',', ' ') . " FCFA\n";
    if ($deliveryFee > 0) {
        $message .= "Livraison: " . number_format($deliveryFee, 0, ',', ' ') . " FCFA\n";
    }
    $message .= "*TOTAL: " . number_format($total, 0, ',', ' ') . " FCFA*\n";
    
    $paymentLabels = [
        'wave' => 'Wave',
        'orange_money' => 'Orange Money',
        'card' => 'Carte Bancaire',
        'cash' => 'Espèces'
    ];
    $paymentMethod = $paymentLabels[$data['payment_method']] ?? 'Espèces';
    $message .= "\n💳 Paiement: " . $paymentMethod;
    
    return $message;
}

function updateOrderStatus($db, $data) {
    $validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!in_array($data['status'], $validStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        return;
    }
    
    $stmt = $db->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$data['status'], $data['id']]);
    
    $statusLabels = [
        'pending' => 'En attente',
        'confirmed' => 'Confirmée',
        'preparing' => 'En préparation',
        'ready' => 'Prête',
        'delivered' => 'Livrée',
        'cancelled' => 'Annulée'
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Statut mis à jour: ' . $statusLabels[$data['status']]
    ]);
}
