<?php
require_once 'Database.php';

class Event extends Database {
    
   public function getAllEvents() {
    try {
        $sql = "SELECT e.*, 
                CASE 
                    WHEN e.department_id LIKE '[%' THEN 'Multiple Departments'
                    WHEN d.name IS NULL THEN 'All Departments'
                    ELSE d.name 
                END as department_name,
                l.name as location_name, 
                am.name AS attendanceName,
                c.categories AS category
            FROM events e 
            LEFT JOIN departments d ON e.department_id = d.id 
            LEFT JOIN locations l ON e.location_id = l.id
            LEFT JOIN categories c ON e.category_id = c.id 
            LEFT JOIN attendance_methods am ON e.attendance_method_id = am.id
            ORDER BY e.event_date DESC, e.event_time DESC 
        ";
       
        return $this->fetchAll($sql);
    } catch (Exception $e) {
        error_log("Activity getAll error: " . $e->getMessage());
        return [];
    }
}
   
    
public function getEvent($id) {
    try {
        $sql = "SELECT e.*, d.name as department_name, l.name as location_name, c.categories AS categories
            FROM events e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN locations l ON e.location_id = l.id
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.id = ?
        ";
        $result = $this->fetchOne($sql, [$id]);
        
        if (!$result) {
            throw new Exception("Event not found", 404);
        }
        
        // ========== FIX: Check if department_id is a JSON array ==========
        if (!empty($result['department_id'])) {
            // Check if it's JSON array format
            if (strpos($result['department_id'], '[') === 0) {
                // Parse JSON but keep it as string for frontend
                // Frontend will parse it in JavaScript
                $result['department_id'] = $result['department_id'];
            }
            // If it's a regular number, leave it as is
        }
        // ========== END FIX ==========
        
        return $result;
    } catch (Exception $e) {
        error_log("Event get error [ID: $id]: " . $e->getMessage());
        if ($e->getCode() === 404) {
            throw $e;
        }
        throw new Exception("Unable to retrieve event information");
    }
}
   


// public function updateEvent($id, $data) {
//     try {
//         // Same department_id handling as createEvent
//         if (isset($data['department_id'])) {
//             if (is_array($data['department_id'])) {
//                 $deptIds = array_filter($data['department_id'], function($val) {
//                     return $val !== '' && $val !== '0' && $val !== 0;
//                 });
//                 $data['department_id'] = empty($deptIds) ? null : json_encode(array_values($deptIds));
//             } else if ($data['department_id'] === '0' || $data['department_id'] === 0) {
//                 $data['department_id'] = null;
//             }
//         }
        
//         // Rest of your update code...
        
//         return $this->update('events', $data, 'id = ?', [$id]);
//     } catch (Exception $e) {
//         error_log("Event update error: " . $e->getMessage());
//         throw $e;
//     }
// }
public function createNotification($data) {
    try {
        // Basic validation
        if (empty($data['title']) || empty($data['message'])) {
            throw new Exception("Title and message are required", 400);
        }
        
        // Set defaults if not provided
        $defaults = [
            'is_active' => 1,
            'priority' => 'medium',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $data = array_merge($defaults, $data);
        
        return $this->insert('notifications', $data);
    } catch (Exception $e) {
        error_log("Notification create error: " . $e->getMessage());
        throw $e;
    }
}
public function createEvent($data) {
    try {
        $eventTitle = $data['title'] ?? '';
        $eventDescription = $data['description'] ?? 'New event has been scheduled.';
        
        // Handle department_id - convert array to JSON string
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
        $this->validateEventData($data);
        $eventId = $this->insert('events', $data);
        
        // ===== ADD NOTIFICATION FOR THE NEW EVENT =====
        try {
            // require_once 'Notification.php';            
            // $notification = new Notification();
            error_log("Creating notification for event: " . $eventTitle);
            error_log("Department IDs for notification: " . print_r($deptIdsForNotification, true));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
            $defs = [
                'title' => $eventTitle,                
                'message' => $eventDescription,
                'notification_type'=> 'event',
                'department_id'=> $data['department_id'],
                'expires_at' =>  $expiresAt  
            ];
            // $result = $notification->createNotification($defs);
            $result = $this->createNotification($defs);
            
            error_log("Notification result: " . print_r($result, true));
            
        } catch (Exception $e) {
            error_log("Failed to create notification for event: " . $e->getMessage());
        }
       
        
        // return $eventId ;
        return [
            'event_id' => $eventId,
            'notification_result' => $result
        ];
        
    } catch (Exception $e) {
        error_log("Event create error: " . $e->getMessage());
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
        
        // Same department_id handling as createEvent
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
        
        // ===== ADD VALIDATION =====
        $this->validateEventData($data, true);
        // ===== END VALIDATION =====
        
        // ===== ADD UPDATE NOTIFICATION =====
        try {
            require_once 'Notification.php';
            
            $notification = new Notification();
            
            // Get department IDs for notification
            $deptIdsForNotification = [];
            if (isset($data['department_id'])) {
                if (strpos($data['department_id'], '[') === 0) {
                    // It's a JSON array
                    $deptIdsForNotification = json_decode($data['department_id'], true);
                } elseif ($data['department_id']) {
                    // Single ID
                    $deptIdsForNotification = [$data['department_id']];
                }
            }
            
            // Create update notification
            $updateData = array_merge($existing, $data);
            $updateData['id'] = $id;
            
            // Create a special update notification (we'll modify the Notification class)
            $notification->addEventUpdateNotification($updateData, $deptIdsForNotification);
            
        } catch (Exception $e) {
            error_log("Failed to create update notification for event: " . $e->getMessage());
            // Don't fail the event update if notification fails
        }
        // ===== END UPDATE NOTIFICATION =====
        
        return $this->update('events', $data, 'id = ?', [$id]);
        
    } catch (Exception $e) {
        error_log("Event update error: " . $e->getMessage());
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
        $required = ['title'];
        
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