<?php
require_once 'Database.php';

class Event extends Database {
    
    public function getAllEvents() {
        try {
            $sql = "
                SELECT e.*, d.name as department_name, l.name as location_name
                FROM events e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN locations l ON e.location_id = l.id
                ORDER BY e.event_date DESC, e.event_time DESC
            ";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Event getAll error: " . $e->getMessage());
            throw new Exception("Unable to retrieve events list");
        }
    }
    
    public function getEvent($id) {
        try {
            $sql = "
                SELECT e.*, d.name as department_name, l.name as location_name
                FROM events e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN locations l ON e.location_id = l.id
                WHERE e.id = ?
            ";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Event not found", 404);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Event get error [ID: $id]: " . $e->getMessage());
            if ($e->getCode() === 404) {
                throw $e;
            }
            throw new Exception("Unable to retrieve event information");
        }
    }
    
    public function createEvent($data) {
        try {
            // Validate required fields
            $this->validateEventData($data);
            
            // Set default values
            $data['created_at'] = date('Y-m-d H:i:s');
            
            return $this->insert('events', $data);
        } catch (Exception $e) {
            error_log("Event create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e;
        }
    }
    
    public function updateEvent($id, $data) {
        try {
            // Check if event exists first
            $existing = $this->getEvent($id);
            if (!$existing) {
                throw new Exception("Event not found", 404);
            }
            
            // Validate data
            $this->validateEventData($data, true);
            
            return $this->update('events', $data, 'id = ?', [$id]);
            
        } catch (Exception $e) {
            error_log("Event update error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function deleteEvent($id) {
        try {
            $existing = $this->getEvent($id);
            if (!$existing) {
                throw new Exception("Event not found", 404);
            }
            
            return $this->delete('events', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Event delete error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getEventsByDateRange($startDate, $endDate) {
        try {
            $sql = "
                SELECT e.*, d.name as department_name, l.name as location_name
                FROM events e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN locations l ON e.location_id = l.id
                WHERE e.event_date BETWEEN ? AND ?
                ORDER BY e.event_date, e.event_time
            ";
            return $this->fetchAll($sql, [$startDate, $endDate]);
        } catch (Exception $e) {
            error_log("Event getByDateRange error: " . $e->getMessage());
            throw new Exception("Unable to retrieve events for date range");
        }
    }
    
    public function getEventsByMonth($year, $month) {
        try {
            $startDate = "$year-$month-01";
            $endDate = "$year-$month-" . date('t', strtotime($startDate));
            
            $sql = "
                SELECT e.*, d.name as department_name, l.name as location_name
                FROM events e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN locations l ON e.location_id = l.id
                WHERE e.event_date BETWEEN ? AND ?
                ORDER BY e.event_date, e.event_time
            ";
            return $this->fetchAll($sql, [$startDate, $endDate]);
        } catch (Exception $e) {
            error_log("Event getByMonth error: " . $e->getMessage());
            throw new Exception("Unable to retrieve events for month");
        }
    }
    
  
    
    private function validateEventData($data, $isUpdate = false) {
        $required = ['title', 'event_date', 'event_time', 'location_id'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400);
            }
        }
        
        // Validate date format
        if (isset($data['event_date']) && !$this->isValidDate($data['event_date'])) {
            throw new Exception("Invalid event date format", 400);
        }
        
        // Validate time format
        if (isset($data['event_time']) && !$this->isValidTime($data['event_time'])) {
            throw new Exception("Invalid event time format", 400);
        }
        
        // Validate string lengths
        if (isset($data['title']) && strlen($data['title']) > 255) {
            throw new Exception("Event title is too long", 400);
        }
        
        if (isset($data['description']) && strlen($data['description']) > 1000) {
            throw new Exception("Event description is too long", 400);
        }
        
        // Check for duplicate events (same title, date, and time)
        if (isset($data['title']) && isset($data['event_date']) && isset($data['event_time'])) {
            $existingId = $isUpdate ? ($data['id'] ?? null) : null;
            
            if ($isUpdate) {
                // For update: check if there's more than one duplicate (excluding current event)
                $existingCount = $this->countEventDuplicates($data['title'], $data['event_date'], $data['event_time'], $existingId);
                if ($existingCount > 0) {
                    throw new Exception("An event with the same title, date, and time already exists", 409);
                }
            } else {
                // For create: check if any duplicate exists
                if ($this->valueExists('events', 'title', $data['title'], $existingId, [
                    'event_date' => $data['event_date'],
                    'event_time' => $data['event_time']
                ])) {
                    throw new Exception("An event with the same title, date, and time already exists", 409);
                }
            }
        }
    }
    
    private function countEventDuplicates($title, $date, $time, $excludeId = null) {
        $sql = "SELECT COUNT(*) as count FROM events WHERE title = ? AND event_date = ? AND event_time = ?";
        $params = [$title, $date, $time];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $result = $this->fetchOne($sql, $params);
        return $result['count'];
    }
    
    private function isValidDate($date) {
        return (bool)strtotime($date);
    }
    
    private function isValidTime($time) {
        return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time);
    }
}
?>