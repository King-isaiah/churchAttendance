<?php
require_once 'Database.php';

// Ensure session is started so we can grab unique_id for personal notifications
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

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
            // Get member's department and unique_id
            $memberSql = "SELECT department_id, unique_id FROM members WHERE id = ?";
            $member = $this->fetchOne($memberSql, [$memberId]);
            
            if (!$member) {
                return $this->getGlobalNotifications(); 
            }
            
            $memberDeptId = $member['department_id'];
            $uniqueId = $member['unique_id'];
            
            $sql = "SELECT n.* 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (
                        -- 1. Personal notification for this specific user
                        n.target_unique_id = ? 
                        -- 2. Broadcast/Department notifications (where target_unique_id is NULL)
                        OR (
                            n.target_unique_id IS NULL 
                            AND (
                                n.department_id = 0 -- <--- 0 Means everyone
                                OR n.department_id = ? 
                                OR (n.department_id LIKE '[%' AND n.department_id LIKE ?)
                            )
                        )
                    )
                    ORDER BY 
                        CASE n.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                        END,
                        n.created_at DESC";
            
            $jsonSearch = '%"' . $memberDeptId . '"%';
            
            return $this->fetchAll($sql, [$uniqueId, $memberDeptId, $jsonSearch]);
        } catch (Exception $e) {
            error_log("Notification getForMember error: " . $e->getMessage());
            return $this->getGlobalNotifications(); 
        }
    }
        
    public function getNotificationsForDepartment($departmentId) {
        try {
            // Get unique_id from session to check for personal notifications
            $uniqueId = isset($_SESSION['unique_id']) ? $_SESSION['unique_id'] : 0;

            $sql = "SELECT n.* 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (
                        -- 1. Personal notification for this specific user
                        n.target_unique_id = ? 
                        -- 2. Broadcast/Department notifications
                        OR (
                            n.target_unique_id IS NULL 
                            AND (
                                n.department_id = 0 -- <--- 0 Means everyone
                                OR n.department_id = ? -- <--- User's specific department
                                OR (n.department_id LIKE '[%' AND n.department_id LIKE ?) -- <--- JSON arrays
                            )
                        )
                    )
                    ORDER BY 
                        CASE n.priority 
                            WHEN 'high' THEN 1 
                            WHEN 'medium' THEN 2 
                            WHEN 'low' THEN 3 
                        END,
                        n.created_at DESC";
            
            $jsonSearch = '%"' . $departmentId . '"%';
            
            return $this->fetchAll($sql, [$uniqueId, $departmentId, $jsonSearch]);
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
                    AND n.department_id = 0 
                    AND n.target_unique_id IS NULL
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
            if (empty($data['title']) || empty($data['message'])) {
                throw new Exception("Title and message are required", 400);
            }
            
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
            
            $notificationData = [
                'title' => '📅 New Event: ' . $title,
                'message' => $description . (($eventId) ? " (Event ID: $eventId)" : ""),
                'notification_type' => 'event',
                'priority' => 'medium',
                'expires_at' => date('Y-m-d H:i:s', strtotime('+10 days'))
            ];
            
            if ($departmentId === null) {
                $notificationData['department_id'] = 0; // 0 for global
                return $this->createNotification($notificationData);
            }
            
            $formattedDeptId = 0;
            
            if (is_array($departmentId)) {
                $filtered = array_filter($departmentId, function($val) {
                    return $val !== '' && $val !== '0' && $val !== 0;
                });
                
                if (empty($filtered)) {
                    $formattedDeptId = 0; 
                } else {
                    $formattedDeptId = json_encode(array_values($filtered));
                }
            } 
            elseif (is_string($departmentId) && strpos($departmentId, '[') === 0) {
                $decoded = json_decode($departmentId, true);
                if (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) {
                    $formattedDeptId = $departmentId;
                } else {
                    $formattedDeptId = 0;
                }
            }
            elseif ($departmentId && $departmentId !== '0' && $departmentId !== 0) {
                $formattedDeptId = (string)$departmentId;
            }
            
            $notificationData['department_id'] = $formattedDeptId;
            return $this->createNotification($notificationData);
            
        } catch (Exception $e) {
            error_log("Event notification error: " . $e->getMessage());
            return false;
        }
    }

    public function addEventUpdateNotification($eventData, $departmentId = null) {
        $title = $eventData['title'] ?? '';
        $message = "Event '{$title}' has been updated.";
        
        $deptIds = [];
        if (is_array($departmentId)) {
            $deptIds = $departmentId;
        } elseif ($departmentId) {
            $deptIds = [$departmentId];
        }
        
        if (empty($deptIds)) {
            return $this->createNotification([
                'title' => '📝 Event Updated: ' . $title,
                'message' => $message,
                'notification_type' => 'event',
                'department_id' => 0,
                'priority' => 'medium',
                'expires_at' => date('Y-m-d H:i:s', strtotime('+10 days'))
            ]);
        } else {
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
   
    public function addBirthdayNotification($memberData) {
        $fullName = ($memberData['first_name'] ?? '') . ' ' . ($memberData['last_name'] ?? '');
        $message = 'Happy Birthday to ' . $fullName . '! 🎂';
        
        $deptId = $memberData['department_id'] ?? 0;
        
        return $this->createNotification([
            'title' => '🎉 Birthday: ' . $fullName,
            'message' => $message,
            'notification_type' => 'birthday',
            'department_id' => $deptId,
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 day'))
        ]);
    }
    
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
            'department_id' => $attendanceData['department_id'] ?? 0,
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+1 day'))
        ]);
    }
    
    public function addPrayerRequestNotification($prayerData) {
        return $this->createNotification([
            'title' => '🙏 Prayer Request: ' . ($prayerData['title'] ?? 'New Request'),
            'message' => $prayerData['description'] ?? 'Please pray for this request.',
            'notification_type' => 'prayer',
            'department_id' => $prayerData['department_id'] ?? 0,
            'priority' => 'high',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+14 days'))
        ]);
    }
    
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
    
    public function addSystemAlert($title, $message, $priority = 'high') {
        return $this->createNotification([
            'title' => '⚠️ ' . $title,
            'message' => $message,
            'notification_type' => 'system',
            'department_id' => 0, // 0 for global
            'priority' => $priority,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+3 days'))
        ]);
    }
   
    public function addOfferingNotification($offeringData) {
        return $this->createNotification([
            'title' => '💰 Offering Update',
            'message' => $offeringData['message'] ?? 'Weekly offering has been recorded.',
            'notification_type' => 'offering',
            'department_id' => 0,
            'priority' => 'low',
            'expires_at' => date('Y-m-d H:i:s', strtotime('+2 days'))
        ]);
    }
   
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
            
            $notificationData = [
                'title' => $prefix . $itemTitle,
                'message' => $itemDescription,
                'notification_type' => $type,
                'priority' => $priority,
                'expires_at' => date('Y-m-d H:i:s', strtotime($expiryDays))
            ];
            
            if ($departmentId === null) {
                $notificationData['department_id'] = 0;
            } 
            elseif (is_array($departmentId)) {
                $filtered = array_filter($departmentId, function($val) {
                    return $val !== '' && $val !== '0' && $val !== 0;
                });
                
                if (empty($filtered)) {
                    $notificationData['department_id'] = 0;
                } else {
                    $notificationData['department_id'] = json_encode(array_values($filtered));
                }
            }
            elseif (is_string($departmentId) && strpos($departmentId, '[') === 0) {
                $decoded = json_decode($departmentId, true);
                $notificationData['department_id'] = (json_last_error() === JSON_ERROR_NONE && !empty($decoded)) ? $departmentId : 0;
            }
            elseif ($departmentId && $departmentId !== '0' && $departmentId !== 0) {
                $notificationData['department_id'] = (string)$departmentId;
            }
            else {
                $notificationData['department_id'] = 0;
            }
            
            return $this->createNotification($notificationData);
            
        } catch (Exception $e) {
            error_log("Item notification error [Type: $type]: " . $e->getMessage());
            return false;
        }
    }
    
    private function createNotificationsForDepartments($title, $message, $type, $departmentIds, $priority = 'medium', $expiryDays = '+7 days') {
        $notificationIds = [];
        
        foreach ($departmentIds as $deptId) {
            if ($deptId && $deptId !== '0' && $deptId !== 0) {
                try {
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
                }
            }
        }
        
        return $notificationIds;
    }
    
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
    
    public function getUnreadCount($memberId) {
        try {
            $uniqueId = isset($_SESSION['unique_id']) ? $_SESSION['unique_id'] : 0;
            $memberSql = "SELECT department_id, unique_id FROM members WHERE id = ?";
            $member = $this->fetchOne($memberSql, [$memberId]);
            
            if (!$member) {
                return 0; 
            }
            
            if ($uniqueId == 0 && isset($member['unique_id'])) {
                $uniqueId = $member['unique_id'];
            }
            
            $memberDeptId = $member['department_id'];
            
            $sql = "SELECT COUNT(*) as count 
                    FROM notifications n
                    WHERE n.is_active = 1 
                    AND (n.expires_at IS NULL OR n.expires_at > NOW())
                    AND (
                        n.target_unique_id = ?
                        OR (
                            n.target_unique_id IS NULL
                            AND (
                                n.department_id = 0 
                                OR n.department_id = ? 
                                OR (n.department_id LIKE '[%' AND n.department_id LIKE ?)
                            )
                        )
                    )";
            
            $jsonSearch = '%"' . $memberDeptId . '"%';
            $result = $this->fetchOne($sql, [$uniqueId, $memberDeptId, $jsonSearch]);
            return $result['count'] ?? 0;
            
        } catch (Exception $e) {
            error_log("Notification count error: " . $e->getMessage());
            return 0;
        }
    }
    
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