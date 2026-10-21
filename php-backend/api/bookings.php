<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/sms.php';
method('POST');
$x=input();
foreach (['pickup','dropoff','vehicle','rideDate','rideTime','name','phone','email'] as $key) {
    if (trim((string)($x[$key] ?? '')) === '') respond(422, ['error' => 'Please complete all required fields.']);
}
if (!filter_var($x['email'], FILTER_VALIDATE_EMAIL)) respond(422, ['error' => 'Enter a valid email address.']);
$date = DateTime::createFromFormat('Y-m-d', (string)$x['rideDate']);
$time = DateTime::createFromFormat('H:i', (string)$x['rideTime']);
if (!$date || !$time) respond(422, ['error' => 'Choose a valid ride date and time.']);
try {
    $code = 'SR' . strtoupper(bin2hex(random_bytes(5)));
    $pickup = trim((string)$x['pickup']);
    $dropoff = trim((string)$x['dropoff']);
    $vehicle = trim((string)$x['vehicle']);
    $fare = max(0, (float)($x['fare'] ?? 0));
    $query = db()->prepare('INSERT INTO soft_ride_bookings(booking_code,pickup,dropoff,distance,instructions,vehicle,fare,ride_date,ride_time,passengers,luggage,customer_name,phone,email,payment) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $query->execute([$code,$pickup,$dropoff,max(0,(float)($x['distance']??0)),trim((string)($x['instructions']??'')),$vehicle,$fare,$date->format('Y-m-d'),$time->format('H:i:s'),max(1,(int)($x['passengers']??1)),trim((string)($x['luggage']??'')),trim((string)$x['name']),trim((string)$x['phone']),trim((string)$x['email']),trim((string)($x['payment']??''))]);
    try {
        $sms = send_booking_sms((string)$x['phone'], 'Soft Ride booking received. Booking ID: ' . $code . '. Vehicle: ' . $vehicle . '. ' . $pickup . ' to ' . $dropoff . '. Date: ' . $date->format('d-m-Y') . ' at ' . $time->format('H:i') . '. Fare: Rs ' . number_format($fare, 0) . '.');
    } catch (Throwable $smsError) {
        error_log('Booking saved but SMS failed: ' . $smsError->getMessage());
        $sms = ['sent' => false, 'configured' => true];
    }
    respond(201, ['id' => $code, 'smsSent' => $sms['sent'], 'smsConfigured' => $sms['configured']]);
} catch (Throwable $error) {
    error_log($error);
    respond(500, ['error' => 'Booking could not be saved. Please try again.']);
}