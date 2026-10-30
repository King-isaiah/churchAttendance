<?php
require_once 'Database.php';


class Auth extends Database {
    
    public function __construct() {
        parent::__construct();
        // Start session for global user variables
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

public function login($data) {
    $user_name = $data['user_name'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($user_name) || empty($password)) {
        throw new Exception("Username and password are required", 400);
    }

    // Fetch user from members table       
    $sql = "SELECT m.*, d.name as department_name,m.department_id AS department_id,m.primary_dept_id as primary_dept_id
                FROM members m LEFT JOIN departments d ON m.primary_dept_id	 = d.id
                WHERE m.user_name = ?";
    $user = $this->fetchOne($sql, [$user_name]);

    if (!$user) {
        throw new Exception("Invalid username or password", 401);
    }

    // Verify password (Supports both plain text legacy and hashed passwords)
    $isValidPassword = false;
    if (password_verify($password, $user['password'])) {
        $isValidPassword = true; // Hashed password
    } elseif ($password === $user['password']) {
        $isValidPassword = true; // Plain text (legacy)
    }

    if (!$isValidPassword) {
        throw new Exception("Invalid username or password", 401);
    }

    // Check if user is active
    if (isset($user['status']) && $user['status'] === 'inactive') {
        throw new Exception("Your account is deactivated. Please contact admin.", 403);
    }

    // --- LEVEL 4 ADDED: Block Unverified Users ---
    if (isset($user['is_verified']) && $user['is_verified'] == 0) {
        throw new Exception("Your email is not verified. Please check your inbox for the verification code.", 403);
    }
    // ---------------------------------------------

    // --- HEARTBEAT UPDATE ---
    $updateData = [
        'status' => 'online',
        'last_activity' => date('Y-m-d H:i:s')
    ];
    $this->update('members', $updateData, 'id = ?', [$user['id']]);
    // ------------------------
    
    // Set Session Variables (Global User Variable)
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['user_name'];
    $_SESSION['full_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_department'] = $user['department_name'];
    $_SESSION['primary_dept_id'] = $user['primary_dept_id'];        
    $_SESSION['unique_id'] = $user['unique_id'];  
    $_SESSION['user_role'] = $user['role'] ?? 'worker';       
    $_SESSION['first_name'] = $user['first_name'];
    $_SESSION['last_name'] = $user['last_name'];
    $_SESSION['current_streak'] = $user['current_streak'];

    // Remove password from returned data
    unset($user['password']);

    // Determine redirect based on role
    $redirect = ($_SESSION['user_role'] === 'admin') ? 'admin/dashboard.php' : 'user/user_dashboard.php';
    
    return [
        'success' => true,
        'message' => 'Login successful',
        'user' => $user,
        'redirect' => $redirect
    ];
}

    // This method allows the frontend to fetch the logged-in user at any time
    public function getSessionUser() {
        if (isset($_SESSION['user_id'])) {
            return [
                'id' => $_SESSION['user_id'],
                'user_name' => $_SESSION['user_name'],
                'role' => $_SESSION['user_role'],
                'email' => $_SESSION['user_email'],
                'first_name' => $_SESSION['first_name'],
                'unique_id' => $_SESSION['unique_id'],
                'last_name' => $_SESSION['last_name'],
                'current_streak' => $_SESSION['current_streak'] ,
               
            ];
        }
        return null; // Not logged in
    }
    public function logout() {
        // 1. Check if a user is actually logged in before updating the database
        if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
            
            // 2. Update the status to 'offline' in the members table
            $updateData = ['status' => 'offline'];
            $this->update('members', $updateData, 'id = ?', [$userId]);
        }

        // 3. Clear session data and destroy session
        session_unset();
        session_destroy();

        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    // 1. Request Password Reset (Generate OTP)
    // public function requestPasswordReset($data) {
    //     $email = $data['email'] ?? '';
    //     if (empty($email)) {
    //         throw new Exception("Email is required", 400);
    //     }

    //     // Check if user exists
    //     $sql = "SELECT id, first_name FROM members WHERE email = ?";
    //     $user = $this->fetchOne($sql, [$email]);

    //     if (!$user) {
    //         // TEMPORARY: show exactly what email was received
    //         throw new Exception("No account found for email: [" . $email . "] (length: " . strlen($email) . ")", 404);
    //     }

    //     // Generate 5-digit OTP
    //     $otp = rand(10000, 99999);
    //     $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    //     // Save OTP to database
    //     $this->update('members', [
    //         'reset_token' => $otp,
    //         'reset_expires_at' => $expiresAt
    //     ], 'id = ?', [$user['id']]);

    //     // ---------- SEND EMAIL VIA BREVO API ----------
    //     require_once __DIR__ . '/Config.php';
    //     $apiKey = BREVO_API_KEY;
    //     $payload = [
    //         'sender' => [
    //             'name'  => 'Hub Church',
    //             'email' => 'eshiozemheafuwape@gmail.com'
    //         ],
    //         'to' => [[
    //             'email' => $email,
    //             'name'  => $user['first_name']
    //         ]],
    //         'subject' => 'Password Reset Code - Hub Church',
    //         'htmlContent' => "
    //             <h2>Password Reset Code</h2>
    //             <p>Hello " . htmlspecialchars($user['first_name']) . ",</p>
    //             <p>Your password reset code is:</p>
    //             <h1 style='letter-spacing: 8px; color: #28a745;'>" . $otp . "</h1>
    //             <p>This code expires in <strong>15 minutes</strong>.</p>
    //             <p>If you did not request this, please ignore this email.</p>
    //         "
    //     ];

    //     $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    //     curl_setopt_array($ch, [
    //         CURLOPT_RETURNTRANSFER => true,
    //         CURLOPT_POST           => true,
    //         CURLOPT_POSTFIELDS     => json_encode($payload),
    //         CURLOPT_HTTPHEADER     => [
    //             'accept: application/json',
    //             'api-key: ' . $apiKey,
    //             'content-type: application/json'
    //         ],
    //         CURLOPT_TIMEOUT        => 15
    //     ]);

    //     $response = curl_exec($ch);
    //     $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    //     $curlError = curl_error($ch);
    //     curl_close($ch);

    //     if ($httpCode !== 201) {
    //         throw new Exception("Brevo says: HTTP $httpCode | Response: $response | cURL Error: $curlError", 500);
    //     }
    //     // --------------------------------------------------

    //     return [
    //         'success' => true,
    //         'message' => 'Reset code sent to your email. Please check your inbox.'
    //     ];
    // }
    public function requestPasswordReset($data) {
        $email = $data['email'] ?? '';
        if (empty($email)) {
            throw new Exception("Email is required", 400);
        }

        // Check if user exists
        $sql = "SELECT id, first_name FROM members WHERE email = ?";
        $user = $this->fetchOne($sql, [$email]);

        if (!$user) {
            throw new Exception("No account found with that email address", 404);
        }

        // Generate 5-digit OTP
        $otp = rand(10000, 99999);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Save OTP to database
        $this->update('members', [
            'reset_token' => $otp,
            'reset_expires_at' => $expiresAt
        ], 'id = ?', [$user['id']]);

        // ---------- SEND EMAIL VIA MAILER ----------
        require_once __DIR__ . '/Mailer.php';
        $mailer = new Mailer();
        
        $html = "
            <h2>Password Reset Code</h2>
            <p>Hello " . htmlspecialchars($user['first_name']) . ",</p>
            <p>Your password reset code is:</p>
            <h1 style='letter-spacing: 8px; color: #28a745;'>" . $otp . "</h1>
            <p>This code expires in <strong>15 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
        ";

        // This will throw a 429 exception if the daily limit is hit
        $mailer->sendEmail($email, $user['first_name'], 'Password Reset Code - Hub Church', $html);
        // --------------------------------------------------

        return [
            'success' => true,
            'message' => 'Reset code sent to your email. Please check your inbox.'
        ];
    }

    // 2. Reset Password (Verify OTP)
    public function resetPassword($data) {
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (empty($email) || empty($otp) || empty($newPassword)) {
            throw new Exception("Email, OTP, and new password are required", 400);
        }

        // Verify OTP and expiration
        $sql = "SELECT id FROM members WHERE email = ? AND reset_token = ? AND reset_expires_at > NOW()";
        $user = $this->fetchOne($sql, [$email, $otp]);

        if (!$user) {
            throw new Exception("Invalid or expired OTP. Please request a new one.", 401);
        }

        // Update password and clear OTP
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateData = [
            'password' => $hashedPassword,
            'reset_token' => null,
            'reset_expires_at' => null
        ];
        $this->update('members', $updateData, 'id = ?', [$user['id']]);

        return [
            'success' => true,
            'message' => 'Password reset successfully. You can now login.'
        ];
    }
        
        // 3. Verify Email Address (Level 4)
    public function verifyEmail($data) {
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';

        if (empty($email) || empty($otp)) {
            throw new Exception("Email and OTP code are required", 400);
        }

        // Check if the email and OTP match (no expiration check, as requested)
        $sql = "SELECT id FROM members WHERE email = ? AND verification_token = ?";
        $user = $this->fetchOne($sql, [$email, $otp]);

        if (!$user) {
            throw new Exception("Invalid OTP code or email address. Please try again.", 401);
        }

        // Update the user to verified, and clear the token
        $updateData = [
            'is_verified' => 1,
            'verification_token' => null
        ];
        $this->update('members', $updateData, 'id = ?', [$user['id']]);

        return [
            'success' => true,
            'message' => 'Email verified successfully! You can now log in.'
        ];
    }
}
?>