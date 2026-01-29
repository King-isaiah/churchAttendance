<?php
require_once 'Database.php';

class Notification extends Database {
    
    public function getAllNotifications() {
        try {
            $sql = "SELECT n.*, d.name as department_name 
                    FROM notifications n
                    LEFT JOIN departments d ON n.department_id = d.id
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    ORDER BY 
                        CASE n.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                        END,
                        n.created_at DESC";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Notification getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getNotificationsForUser($userId) {
        try {
            // Get user's department
            $userSql = "SELECT department_id FROM users WHERE id = ?";
            $user = $this->fetchOne($userSql, [$userId]);
            
            if (!$user) {
                return [];
            }
            
            $userDeptId = $user['department_id'];
            
            // Get notifications: either global (department_id IS NULL) OR for user's department
            $sql = "SELECT n.* 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (n.department_id IS NULL OR n.department_id = ?)
                    ORDER BY 
                        CASE n.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                        END,
                        n.created_at DESC";
            
            return $this->fetchAll($sql, [$userDeptId]);
        } catch (Exception $e) {
            error_log("Notification getForUser error: " . $e->getMessage());
            return [];
        }
    }
    
    public function createNotification($data) {
        try {
            // Basic validation
            if (empty($data['title']) || empty($data['message'])) {
                throw new Exception("Title and message are required", 400);
            }
            
            // Set default created_at if not provided
            if (!isset($data['created_at'])) {
                $data['created_at'] = date('Y-m-d H:i:s');
            }
            
            // Set created_by if not provided
            if (!isset($data['created_by'])) {
                // You can set a default or get from session
                $data['created_by'] = 1; // Default admin user
            }
            
            return $this->insert('notifications', $data);
        } catch (Exception $e) {
            error_log("Notification create error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function deleteNotification($id) {
        try {
            // Soft delete by setting is_active = 0
            $sql = "UPDATE notifications SET is_active = 0 WHERE id = ?";
            $stmt = $this->executeQuery($sql, [$id]);
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("Notification delete error: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function markExpired() {
        try {
            // Mark expired notifications as inactive
            $sql = "UPDATE notifications SET is_active = 0 
                    WHERE expires_at IS NOT NULL 
                    AND expires_at <= NOW() 
                    AND is_active = 1";
            $stmt = $this->executeQuery($sql);
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("Notification markExpired error: " . $e->getMessage());
            return 0;
        }
    }
    
    // Simple method to add event notification
    public function addEventNotification($eventData, $createdBy = 1) {
        try {
            $notification = [
                'title' => 'New Event: ' . $eventData['title'],
                'message' => $eventData['description'] ?? 'New event has been scheduled.',
                'notification_type' => 'event',
                'department_id' => $eventData['department_id'] ?? NULL,
                'priority' => 'medium',
                'created_by' => $createdBy,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days')) // Expire after 7 days
            ];
            
            return $this->createNotification($notification);
        } catch (Exception $e) {
            error_log("Event notification error: " . $e->getMessage());
            return false;
        }
    }
    
    // Simple method to add activity notification
    public function addActivityNotification($activityData, $createdBy = 1) {
        try {
            $notification = [
                'title' => 'New Activity: ' . $activityData['name'],
                'message' => $activityData['description'] ?? 'New activity is now available.',
                'notification_type' => 'activity',
                'department_id' => $activityData['department_id'] ?? NULL,
                'priority' => 'medium',
                'created_by' => $createdBy,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+5 days'))
            ];
            
            return $this->createNotification($notification);
        } catch (Exception $e) {
            error_log("Activity notification error: " . $e->getMessage());
            return false;
        }
    }
}
?>