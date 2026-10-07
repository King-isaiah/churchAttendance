<?php
require_once 'Database.php';

class Activity extends Database {
    
    public function getLocationActivitiesWithLocationCoordinate() {
       try {  
            function getToday() {
                $today = new DateTime();
                $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return $days[$today->format('w')]; 
            }   
            function getCurrentTime() {
                $now = new DateTime();
                $hours = (int)$now->format('G');  // 0-23, no leading zeros
                $minutes = (int)$now->format('i'); // 00-59
                $seconds = (int)$now->format('s'); // 00-59
                
                return [
                    'hours' => $hours,
                    'minutes' => $minutes,
                    'seconds' => $seconds
                ];
            }

           
            $time = getCurrentTime();                
            $day = getToday(); 
            $test = 'Sunday';   
            $timeString = sprintf('%02d:%02d:%02d', $time['hours'], $time['minutes'], $time['seconds']);          
            $sql = "SELECT activities.*, locations.longitude AS longtitude, locations.latitude AS latitude 
            FROM activities LEFT JOIN locations ON activities.location_id = locations.id 
            WHERE status_id = 1 AND attendance_method_id = 3 AND time_exp > ? AND dayofactivity = ?";            
                  
            $result = $this->fetchAll($sql, [$timeString, $day]);
            // $result = $this->fetchAll($sql, [$timeString, $test]);            
            if(count($result) > 0 ){
                return $result;
            }else{
                return []; 
            }
        } catch (Exception $e) {
            error_log("Activity to get error [department: $day]: " . $e->getMessage());
            if ($e->getCode() === 404) {
                throw $e; 
            }
            throw new Exception("Unable to retrieve activity information for checking for submition of attendance");
        }
    }
    public function getAllActivities() {
        try {
            $sql = "SELECT activities.*,activities.description AS description, activities.name AS activity,locations.name AS location,
                attendance_methods.code AS code, statuses.name AS status, statuses.color AS color, categories.categories AS category FROM activities
                LEFT JOIN attendance_methods ON  activities.attendance_method_id = attendance_methods.id 
                LEFT JOIN statuses ON  activities.status_id = statuses.id 
                LEFT JOIN locations ON activities.location_id = locations.id 
                LEFT JOIN categories ON activities.category_id = categories.id
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
            $sql = "SELECT activities.*, locations.name AS location, 
                attendance_methods.code AS attendance_method,statuses.name AS status,
                 categories.categories AS category 
                FROM activities LEFT JOIN statuses ON  activities.status_id = statuses.id 
                LEFT JOIN categories ON activities.category_id = categories.id 
                LEFT JOIN locations ON activities.location_id = locations.id 
                LEFT JOIN attendance_methods ON activities.attendance_method_id = attendance_methods.id 
                WHERE activities.id = ?";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Activity not found", 404);
            }
            
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
        // Debug: log what's being received
        error_log("Department ID received: " . print_r($data['department_id'] ?? 'Not set', true));
        
   
        
        $this->validateActivityData($data);
        
        // Debug the final data before insert
        error_log("Final data for insert: " . json_encode($data));
        
        return $this->insert('activities', $data);
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
            
            // Validate data
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
            
            return $this->delete('activities', 'id = ?', [$id]);
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