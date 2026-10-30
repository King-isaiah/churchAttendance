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
   
    // public function getMember($id) {
    //     try {
    //         $sql = "SELECT m.*, d.name as department_name FROM members m
    //             LEFT JOIN departments d ON m.department_id = d.id
    //             WHERE m.id = ?
    //         ";
    //         $result = $this->fetchOne($sql, [$id]);
            
    //         if (!$result) {
    //             throw new Exception("Member not found", 404);
    //         }
            
            
    //         if (!empty($result['department_id'])) {
    //             // Check if it's JSON array format
    //             if (strpos($result['department_id'], '[') === 0) {                 
    //                 $result['department_id'] = $result['department_id'];
    //             }               
    //         }
        
        
    //         return $result;
    //     } catch (Exception $e) {
    //         error_log("Member get error [ID: $id]: " . $e->getMessage());
    //         if ($e->getCode() === 404) {
    //             throw $e;
    //         }
    //         throw new Exception("Unable to retrieve member information");
    //     }
    // }
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
    public function getMemberByUniqueId($uniqueId) {
        try {
            $sql = "SELECT m.*, d.name as department_name FROM members m
                LEFT JOIN departments d ON m.department_id = d.id
                WHERE m.unique_id = ?
            ";
            $result = $this->fetchOne($sql, [$uniqueId]);
            
            if (!$result) {
                return false;
            }
            
            if (!empty($result['department_id'])) {
                if (strpos($result['department_id'], '[') === 0) {                 
                    $result['department_id'] = $result['department_id'];
                }               
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Member get by unique_id error: " . $e->getMessage());
            return false;
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
    public function bulkImportMembers($members) {
        $importedCount = 0;
        $failedCount = 0;

        foreach ($members as $row) {
            // Basic validation: Skip if missing essential data
            if (empty($row['first_name']) || empty($row['last_name'])) {
                $failedCount++;
                continue;
            }

            // Auto-generate a secure, unique ID if the admin didn't provide one
            // This guarantees no primary key clashes.
            if (empty($row['unique_id'])) {
                $row['unique_id'] = 'MEM_' . uniqid() . bin2hex(random_bytes(4));
            }

            // Map CSV data to your DB columns
            $memberData = [
                'unique_id' => $row['unique_id'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'] ?? '',
                'phone' => $row['phone'] ?? '',
                'department_id' => !empty($row['department_id']) ? $row['department_id'] : null,
                'status' => !empty($row['status']) ? $row['status'] : 1
            ];

            try {
                // Reuse your existing createMember method which handles validation, OTP, and inserts
                $result = $this->createMember($memberData);
                if ($result) {
                    $importedCount++;
                } else {
                    $failedCount++;
                }
            } catch (Exception $e) {
                // If one row fails (e.g., duplicate email), catch it, log it, and continue the loop
                error_log("Bulk import row failed: " . $e->getMessage());
                $failedCount++;
            }
        }

        return [
            'imported_count' => $importedCount,
            'failed_count' => $failedCount,
            'message' => "Successfully imported $importedCount members. ($failedCount skipped)."
        ];
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
    public function updateHeartbeat($userId) {
        try {
            // 1. Get the user's current last_activity and streak
            $user = $this->fetchOne("SELECT last_activity, current_streak FROM members WHERE id = ?", [$userId]);
            
            if (!$user) return;

            // Compare dates without the time to avoid issues
            $today = new DateTime(date('Y-m-d'));
            $currentStreak = (int)($user['current_streak'] ?? 0);
            $newStreak = $currentStreak;
            
            // 2. Calculate the streak
            if (!empty($user['last_activity'])) {
                // Get just the date part of the last activity
                $lastActivityDate = new DateTime(date('Y-m-d', strtotime($user['last_activity'])));
                
                // Difference in days
                $diff = $today->diff($lastActivityDate)->days;
                
                if ($diff == 1) {
                    // Logged in yesterday, increment streak
                    $newStreak = $currentStreak + 1;
                } elseif ($diff > 1) {
                    // Last login was more than a day ago, reset streak
                    $newStreak = 1;
                } elseif ($diff == 0) {
                    // Already logged in today, do nothing to streak
                    $newStreak = $currentStreak;
                }
            } else {
                // First time logging in
                $newStreak = 1;
            }

            // 3. Update the database with the new streak and current time
            $this->update('members', [
                'last_activity' => date('Y-m-d H:i:s'),
                'current_streak' => $newStreak
            ], 'id = ?', [$userId]);

            // 4. NEW: Update the session so the header reflects the new streak immediately!
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['current_streak'] = $newStreak;
            }

        } catch (Exception $e) {
            error_log("Heartbeat/Streak error: " . $e->getMessage());
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