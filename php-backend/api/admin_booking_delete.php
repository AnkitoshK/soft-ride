<?php
require __DIR__ . '/bootstrap.php';
method('POST');
admin_required();

$x = input();
$id = trim((string)($x['id'] ?? ''));

if (!$id) {
    respond(422, ['error' => 'Missing booking ID.']);
}

try {
    $q = db()->prepare('DELETE FROM soft_ride_bookings WHERE booking_code = ? OR id = ?');
    $q->execute([$id, $id]);
    respond(200, ['ok' => true, 'id' => $id, 'message' => 'Booking deleted successfully']);
} catch (Throwable $e) {
    error_log($e);
    respond(500, ['error' => 'Failed to delete booking']);
}
