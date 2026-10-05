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
    
public function getNotificationsForMember($memberId) {
    try {
      
        $memberDeptId = $memberId;
        
        // Get notifications: 
        // 1. Global (department_id IS NULL) that is notifcation for all users or workers
        // 2. For member's specific department (department_id = '123')
        // 3. For member's department in JSON arrays (department_id LIKE '%"123"%')
        $sql = "SELECT n.* FROM notifications n WHERE n.is_active = 1 
                AND (n.expires_at IS NULL OR n.expires_at > NOW())
                AND (
                    n.department_id IS NULL 
                    OR n.department_id = ? 
                    OR (n.department_id LIKE '[%' AND n.department_id LIKE ?)
                )
                ORDER BY 
                    CASE n.priority 
                        WHEN 'high' THEN 1 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 3 
                    END,
                    n.created_at DESC";
        
        // Search for member's department ID in JSON arrays
        $jsonSearch = '%"' . $memberDeptId . '"%';
        
        return $this->fetchAll($sql, [$memberDeptId, $jsonSearch]);
    } catch (Exception $e) {
        error_log("Notification getForMember error: " . $e->getMessage());
        return $this->getGlobalNotifications(); // Return global on error
    }
}
    
public function getNotificationsForDepartment($departmentId) {
    try {
        $sql = "SELECT n.* 
                FROM notifications n
                WHERE n.is_active = 1 
                AND (n.expires_at IS NULL OR n.expires_at > NOW())
                AND (
                    n.department_id IS NULL 
                    OR n.department_id = ? 
                    OR (n.department_id LIKE '[%' AND n.department_id LIKE ?)
                )
                ORDER BY 
                    CASE n.priority 
                        WHEN 'high' THEN 1 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 3 
                    END,
                    n.created_at DESC";
        
        $jsonSearch = '%"' . $departmentId . '"%';
        
        return $this->fetchAll($sql, [$departmentId, $jsonSearch]);
    } catch (Exception $e) {
        error_log("Notification getForDepartment error: " . $e->getMessage());
        return [];
    }
}
    
    private function getGlobalNotifications() {
        try {
            $sql = "SELECT n.* 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND n.department_id IS NULL
                    ORDER BY 
                        CASE n.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                        END,
                        n.created_at DESC";
            
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Notification getGlobal error: " . $e->getMessage());
            return [];
        }
    }
    
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
    
    
public function addEventNotification($eventData, $departmentId = null) {
    try {
        $title = $eventData['title'] ?? '';
        $description = $eventData['description'] ?? 'New event has been scheduled.';
        $eventId = $eventData['id'] ?? null;
        
        error_log("=== NOTIFICATION: Creating event notification ===");
        error_log("Event ID: " . $eventId);
        error_log("Title: " . $title);
        error_log("Department ID(s) received: " . print_r($departmentId, true));
        
        // Prepare notification data
        $notificationData = [
            'title' => '📅 New Event: ' . $title,
            'message' => $description . (($eventId) ? " (Event ID: $eventId)" : ""),
            'notification_type' => 'event',
            'priority' => 'medium',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+10 days'))
        ];
        
        // Handle department ID - store in same format as events table
        if ($departmentId === null) {
            // Global notification (NULL for all departments)
            $notificationData['department_id'] = null;
            error_log("Creating GLOBAL notification (department_id = NULL)");
            
            return $this->createNotification($notificationData);
        }
        
        // Process department ID
        $formattedDeptId = null;
        
        if (is_array($departmentId)) {
            // Filter out empty values
            $filtered = array_filter($departmentId, function($val) {
                return $val !== '' && $val !== '0' && $val !== 0;
            });
            
            if (empty($filtered)) {
                $formattedDeptId = null; // Global notification
                error_log("Empty array after filtering, creating GLOBAL notification");
            } else {
                // Store as JSON array
                $formattedDeptId = json_encode(array_values($filtered));
                error_log("Creating notification with JSON array: " . $formattedDeptId);
            }
        } 
        elseif (is_string($departmentId) && strpos($departmentId, '[') === 0) {
            // Already JSON array, validate it
            $decoded = json_decode($departmentId, true);
            if (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) {
                $formattedDeptId = $departmentId;
                error_log("Creating notification with existing JSON: " . $formattedDeptId);
            } else {
                $formattedDeptId = null;
                error_log("Invalid JSON, creating GLOBAL notification");
            }
        }
        elseif ($departmentId && $departmentId !== '0' && $departmentId !== 0) {
            // Single department ID - store as string (not JSON)
            $formattedDeptId = (string)$departmentId;
            error_log("Creating notification with single department ID: " . $formattedDeptId);
        }
        else {
            // 0, empty string, or false
            $formattedDeptId = null;
            error_log("Department ID is 0/empty, creating GLOBAL notification");
        }
        
        $notificationData['department_id'] = $formattedDeptId;
        
        error_log("Final notification data - department_id: " . ($formattedDeptId ?? 'NULL'));
        
        return $this->createNotification($notificationData);
        
    } catch (Exception $e) {
        error_log("Event notification error: " . $e->getMessage());
        return false;
    }
}
    // Add this method to your Notification.php file
