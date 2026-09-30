<?php
// Always start the session so we can access and destroy it
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. Clear all session variables
$_SESSION = [];

// 2. Delete the session cookie from the browser
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        [
            'expires'  => time() - 42000,
            'path'     => $params['path'],
            'domain'   => $params['domain'],
            'secure'   => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]
    );
}

// 3. Destroy the session on the server
session_destroy();

// 4. Prevent the browser from caching this page or any protected page
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// 5. Send the user back to the splash screen
header('Location: index.html');
exit();