<?php
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'softride');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('ADMIN_USER', getenv('ADMIN_USER') ?: 'admin');
define('ADMIN_PASSWORD', getenv('ADMIN_PASSWORD') ?: 'RideAdmin@2026');
function db(): PDO {
    static $pdo=null;
    if($pdo instanceof PDO)return $pdo;
    $pdo=new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',DB_USER,DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    $pdo->exec("CREATE TABLE IF NOT EXISTS soft_ride_bookings (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, booking_code VARCHAR(32) NOT NULL UNIQUE, pickup VARCHAR(255) NOT NULL, dropoff VARCHAR(255) NOT NULL, distance DECIMAL(8,2) NOT NULL DEFAULT 0, instructions TEXT NULL, vehicle VARCHAR(80) NOT NULL, fare DECIMAL(10,2) NOT NULL DEFAULT 0, ride_date DATE NOT NULL, ride_time TIME NOT NULL, passengers TINYINT UNSIGNED NOT NULL DEFAULT 1, luggage VARCHAR(80) NULL, customer_name VARCHAR(160) NOT NULL, phone VARCHAR(40) NOT NULL, email VARCHAR(190) NOT NULL, payment VARCHAR(40) NULL, status ENUM('Pending','Confirmed','Completed','Cancelled') NOT NULL DEFAULT 'Pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_soft_ride_status(status), INDEX idx_soft_ride_created(created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->exec("CREATE TABLE IF NOT EXISTS soft_ride_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, email VARCHAR(190) NOT NULL, subject VARCHAR(200) NULL, message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_soft_message_created(created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    return $pdo;
}