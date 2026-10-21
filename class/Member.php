<?php
require_once 'Database.php';

class Member extends Database {
    
    
    public function getAllMembers() {
        try {
            $sql = "SELECT m.*, 
                CASE 
                    WHEN m.department_id LIKE '[%' THEN 'Multiple Departments'
                    ELSE d.name 
                END as department_name,
                p.name as primary_dept_name
                FROM members m
                LEFT JOIN departments d ON m.department_id = d.id
                LEFT JOIN departments p ON m.primary_dept_id = p.id
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
            $sql = "SELECT m.*, d.name as department_name FROM members m
                LEFT JOIN departments d ON m.department_id = d.id
                WHERE m.id = ?
            ";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Member not found", 404);
            }
            
            
            if (!empty($result['department_id'])) {
                // Check if it's JSON array format
                if (strpos($result['department_id'], '[') === 0) {                 
                    $result['department_id'] = $result['department_id'];
                }               
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
    
public function createMember($data) {
    try {
        // Validate required fields
        $this->validateMemberData($data);
        
        // Generate unique_id
        $random_id = rand(time(), 10000000);
        $data['unique_id'] = $random_id;
        
        // --- LEVEL 4: GENERATE OTP FOR EMAIL VERIFICATION ---
        $otp = rand(100000, 999999);
        $data['is_verified'] = 0;
        $data['verification_token'] = $otp;
        $data['verification_expires_at'] = null; // No expiration as requested
        // ----------------------------------------------------

        if (isset($data['department_id'])) {
            if (is_array($data['department_id'])) {                    
                $deptIds = array_filter($data['department_id'], function($val) {
                    return $val !== ''  && $val !== 0;
                });
                
                if (empty($deptIds)) {
                    $data['department_id'] = null;
                    $deptIdsForNotification = null;
                } else {
                    $data['department_id'] = json_encode(array_values($deptIds));
                    $deptIdsForNotification = $deptIds; 
                }
            } else if ($data['department_id'] === '0' || $data['department_id'] === 0) {
                $data['department_id'] = null;
                $deptIdsForNotification = null;
            } else {
                $deptIdsForNotification = [$data['department_id']];
            }
        } else {
            $data['department_id'] = null;
            $deptIdsForNotification = null;
        }

        try {
            $memberTitle = $data['first_name'] ?? '';
            $eventDescription = $data['first_name'] . ' ' . 'has joined your department workforce.';                          
            $notification = new Notification();
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
            $defs = [
                'title' => 'New Member',                
                'message' => $eventDescription,
                'notification_type'=> 'member',
                'department_id'=> $data['department_id'],
                'expires_at' =>  $expiresAt  
            ];
            $notification->createNotification($defs);
        } catch (Exception $e) {
            error_log("Failed to create notification for event: " . $e->getMessage());
        }
        
        $data['created_at'] = date('Y-m-d H:i:s');
        
        // Insert the member into the database
        $membersP = $this->insert('members', $data);

        // --- LEVEL 4: SEND THE OTP EMAIL VIA MAILER ---
        try {
            require_once __DIR__ . '/Mailer.php';
            $mailer = new Mailer();
            
            $html = "
                <h2>Welcome to Hub Church!</h2>
                <p>Hello " . htmlspecialchars($data['first_name']) . ",</p>
                <p>Your account has been created. Please use the code below to verify your email address:</p>
                <h1 style='letter-spacing: 8px; color: #28a745;'>" . $otp . "</h1>
                <p>You will not be able to log in until this code is entered.</p>
            ";
            
            // This will throw an exception if the 270 daily limit is hit
            $mailer->sendEmail($data['email'], $data['first_name'], 'Verify Your Email - Hub Church', $html);
            
        } catch (Exception $e) {
            // If the limit is reached, the user is still created, but they won't get the email.
            // We log it so the admin knows they need to manually verify this user later.
            error_log("Failed to send OTP email: " . $e->getMessage());
        }
        // ----------------------------------------------
        
        return [
            'members' => $membersP,
            'notification_result' => true
        ];

    } catch (Exception $e) {
        error_log("Member create error: " . $e->getMessage() . " | Data: " . json_encode($data));
        throw $e;
    }
}
    
    public function updateMember($id, $data) {
        try {     
            $existing = $this->getMember($id);
            if (!$existing) {
                throw new Exception("Member not found", 404);
            }

            // --- FIX: Prevent overwriting password with an empty string ---
            if (isset($data['password'])) {
                if (empty(trim($data['password']))) {
                    // If the admin left the password blank, remove it so we don't update it
                    unset($data['password']); 
                }
            }
            // -------------------------------------------------------------

            if (isset($data['department_id'])) {
                if (is_array($data['department_id'])) {
                    $deptIds = array_filter($data['department_id'], function($val) {
                        return $val !== '' && $val !== '0' && $val !== 0;
                    });
                    $data['department_id'] = empty($deptIds) ? null : json_encode(array_values($deptIds));
                } else if ($data['department_id'] === '0' || $data['department_id'] === 0) {
                    $data['department_id'] = null;
                }
            }
            
            $this->validateMemberData($data, true);
            
            $id =  $this->update('members', $data, 'id = ?', [$id]);             
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Update Member. Please try again or call dev.',
                    'status' => 400 
                ];                
            }
            return [
                'success' => true,
                'id' => $id,
                'message' => "Member '{$data['user_name']}' updated."
            ];
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
    
    // private function validateMemberData($data, $isUpdate = false) {
    //     $required = ['first_name', 'last_name', 'email'];
        
    //     foreach ($required as $field) {
    //         if (empty($data[$field])) {
    //             throw new Exception("$field is required", 400);
    //         }
    //     }
        
    //     // Validate email format
    //     if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    //         throw new Exception("Invalid email format", 400);
    //     }
        
    //     // Check for duplicate email
    //     if (isset($data['email'])) {
    //         $existingId = $isUpdate ? $data['id'] ?? null : null;
    //         if ($this->valueExists('members', 'email', $data['email'], $existingId)) {
    //             throw new Exception("A member with this email already exists", 409);
    //         }
    //     }
    //     // Level 3: Check if the domain actually exists and can receive emails
    //     if (isset($data['email'])) {
    //         // Extract the domain from the email (e.g., "gmail.com")
    //         $domain = substr(strrchr($data['email'], "@"), 1);
            
    //         // Check for MX records (Mail Exchanger) or A records (fallback)
    //         if (!checkdnsrr($domain, 'MX') && !checkdnsrr($domain, 'A')) {
    //             throw new Exception("The email domain '$domain' does not exist or cannot receive emails.", 400);
    //         }
    //     }
        
    //     // Validate string lengths
    //     if (isset($data['first_name']) && strlen($data['first_name']) > 100) {
    //         throw new Exception("First name is too long", 400);
    //     }
        
    //     if (isset($data['last_name']) && strlen($data['last_name']) > 100) {
    //         throw new Exception("Last name is too long", 400);
    //     }
        
    //     if (isset($data['email']) && strlen($data['email']) > 255) {
    //         throw new Exception("Email is too long", 400);
    //     }
    // }
private function validateMemberData($data, $isUpdate = false) {
    $required = ['first_name', 'last_name', 'email'];
    
    // 1. Check Required
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("$field is required", 400);
        }
    }
    
    if (isset($data['email'])) {
        // 2. Check Format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format", 400);
        }

        // 3. Check Length (Moved UP to prevent long-string DNS lookups)
        if (strlen($data['email']) > 255) {
            throw new Exception("Email is too long", 400);
        }
        
        // 4. Check for duplicate email
        $existingId = $isUpdate ? ($data['id'] ?? null) : null;
        if ($this->valueExists('members', 'email', $data['email'], $existingId)) {
            throw new Exception("A member with this email already exists", 409);
        }

        
        // 5. Level 3: Check DNS Records (MX ONLY)
        $domain = substr(strrchr($data['email'], "@"), 1);
        if (!checkdnsrr($domain, 'MX')) {
            throw new Exception("The email domain '$domain' does not have a valid mail server (MX record).", 400);
        }
    }
    
    // Validate string lengths for names
    if (isset($data['first_name']) && strlen($data['first_name']) > 100) {
        throw new Exception("First name is too long", 400);
    }
    
    if (isset($data['last_name']) && strlen($data['last_name']) > 100) {
        throw new Exception("Last name is too long", 400);
    }
}
}