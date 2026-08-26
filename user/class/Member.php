<?php
 
    require_once 'Database.php';

    class Member extends Database {
        
        public function getAllMembers() {
            try {
                $sql = "
                    SELECT m.*, d.name as department_name
                    FROM members m
                    LEFT JOIN departments d ON m.department_id = d.id
                    ORDER BY m.created_at DESC
                ";
                return $this->fetchAll($sql);
            } catch (Exception $e) {
                error_log("Member getAll error: " . $e->getMessage());
                throw new Exception("Unable to retrieve members list");
            }
        }
        
        public function getMember($id) {
            try {
                $sql = "SELECT m.*, d.name AS department FROM members m 
                LEFT JOIN departments AS d ON m.department_id = d.id WHERE m.unique_id = ?
                ";
                $result = $this->fetchOne($sql, [$id]);
                
                if (!$result) {
                    throw new Exception("Member not found", 404);
                }
                
                return $result;
            } catch (Exception $e) {
                error_log("Member get error [ID: $id]: " . $e->getMessage());
                if ($e->getCode() === 404) {
                    throw $e;
                }
                throw new Exception("Unable to retrieve member information");
            }
        }
        

        public function loginUsers($data) {
            try {
                // Validate required fields
                if (empty($data['email']) || empty($data['password'])) {
                    throw new Exception("Email and password are required");
                }

                // Sanitize email
                $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception("Invalid email format");
                }

                $password = $data['password'];

                // Find member by email and password
                $sql = "SELECT m.*, d.name as department_name FROM members m
                    LEFT JOIN departments d ON m.department_id = d.id
                    WHERE m.email = ? AND m.password = ?
                ";
                $member = $this->fetchOne($sql, [$email, $password]);
                
                if (!$member) {
                    error_log("Individual does not exist for this: " . $email);
                    return false;
                }

                // Return user data without creating sessions
                return $member;

            } catch (Exception $e) {
                error_log("Authentication error: " . $e->getMessage() . " | Email: " . ($data['email'] ?? ''));
                throw $e;
            }
        }

        public function getMembersSession() {
            // Start session if not already started
            if (session_status() == PHP_SESSION_NONE) {
                session_start();
            }
            
            // Check if user is logged in first
            if (!isset($_SESSION['unique_id']) || empty($_SESSION['unique_id'])) {
                return null; 
            }
            
            // return [
            //     'unique_id' => 754555847,
            //     'first_name' => 'eshioze',
            //     'full_name' => 'afuwape eshiozemhe',
            //     'email' => 'eshiozemhe@gmail.com',
            //     'department' => 'excos'
            // ];
            return [
                'unique_id' => $_SESSION['unique_id'],
                'first_name' => $_SESSION['first'] ?? '',
                'full_name' => $_SESSION['full_name'] ?? '',
                'email' => $_SESSION['user_email'] ?? '',
                'department' => $_SESSION['user_department'] ?? ''
            ];
        }
        public function createMember($data) {
                try {
                    // Validate required fields
                    $this->validateMemberData($data);
                    
                    // Generate unique_id
                    $random_id = rand(time(), 10000000);
                    $data['unique_id'] = $random_id;
                    
                    // Set default values
                    $data['created_at'] = date('Y-m-d H:i:s');
                    
                    return $this->insert('members', $data);
                } catch (Exception $e) {
                    error_log("Member create error: " . $e->getMessage() . " | Data: " . json_encode($data));
                    throw $e;
                }
        }

        // for password hashing
        // public function createMember($data) {
        //     try {
        //         // Validate required fields
        //         $this->validateMemberData($data);
                
        //         // Hash password before storing
        //         if (isset($data['password'])) {
        //             $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        //         }
                
        //         // Generate unique_id
        //         $random_id = rand(time(), 10000000);
        //         $data['unique_id'] = $random_id;
                
        //         // Set default values
        //         $data['created_at'] = date('Y-m-d H:i:s');
                
        //         return $this->insert('members', $data);
        //     } catch (Exception $e) {
        //         error_log("Member create error: " . $e->getMessage() . " | Data: " . json_encode($data));
        //         throw $e;
        //     }
        // }
        
        public function updateMember($id, $data) {
            try {
                // Check if member exists first
                $existing = $this->getMember($id);
                if (!$existing) {
                    throw new Exception("Member not found", 404);
                }
                
                // Validate data
                // $this->validateMemberData($data, true);
                
                return $this->update('members', $data, 'unique_id = ?', [$id]);
                
            } catch (Exception $e) {
                error_log("Member update error [ID: $id]: " . $e->getMessage());
                throw $e;
            }
        }
        public function updatePassword($id, $data) {
            try {
                // Check if member exists first
                $existing = $this->getMember($id);
                if (!$existing) {
                    throw new Exception("Member not found", 404);
                }
                
                return $this->update('members', $data, 'unique_id = ?', [$id]);
                
            } catch (Exception $e) {
                error_log("Member update error [ID: $id]: " . $e->getMessage());
                throw $e;
            }
        }
        
        public function deleteMember($id) {
            try {
                $existing = $this->getMember($id);
                if (!$existing) {
                    throw new Exception("Member not found", 404);
                }
                
                // Delete the member directly (no attendance table)
                return $this->delete('members', 'id = ?', [$id]);
            } catch (Exception $e) {
                error_log("Member delete error [ID: $id]: " . $e->getMessage());
                throw $e;
            }
        }
        
        public function getMembersByDepartment($departmentId) {
            try {
                $sql = "
                    SELECT m.*, d.name as department_name
                    FROM members m
                    LEFT JOIN departments d ON m.department_id = d.id
                    WHERE m.department_id = ?
                    ORDER BY m.first_name, m.last_name
                ";
                return $this->fetchAll($sql, [$departmentId]);
            } catch (Exception $e) {
                error_log("Member getByDepartment error: " . $e->getMessage());
                throw new Exception("Unable to retrieve department members");
            }
        }
        
        private function validateMemberData($data, $isUpdate = false) {
            $required = ['first_name', 'last_name', 'email'];
            
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("$field is required", 400);
                }
            }
            
            // Validate email format
            if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Invalid email format", 400);
            }
            
            // Check for duplicate email
            if (isset($data['email'])) {
                $existingId = $isUpdate ? $data['id'] ?? null : null;
                if ($this->valueExists('members', 'email', $data['email'], $existingId)) {
                    throw new Exception("A member with this email already exists", 409);
                }
            }
            
            // Validate string lengths
            if (isset($data['first_name']) && strlen($data['first_name']) > 100) {
                throw new Exception("First name is too long", 400);
            }
            
            if (isset($data['last_name']) && strlen($data['last_name']) > 100) {
                throw new Exception("Last name is too long", 400);
            }
            
            if (isset($data['email']) && strlen($data['email']) > 255) {
                throw new Exception("Email is too long", 400);
            }
        }

        // for password hashing
        // public function authenticate($email, $password) {
        //     try {
        //         // Validate input
        //         if (empty($email) || empty($password)) {
        //             throw new Exception("Email and password are required");
        //         }

        //         // Sanitize email
        //         $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        //         if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        //             throw new Exception("Invalid email format");
        //         }

        //         // Find member by email using your existing fetchOne method
        //         $sql = "
        //             SELECT m.*, d.name as department_name
        //             FROM members m
        //             LEFT JOIN departments d ON m.department_id = d.id
        //             WHERE m.email = ?
        //         ";
        //         $member = $this->fetchOne($sql, [$email]);
                
        //         if (!$member) {
        //             error_log("Authentication failed: Member not found - " . $email);
        //             return false;
        //         }

        //         // Verify password (assuming you're using password hashing)
        //         if (password_verify($password, $member['password'])) {
        //             // Password is correct, return member data (excluding password)
        //             unset($member['password']);
        //             return $member;
        //         } else {
        //             error_log("Authentication failed: Invalid password for - " . $email);
        //             return false;
        //         }

        //     } catch (Exception $e) {
        //         error_log("Authentication error: " . $e->getMessage() . " | Email: " . $email);
        //         return false;
        //     }
        // }

        // without password hashing
        public function authenticate($email, $password) {
            try {
                // Validate input
                if (empty($email) || empty($password)) {
                    throw new Exception("Email and password are required");
                }

                // Sanitize email
                $email = filter_var($email, FILTER_SANITIZE_EMAIL);
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception("Invalid email format");
                }

                // Find member by email and password
                $sql = "SELECT m.*, d.name as department_name,m.department_id AS department_id
                    FROM members m LEFT JOIN departments d ON m.department_id = d.id
                    WHERE m.email = ? AND m.password = ?
                ";
                $member = $this->fetchOne($sql, [$email, $password]);
                
                if (!$member) {
                    error_log("Authentication failed for: " . $email);
                    return false;
                }

                // Remove password from returned data
                unset($member['password']);
                return $member;

            } catch (Exception $e) {
                error_log("Authentication error: " . $e->getMessage() . " | Email: " . $email);
                return false;
            }
        }
    }