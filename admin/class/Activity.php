<?php
require_once 'Database.php';

class Activity extends Database {
    
    public function getAllActivities() {
        try {
            $sql = "SELECT activities.*,locations.name AS location,attendance_methods.code AS code, statuses.name AS status,
                categories.categories AS category FROM activities
                LEFT JOIN attendance_methods ON  activities.attendance_method_id = attendance_methods.id 
                LEFT JOIN statuses ON  activities.status_id = statuses.id 
                LEFT JOIN locations ON activities.location_id = locations.id 
                LEFT JOIN categories ON activities.category_id = categories.id
                WHERE deleted IS NULL
                ORDER BY dayofactivity DESC, time DESC 
            ";
           
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Activity getAll error: " . $e->getMessage());
            return [];
        }
    }
    public function getDaysOfTheWeek() {
        try {
            $sql = "SELECT DISTINCT dayofactivity FROM activities";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Activity getAll error: " . $e->getMessage());
            return [];
        }
    }
    
  public function getActivity($id) {
    try {
        // Get activity with department names using JSON functions
        $sql = "SELECT activities.*, 
                    locations.name AS location, 
                    attendance_methods.code AS attendance_method, 
                    statuses.name AS status,
                    categories.categories AS category,
                   
                    (
                        SELECT GROUP_CONCAT(d.name SEPARATOR ', ')
                        FROM departments d
                        WHERE JSON_CONTAINS(
                            activities.department_id, 
                            CONCAT('\"', d.id, '\"')
                        )
                    ) AS department_names,
                    -- Get department IDs as array
                    activities.department_id AS department_ids_json
                FROM activities 
                LEFT JOIN statuses ON activities.status_id = statuses.id 
                LEFT JOIN categories ON activities.category_id = categories.id 
                LEFT JOIN locations ON activities.location_id = locations.id 
                LEFT JOIN attendance_methods ON activities.attendance_method_id = attendance_methods.id 
                WHERE activities.id = ?";
        
        $result = $this->fetchOne($sql, [$id]);
        
        if (!$result) {
            throw new Exception("Activity not found", 404);
        }
        
        // Handle department_id which is stored as JSON array
        if (!empty($result['department_ids_json'])) {
            try {
                // Decode the JSON array
                $departmentIds = json_decode($result['department_ids_json'], true);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($departmentIds)) {
                    // Add department IDs as array
                    $result['department_id'] = $departmentIds;
                    
                    // Get full department details if needed
                    if (!empty($departmentIds)) {
                        $placeholders = implode(',', array_fill(0, count($departmentIds), '?'));
                        
                        $deptSql = "SELECT id, name FROM departments WHERE id IN ($placeholders)";
                        $departments = $this->fetchAll($deptSql, $departmentIds);
                        
                        $result['departments'] = $departments;
                    } else {
                        $result['departments'] = [];
                    }
                } else {
                    // If not valid JSON
                    $result['department_id'] = [];
                    $result['departments'] = [];
                }
            } catch (Exception $e) {
                error_log("Error decoding department_id JSON for activity $id: " . $e->getMessage());
                $result['department_id'] = [];
                $result['departments'] = [];
            }
        } else {
            $result['department_id'] = [];
            $result['departments'] = [];
        }
        
        // Remove the raw JSON field
        unset($result['department_ids_json']);
        
        return $result;
    } catch (Exception $e) {
        error_log("Activity get error [ID: $id]: " . $e->getMessage());
        if ($e->getCode() === 404) {
            throw $e; 
        }
        throw new Exception("Unable to retrieve activity information");
    }
}
    
    public function createActivity($data) {
        try {
            $activityTitle = $data['title'] ?? '';
            $activityDescription = $data['description'] ?? 'New activity has been scheduled.';
            if (isset($data['department_id'])) {
                if (is_array($data['department_id'])) {
                    // Filter out empty values and 0
                    $deptIds = array_filter($data['department_id'], function($val) {
                        return $val !== '' && $val !== '0' && $val !== 0;
                    });
                    
                    if (empty($deptIds)) {
                        $data['department_id'] = null;
                        $deptIdsForNotification = null;
                    } else {
                        // Store as JSON array string
                        $data['department_id'] = json_encode(array_values($deptIds));
                        $deptIdsForNotification = $deptIds; // Keep as array
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
            $this->validateActivityData($data);
            $activity =$this->insert('activities', $data);
            

           try {
                error_log("Department IDs for notification: " . print_r($deptIdsForNotification, true));               
                $memberTitle = $data['name'] ?? '';
                $eventDescription = $data['name'] . ' ' . 'A new activity has been scheduled.';                          
                $notification = new Notification();
                error_log("Creating notification for activity: " . $memberTitle);
                $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
                $defs = [
                    'title' => 'New Activity',                
                    'message' => $eventDescription,
                    'notification_type'=> 'activity',
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
            
            // $membersP = $this->insert('members', $data);
            return [
               'activity_id' => $activity,
                'notification_result' => $result
            ];
           
        } catch (Exception $e) {
            error_log("Activity create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; 
        }
    }
    
    public function updateActivity($id, $data) {
        try {
            // Check if activity exists first
            $existing = $this->getActivity($id);
            if (!$existing) {
                throw new Exception("Activity not found", 404);
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
            
            $this->validateActivityData($data, true);
            
            return $this->update('activities', $data, 'id = ?', [$id]);
            
        } catch (Exception $e) {
            error_log("Activity update error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function deleteActivity($id) {
        try {
            $existing = $this->getActivity($id);
            
            if (!$existing) {
                throw new Exception("Activity not found", 404);
            }
            
            $data = ['deleted' => 'yes'];
            // return $this->delete('activities', 'id = ?', [$id]);
            return $this->update('activities', $data, 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Activity delete error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getActivityCategories() {
        try {
            $sql = "SELECT DISTINCT category FROM activities WHERE category IS NOT NULL AND category != '' ORDER BY category";
            $results = $this->fetchAll($sql);
            
            $categories = ['All'];
            foreach ($results as $result) {
                $categories[] = $result['category'];
            }
            
            return $categories;
        } catch (Exception $e) {
            error_log("Activity getCategories error: " . $e->getMessage());
            return ['All', 'Worship', 'Education', 'Social', 'Spiritual', 'Volunteer'];
        }
    }
    
    public function getActivityStatuses() {
        return ['All', 'Active', 'Upcoming', 'Completed', 'Cancelled'];
    }
    
    private function validateActivityData($data, $isUpdate = false) {
        $required = ['name', 'category_id', 'dayofactivity', 'time', 'location_id', 'attendance_method_id', 'status_id'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400); 
            }
        }
        
               
        // Validate time format
        // if (isset($data['time']) && !$this->isValidTime($data['time'])) {
        //     throw new Exception("Invalid time format", 400);
        // }
        
       
        
        if (isset($data['name']) && strlen($data['name']) > 255) {
            throw new Exception("Activity name is too long", 400);
        }
        
        if (isset($data['expected_count']) && (!is_numeric($data['expected_count']) || $data['expected_count'] < 0)) {
            throw new Exception("Expected count must be a positive number", 400);
        }
    }
    
    
    
    private function isValidTime($time) {
        return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time);
    }
  

}
?>