public function addEventUpdateNotification($eventData, $departmentId = null) {
    $title = $eventData['title'] ?? '';
    
    // Prepare message
    $message = "Event '{$title}' has been updated.";
    
    // Get department IDs for notification
    $deptIds = [];
    if (is_array($departmentId)) {
        $deptIds = $departmentId;
    } elseif ($departmentId) {
        $deptIds = [$departmentId];
    }
    
    // Create notification(s)
    if (empty($deptIds)) {
        // For all departments
        return $this->createNotification([
            'title' => '📝 Event Updated: ' . $title,
            'message' => $message,
            'notification_type' => 'event',
            'department_id' => null,
            'priority' => 'medium',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+10 days'))
        ]);
    } else {
        // For specific departments
        $notificationIds = [];
        foreach ($deptIds as $deptId) {
            if ($deptId && $deptId !== '0' && $deptId !== 0) {
                try {
                    $notificationId = $this->createNotification([
                        'title' => '📝 Event Updated: ' . $title,
                        'message' => $message,
                        'notification_type' => 'event',
                        'department_id' => $deptId,
                        'priority' => 'medium',
                        'expires_at' => date('Y-m-d H:i:s', strtotime('+10 days'))
                    ]);
                    
                    if ($notificationId) {
                        $notificationIds[] = $notificationId;
                    }
                } catch (Exception $e) {
                    error_log("Department notification error [Dept: $deptId]: " . $e->getMessage());
                }
            }
        }
        return $notificationIds;
    }
}
    /**
     * Create a notification for a new activity
     * @param array $activityData Activity information
     * @param mixed $departmentId Single department ID or array of IDs
     * @return mixed Notification ID(s) or false on error
     */
    public function addActivityNotification($activityData, $departmentId = null) {
        return $this->addItemNotification(
            'activity',
            $activityData['name'] ?? '',
            $activityData['description'] ?? 'New activity is now available.',
            $activityData,
            $departmentId ?? $activityData['department_id'] ?? null,
            '+5 days'
        );
    }
    
    /**
     * Create a notification for a new member
     * @param array $memberData Member information
     * @param mixed $departmentId Single department ID or array of IDs
     * @return mixed Notification ID(s) or false on error
     */
    public function addMemberNotification($memberData, $departmentId = null) {
        $fullName = ($memberData['first_name'] ?? '') . ' ' . ($memberData['last_name'] ?? '');
        return $this->addItemNotification(
            'member',
            'New Member: ' . $fullName,
            'Welcome to our church community!',
            $memberData,
            $departmentId ?? $memberData['department_id'] ?? null,
            '+3 days'
        );
    }
    
    /**
     * Create a notification for member birthday
     * @param array $memberData Member information
     * @return mixed Notification ID(s) or false on error
     */
    public function addBirthdayNotification($memberData) {
        $fullName = ($memberData['first_name'] ?? '') . ' ' . ($memberData['last_name'] ?? '');
        $message = 'Happy Birthday to ' . $fullName . '! 🎂';
        
        // Get member's department
        $deptId = $memberData['department_id'] ?? null;
        
        return $this->createNotification([
            'title' => '🎉 Birthday: ' . $fullName,
            'message' => $message,
            'notification_type' => 'birthday',
            'department_id' => $deptId,
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 day'))
        ]);
    }
    
    /**
     * Create a notification for attendance update
     * @param array $attendanceData Attendance information
     * @return mixed Notification ID or false on error
     */
    public function addAttendanceNotification($attendanceData) {
        $memberName = $attendanceData['member_name'] ?? 'Member';
        $status = $attendanceData['status'] ?? 'present';
        
        $statusMessages = [
            'present' => 'was present',
            'absent' => 'was absent',
            'late' => 'was late'
        ];
        
        return $this->createNotification([
            'title' => 'Attendance Update: ' . $memberName,
            'message' => $memberName . ' ' . ($statusMessages[$status] ?? 'attendance was recorded'),
            'notification_type' => 'attendance',
            'department_id' => $attendanceData['department_id'] ?? null,
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 day'))
        ]);
    }
    
    /**
     * Create a notification for prayer request
     * @param array $prayerData Prayer request information
     * @return mixed Notification ID or false on error
     */
    public function addPrayerRequestNotification($prayerData) {
        return $this->createNotification([
            'title' => '🙏 Prayer Request: ' . ($prayerData['title'] ?? 'New Request'),
            'message' => $prayerData['description'] ?? 'Please pray for this request.',
            'notification_type' => 'prayer',
            'department_id' => $prayerData['department_id'] ?? null,
            'priority' => 'high',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+14 days'))
        ]);
    }
    
    /**
     * Create a general announcement
     * @param string $title Announcement title
     * @param string $message Announcement message
     * @param mixed $departmentId Single department ID or array of IDs
     * @param string $priority Priority level
     * @return mixed Notification ID(s) or false on error
     */
    public function addAnnouncement($title, $message, $departmentId = null, $priority = 'medium') {
        return $this->addItemNotification(
            'announcement',
            $title,
            $message,
            [],
            $departmentId,
            '+30 days',
            $priority
        );
    }
    
    /**
     * Create a system alert
     * @param string $title Alert title
     * @param string $message Alert message
     * @param string $priority Priority level
     * @return mixed Notification ID or false on error
     */
    public function addSystemAlert($title, $message, $priority = 'high') {
        return $this->createNotification([
            'title' => '⚠️ ' . $title,
            'message' => $message,
            'notification_type' => 'system',
            'department_id' => null, // System alerts are for all departments
            'priority' => $priority,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+3 days'))
        ]);
    }
    
    /**
     * Create a notification for offering/tithe update
     * @param array $offeringData Offering information
     * @return mixed Notification ID or false on error
     */
    public function addOfferingNotification($offeringData) {
        return $this->createNotification([
            'title' => '💰 Offering Update',
            'message' => $offeringData['message'] ?? 'Weekly offering has been recorded.',
            'notification_type' => 'offering',
            'department_id' => null, // Offering updates for all
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+2 days'))
        ]);
    }
    
    /**
     * Create a notification for volunteer opportunity
     * @param array $volunteerData Volunteer information
     * @param mixed $departmentId Single department ID or array of IDs
     * @return mixed Notification ID(s) or false on error
     */
    public function addVolunteerNotification($volunteerData, $departmentId = null) {
        return $this->addItemNotification(
            'volunteer',
            $volunteerData['title'] ?? 'Volunteer Opportunity',
            $volunteerData['description'] ?? 'Help needed for upcoming event.',
            $volunteerData,
            $departmentId ?? $volunteerData['department_id'] ?? null,
            '+14 days'
        );
    }
    
    /**
     * Generic method to add item notifications (events, activities, etc.)
     * @param string $type Notification type
     * @param string $itemTitle Item title
     * @param string $itemDescription Item description
     * @param array $itemData Full item data
     * @param mixed $departmentId Single department ID or array of IDs
     * @param string $expiryDays When notification expires (e.g., '+7 days')
     * @param string $priority Priority level
     * @return mixed Notification ID(s) or false on error
     */
