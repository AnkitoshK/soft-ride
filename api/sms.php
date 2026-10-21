<?php
function send_booking_sms(string $phone, string $message): array {
    $configPath = dirname(__DIR__) . '/sms-config.php';
    if (!is_file($configPath)) return ['sent' => false, 'configured' => false];
    $config = require $configPath;
    $sid = trim((string)($config['account_sid'] ?? ''));
    $token = trim((string)($config['auth_token'] ?? ''));
    $from = trim((string)($config['from_number'] ?? ''));
    if ($sid === '' || $token === '' || $from === '') return ['sent' => false, 'configured' => false];

    $digits = preg_replace('/\D+/', '', $phone);
    if (strlen($digits) === 10) $to = '+91' . $digits;
    elseif (strlen($digits) === 12 && str_starts_with($digits, '91')) $to = '+' . $digits;
    elseif (str_starts_with(trim($phone), '+')) $to = '+' . $digits;
    else return ['sent' => false, 'configured' => true];
    if (!preg_match('/^\+[1-9]\d{7,14}$/', $to)) return ['sent' => false, 'configured' => true];

    $url = 'https://api.twilio.com/2010-04-01/Accounts/' . rawurlencode($sid) . '/Messages.json';
    $fields = http_build_query(['To' => $to, 'From' => $from, 'Body' => $message]);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $fields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD => $sid . ':' . $token,
            CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
        ]);
        $response = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) error_log('Booking SMS request failed: ' . curl_error($ch));
        curl_close($ch);
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => "Authorization: Basic " . base64_encode($sid . ':' . $token) . "\r\nContent-Type: application/x-www-form-urlencoded\r\n",
            'content' => $fields,
            'timeout' => 12,
            'ignore_errors' => true,
        ]]);
        $response = @file_get_contents($url, false, $context);
        $status = 0;
        foreach ($http_response_header ?? [] as $header) if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $match)) $status = (int)$match[1];
    }
    if ($status < 200 || $status >= 300) {
        error_log('Booking SMS provider returned HTTP ' . $status);
        return ['sent' => false, 'configured' => true];
    }
    return ['sent' => true, 'configured' => true];
}