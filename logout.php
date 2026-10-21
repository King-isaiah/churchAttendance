<?php
// 1. Start the session first
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Include the Auth class
require_once 'class/Auth.php'; 

// 3. Grab the session cookie parameters BEFORE we destroy the session
$cookieParams = session_get_cookie_params();
$sessionName = session_name();

// 4. Use the Auth class to update the DB status to 'offline' and run session_unset()/session_destroy()
$auth = new Auth();
$auth->logout();

// 5. BULLETPROOF FIX: Explicitly empty the $_SESSION array just in case
$_SESSION = array();

// 6. Delete the session cookie from the browser
if (ini_get('session.use_cookies')) {
    setcookie(
        $sessionName,
        '',
        [
            'expires'  => time() - 42000,
            'path'     => $cookieParams['path'],
            'domain'   => $cookieParams['domain'],
            'secure'   => $cookieParams['secure'],
            'httponly' => $cookieParams['httponly'],
            'samesite' => $cookieParams['samesite'] ?? 'Lax',
        ]
    );
}

// 7. Prevent the browser from caching this page or any protected page
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// 8. Send the user back to the login page
header('Location: login.html');
exit();