private function addItemNotification($type, $itemTitle, $itemDescription, $itemData, $departmentId = null, $expiryDays = '+7 days', $priority = 'medium') {
    try {
        $prefixes = [
            'event' => '📅 New Event: ',
            'activity' => '🎯 New Activity: ',
            'member' => '👤 New Member: ',
            'announcement' => '📢 ',
            'volunteer' => '🤝 Volunteer: '
        ];
        
        $prefix = $prefixes[$type] ?? '';
        
        // Prepare notification data
        $notificationData = [
            'title' => $prefix . $itemTitle,
            'message' => $itemDescription,
            'notification_type' => $type,
            'priority' => $priority,
            'expires_at' => date('Y-m-d H:i:s', strtotime($expiryDays))
        ];
        
        // Handle department ID
        if ($departmentId === null) {
            $notificationData['department_id'] = null;
        } 
        elseif (is_array($departmentId)) {
            $filtered = array_filter($departmentId, function($val) {
                return $val !== '' && $val !== '0' && $val !== 0;
            });
            
            if (empty($filtered)) {
                $notificationData['department_id'] = null;
            } else {
                $notificationData['department_id'] = json_encode(array_values($filtered));
            }
        }
        elseif (is_string($departmentId) && strpos($departmentId, '[') === 0) {
            $decoded = json_decode($departmentId, true);
            $notificationData['department_id'] = (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) ? $departmentId : null;
        }
        elseif ($departmentId && $departmentId !== '0' && $departmentId !== 0) {
            $notificationData['department_id'] = (string)$departmentId;
        }
        else {
            $notificationData['department_id'] = null;
        }
        
        return $this->createNotification($notificationData);
        
    } catch (Exception $e) {
        error_log("Item notification error [Type: $type]: " . $e->getMessage());
        return false;
    }
}
    
    /**
     * Create notifications for multiple departments
     * @param string $title Notification title
     * @param string $message Notification message
     * @param string $type Notification type
     * @param array $departmentIds Array of department IDs
     * @param string $priority Priority level
     * @param string $expiryDays When notification expires
     * @return array Array of notification IDs
     */
