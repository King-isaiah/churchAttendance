<?php
require_once 'Database.php';

class Auth extends Database {
    
    public function __construct() {
        parent::__construct();
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
                    FROM members m LEFT JOIN departments d ON m.primary_dept_id = d.id
                    WHERE m.user_name = ?";
        $user = $this->fetchOne($sql, [$user_name]);

        if (!$user) {
            throw new Exception("Invalid username or password", 401);
        }

        // Verify password
        $isValidPassword = false;
        if (password_verify($password, $user['password'])) {
            $isValidPassword = true; 
        } elseif ($password === $user['password']) {
            $isValidPassword = true; 
        }

        if (!$isValidPassword) {
            throw new Exception("Invalid username or password", 401);
        }

        if (isset($user['status']) && $user['status'] === 'inactive') {
            throw new Exception("Your account is deactivated. Please contact admin.", 403);
        }

        if (isset($user['is_verified']) && $user['is_verified'] == 0) {
            throw new Exception("Your email is not verified. Please check your inbox for the verification code.", 403);
        }

        // Heartbeat Update
        $updateData = ['status' => 'online'];
        $this->update('members', $updateData, 'id = ?', [$user['id']]);
        
        // Set Session Variables
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

        // =========================================================
        // INTEGRITY CHECK TRIGGER
        // =========================================================
        if (strtolower($_SESSION['user_role']) === 'admin') {
            $this->runIntegrityCheck(); 
        }
        // =========================================================

        // =========================================================
        // BIRTHDAY CHECK TRIGGER (Runs EVERY login for testing)
        // =========================================================
        $birthdayDebug = $this->triggerBirthdayCheck();

        unset($user['password']);
        $redirect = (strtolower($_SESSION['user_role']) === 'admin') ? 'admin/dashboard.php' : 'user/user_dashboard.php';
        
        return [
            'success' => true,
            'message' => 'Login successful',
            'user' => $user,
            'redirect' => $redirect,
            'birthday_debug' => $birthdayDebug 
        ];
    }

    private function triggerBirthdayCheck() {
        // Bypassed the 24-hour lock for testing as requested
        require_once __DIR__ . '/BirthdayNotifier.php';
        $notifier = new BirthdayNotifier();
        return $notifier->run(); 
    }

    private function runIntegrityCheck() {
        require_once __DIR__ . '/IntegrityCheck.php';
        
        $logFile = __DIR__ . '/integrity_log.txt';
        file_put_contents($logFile, "\n[" . date('Y-m-d H:i:s') . "] --- STARTING INTEGRITY CHECK ---\n", FILE_APPEND);
        
        $checker = new IntegrityCheck(); 
        $results = $checker->run(); 
        
        if (empty($results)) {
            file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] ✅ Database is healthy. No missing tables or rows found.\n", FILE_APPEND);
        } else {
            file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] ⚠️ ACTIONS TAKEN:\n" . implode("\n", $results) . "\n", FILE_APPEND);
        }
    }

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
                'current_streak' => $_SESSION['current_streak'],
            ];
        }
        return null;
    }
    
    public function logout() {
        if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
            $updateData = ['status' => 'offline'];
            $this->update('members', $updateData, 'id = ?', [$userId]);
        }
        session_unset();
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    public function requestPasswordReset($data) {
        $email = $data['email'] ?? '';
        if (empty($email)) throw new Exception("Email is required", 400);

        $sql = "SELECT id, first_name FROM members WHERE email = ?";
        $user = $this->fetchOne($sql, [$email]);

        if (!$user) throw new Exception("No account found with that email address", 404);

        $otp = rand(10000, 99999);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        $this->update('members', ['reset_token' => $otp, 'reset_expires_at' => $expiresAt], 'id = ?', [$user['id']]);

        require_once __DIR__ . '/Mailer.php';
        $mailer = new Mailer();
        $html = "<h2>Password Reset Code</h2><p>Hello " . htmlspecialchars($user['first_name']) . ",</p><p>Your password reset code is:</p><h1 style='letter-spacing: 8px; color: #28a745;'>" . $otp . "</h1><p>This code expires in <strong>15 minutes</strong>.</p>";
        $mailer->sendEmail($email, $user['first_name'], 'Password Reset Code - Hub Church', $html);

        return ['success' => true, 'message' => 'Reset code sent to your email.'];
    }

    public function resetPassword($data) {
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (empty($email) || empty($otp) || empty($newPassword)) throw new Exception("All fields are required", 400);

        $sql = "SELECT id FROM members WHERE email = ? AND reset_token = ? AND reset_expires_at > NOW()";
        $user = $this->fetchOne($sql, [$email, $otp]);

        if (!$user) throw new Exception("Invalid or expired OTP.", 401);

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->update('members', ['password' => $hashedPassword, 'reset_token' => null], 'id = ?', [$user['id']]);

        return ['success' => true, 'message' => 'Password reset successfully.'];
    }
        
    public function verifyEmail($data) {
        $email = $data['email'] ?? '';
        $otp = $data['otp'] ?? '';

        if (empty($email) || empty($otp)) throw new Exception("Email and OTP required", 400);

        $sql = "SELECT id FROM members WHERE email = ? AND verification_token = ?";
        $user = $this->fetchOne($sql, [$email, $otp]);

        if (!$user) throw new Exception("Invalid OTP code.", 401);

        $this->update('members', ['is_verified' => 1, 'verification_token' => null], 'id = ?', [$user['id']]);

        return ['success' => true, 'message' => 'Email verified successfully!'];
    }
}
?>