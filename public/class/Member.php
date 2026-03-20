<?php
require_once 'Database.php';

class Member extends Database {
    
    public function getAllMembers() {
        try {
            $sql = "SELECT m.*, CASE 
                    WHEN m.department_id LIKE '[%' THEN 'Multiple Departments'
                    ELSE d.name 
                END as department_name
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
            
            // $fullname = $data['first_name'] . $data['last_name'];
            // $randomLetters = substr(str_shuffle($fullname), 0, 2);
            if (isset($data['department_id'])) {
                if (is_array($data['department_id'])) {                    
                    $deptIds = array_filter($data['department_id'], function($val) {
                        return $val !== ''  && $val !== 0;
                    });
                    
                    if (empty($deptIds)) {
                        $data['department_id'] = null;
                        $deptIdsForNotification = null;
                    } else {
                        // Store as JSON array string
                        $data['department_id'] = json_encode(array_values($deptIds));
                        $deptIdsForNotification = $deptIds; 
                    }
                } else if ($data['department_id'] === '0' || $data['department_id'] === 0) {
                    $data['department_id'] = null;
                    $deptIdsForNotification = null;
                } else {
                    // Single department ID
                    $deptIdsForNotification = [$data['department_id']];
                }
            } else {
                $data['department_id'] = null;
                $deptIdsForNotification = null;
            }
            try {
                error_log("Department IDs for notification: " . print_r($deptIdsForNotification, true));               
                $memberTitle = $data['first_name'] ?? '';
                $eventDescription = $data['first_name'] . ' ' . 'has joined your department workforce.';                          
                $notification = new Notification();
                error_log("Creating notification for newMember: " . $memberTitle);
                $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
                $defs = [
                    'title' => 'New Member',                
                    'message' => $eventDescription,
                    'notification_type'=> 'member',
                    'department_id'=> $data['department_id'],
                    'expires_at' =>  $expiresAt  
                ];
                $result = $notification->createNotification($defs);
               
                error_log("Notification result: " . print_r($result, true));
                
            } catch (Exception $e) {
                error_log("Failed to create notification for event: " . $e->getMessage());
            }
            
            // Set default values
            $data['created_at'] = date('Y-m-d H:i:s');
            
            $membersP = $this->insert('members', $data);
            return [
                'members' => $membersP,
                'notification_result' => $result
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
            
            return $this->update('members', $data, 'id = ?', [$id]);
            
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
}