private function createNotificationsForDepartments($title, $message, $type, $departmentIds, $priority = 'medium', $expiryDays = '+7 days') {
    $notificationIds = [];
    
    foreach ($departmentIds as $deptId) {
        if ($deptId && $deptId !== '0' && $deptId !== 0) {
            try {
                // Store single department ID as string
                $notificationId = $this->createNotification([
                    'title' => $title,
                    'message' => $message,
                    'notification_type' => $type,
                    'department_id' => (string)$deptId,
                    'priority' => $priority,
                    'expires_at' => date('Y-m-d H:i:s', strtotime($expiryDays))
                ]);
                
                if ($notificationId) {
                    $notificationIds[] = $notificationId;
                }
            } catch (Exception $e) {
                error_log("Department notification error [Dept: $deptId]: " . $e->getMessage());
                // Continue with other departments
            }
        }
    }
    
    return $notificationIds;
}
    
    /**
     * Get notifications by type
     * @param string $type Notification type
     * @return array Array of notifications
     */
    public function getNotificationsByType($type) {
        try {
            $sql = "SELECT n.*, d.name as department_name 
                    FROM notifications n
                    LEFT JOIN departments d ON n.department_id = d.id
                    WHERE n.notification_type = ? 
                    AND n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    ORDER BY n.created_at DESC";
            return $this->fetchAll($sql, [$type]);
        } catch (Exception $e) {
            error_log("Notification getByType error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get notifications count for member
     * @param int $memberId Member ID
     * @return int Number of notifications
     */
    public function getUnreadCount($memberId) {
        try {
            // Get member's department
            $memberSql = "SELECT department_id FROM members WHERE id = ? AND is_active = 1";
            $member = $this->fetchOne($memberSql, [$memberId]);
            
            if (!$member) {
                // If member not found, return count of global notifications
                $globalSql = "SELECT COUNT(*) as count FROM notifications 
                             WHERE is_active = 1 
                             AND (expires_at IS NULL OR expires_at > NOW())
                             AND department_id IS NULL";
                $result = $this->fetchOne($globalSql);
                return $result['count'] ?? 0;
            }
            
            $memberDeptId = $member['department_id'];
            
            $sql = "SELECT COUNT(*) as count 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (n.department_id IS NULL OR n.department_id = ?)";
            
            $result = $this->fetchOne($sql, [$memberDeptId]);
            return $result['count'] ?? 0;
            
        } catch (Exception $e) {
            error_log("Notification count error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get recent notifications (last 30 days)
     * @param int $limit Number of notifications to return
     * @return array Array of notifications
     */
    public function getRecentNotifications($limit = 20) {
        try {
            $sql = "SELECT n.*, d.name as department_name 
                    FROM notifications n
                    LEFT JOIN departments d ON n.department_id = d.id
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    ORDER BY n.created_at DESC
                    LIMIT ?";
            return $this->fetchAll($sql, [$limit]);
        } catch (Exception $e) {
            error_log("Notification getRecent error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Search notifications by keyword
     * @param string $keyword Search term
     * @return array Array of matching notifications
     */
    public function searchNotifications($keyword) {
        try {
            $sql = "SELECT n.*, d.name as department_name 
                    FROM notifications n
                    LEFT JOIN departments d ON n.department_id = d.id
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (n.title LIKE ? OR n.message LIKE ?)
                    ORDER BY n.created_at DESC";
            
            $searchTerm = "%$keyword%";
            return $this->fetchAll($sql, [$searchTerm, $searchTerm]);
        } catch (Exception $e) {
            error_log("Notification search error: " . $e->getMessage());
            return [];
        }
    }
}
?>