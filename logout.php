<?php
// 1. Include the Auth class (this also includes Database.php)
// Make sure the path matches where your Auth.php file is located. 
// Based on your ApiHandler, it's likely in the 'class' folder.
require_once 'class/Auth.php'; 

// Start the session if it hasn't been started yet
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Grab the session cookie parameters BEFORE we destroy the session
// This ensures we have the correct path/domain to properly delete the cookie.
$cookieParams = session_get_cookie_params();
$sessionName = session_name();

// 3. Use the Auth class to update the database status to 'offline' and destroy the session
$auth = new Auth();
$auth->logout();

// 4. Delete the session cookie from the browser using the saved parameters
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

// 5. Prevent the browser from caching this page or any protected page
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// 6. Send the user back to the splash screen
header('Location: index.html');
exit();