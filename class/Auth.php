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

        $updateData = ['status' => 'online'];
        $this->update('members', $updateData, 'id = ?', [$user['id']]);
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

        // Remove password from returned data
        unset($user['password']);

        // Determine redirect based on role
        $redirect = ($_SESSION['user_role'] === 'admin') ? 'admin/dashboard.php' : 'user/user_dashboard.php';
        // $data = [

        // ];
        // $id =  $this->update('members', $data, 'id = ?', [$id]); 
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
                'last_name' => $_SESSION['last_name'],
                'last_name' => $_SESSION['last_name'],
                'last_name' => $_SESSION['last_name'],
                'last_name' => $_SESSION['last_name'],
            ];
        }
        return null; // Not logged in
    }

    public function logout() {
        session_unset();
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
}
?>