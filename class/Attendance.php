<?php
require_once 'Database.php';

class Attendance extends Database {
    
    public function getAllAttendance() {
        try {
            $sql = "
                SELECT a.*, 
                m.first_name, m.last_name,
                e.name as event_name, e.event_date,
                d.name as department_name
                FROM attendance a
                JOIN members m ON a.member_id = m.id
                JOIN events e ON a.event_id = e.id
                LEFT JOIN departments d ON m.department_id = d.id
                ORDER BY e.event_date DESC, a.attendance_time DESC
            ";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Attendance getAll error: " . $e->getMessage());
            return [];
        }
    }
        // ADD THIS NEW METHOD TO Attendance.php
    public function getAttendanceByUniqueId($uniqueId) {
        try {
            $sql = "
                SELECT a.id, a.dayofactivity, a.created_at, a.status, a.check_in_time, 
                       a.attendance_category, a.attendance_category_id,
                       CASE 
                           WHEN a.attendance_category = 'activity' THEN act.name
                           WHEN a.attendance_category = 'event' THEN ev.title
                           ELSE 'Unknown'
                       END as activity_or_event_name
                FROM attendance a
                LEFT JOIN activities act ON a.attendance_category = 'activity' AND a.attendance_category_id = act.id
                LEFT JOIN events ev ON a.attendance_category = 'event' AND a.attendance_category_id = ev.id
                WHERE a.unique_id = ?
                ORDER BY a.created_at DESC
            ";
            return $this->fetchAll($sql, [$uniqueId]);
        } catch (Exception $e) {
            error_log("Attendance getByUniqueId error: " . $e->getMessage());
            return [];
        }
    }
    public function getAttendance($id) {
        try {
            $sql = "
                SELECT a.*, 
                m.first_name, m.last_name,
                e.name as event_name, e.event_date
                FROM attendance a
                JOIN members m ON a.member_id = m.id
                JOIN events e ON a.event_id = e.id
                WHERE a.id = ?
            ";
            return $this->fetchOne($sql, [$id]);
        } catch (Exception $e) {
            error_log("Attendance get error: " . $e->getMessage());
            return false;
        }
    }
    


    public function createAttendance($data) {
        try {
            // 1. First, validate required fields
            $this->validateAttendanceData($data);
            
            // 2. NEW: Validate the Day, Time, and Department!
            $this->validateAttendanceLogic($data);
            
            // 3. Check if attendance already exists
            $existingAttendance = $this->checkAttendanceExists($data);
            
            if ($existingAttendance) {
                $categoryName = isset($data['attendance_category']) && $data['attendance_category'] === 'event' ? 'event' : 'activity';
                throw new Exception("Attendance already recorded today for this $categoryName", 409);
            }
            
            // 4. If everything is valid, proceed with insertion
            return $this->insert('attendance', $data);
            
        } catch (Exception $e) {
            error_log("Attendance create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; 
        }
    }

    // ADD THIS NEW METHOD right below createAttendance()
   
    private function validateAttendanceLogic(&$data) {
        // Set the timezone to Africa/Lagos to ensure server time matches local time
        date_default_timezone_set('Africa/Lagos');

        $category = $data['attendance_category'] ?? '';
        $categoryId = $data['attendance_category_id'] ?? 0;
        $uniqueId = $data['unique_id'] ?? '';

        if (empty($category) || empty($categoryId)) return;

        $table = ($category === 'activity') ? 'activities' : 'events';
        
        // Fetch the record
        $record = $this->fetchOne("SELECT * FROM $table WHERE id = ?", [$categoryId]);
        if (!$record) {
            throw new Exception(ucfirst($category) . " not found", 404);
        }

        // ==========================================
        // FIX: FORCE THE CORRECT LOCATION ID
        // ==========================================
        if (isset($record['location_id'])) {
            $data['location_id'] = $record['location_id'];
        }
        // ==========================================

        // 1. Check Day
        $today = date('l'); 
        if ($category === 'activity') {
            if (strtolower($record['dayofactivity']) !== strtolower($today)) {
                throw new Exception("This activity is for {$record['dayofactivity']}, but today is {$today}.", 400);
            }
        } else {
            $todayDate = date('Y-m-d');
            if ($record['event_date'] !== $todayDate) {
                throw new Exception("This event is for {$record['event_date']}, but today is {$todayDate}.", 400);
            }
        }

        // 2. Check Time (Starts and Expires)
        // Use the time sent from the frontend. Fallback to server time if missing.
        $currentTime = !empty($data['check_in_time']) ? $data['check_in_time'] : date('H:i:s');
        
        if ($currentTime < $record['time']) {
            throw new Exception("Attendance has not started yet. It starts at {$record['time']}.", 400);
        }

        $timeExp = $record['time_exp'];
        if ($timeExp === '00:00:00') $timeExp = '23:59:59'; // Treat midnight as all-day
        
        if ($currentTime > $timeExp) {
            throw new Exception("Attendance is closed. It expired at {$record['time_exp']}.", 400);
        }

        // 3. Check Department
        $member = $this->fetchOne("SELECT department_id FROM members WHERE unique_id = ?", [$uniqueId]);
        if ($member && !empty($member['department_id'])) {
            $userDeptIds = (strpos($member['department_id'], '[') === 0) ? json_decode($member['department_id'], true) : [$member['department_id']];
            $recordDeptIds = (strpos($record['department_id'], '[') === 0) ? json_decode($record['department_id'], true) : [$record['department_id']];

            $isAll = false;
            foreach ($recordDeptIds as $d) {
                if (strtolower(trim((string)$d, '"')) === 'all') {
                    $isAll = true;
                    break;
                }
            }

            if (!$isAll) {
                $match = false;
                foreach ($userDeptIds as $ud) {
                    foreach ($recordDeptIds as $rd) {
                        if ((string)$ud === (string)$rd) {
                            $match = true;
                            break 2;
                        }
                    }
                }
                if (!$match) {
                    throw new Exception("Sorry this attendance does not apply to your department {$category} (Department mismatch).", 403);
                }
            }
        }
    }
    private function validateAttendanceData($data) {
        $required = ['unique_id', 'dayofactivity', 'check_in_time', 'status'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is this you here is required", 400);
            }
        }
    }

    private function checkAttendanceExists($data) {
        try {
            // We check if the user already submitted attendance for THIS activity/event TODAY.
            // DATE(created_at) = CURDATE() ensures it resets every day.
            $sql = "SELECT id FROM attendance WHERE 
                    unique_id = ? AND 
                    attendance_category = ? AND 
                    attendance_category_id = ? AND 
                    DATE(created_at) = CURDATE()";
            
            $params = [
                $data['unique_id'],
                $data['attendance_category'], 
                $data['attendance_category_id']
            ];
            
            $result = $this->fetchOne($sql, $params);
            
            // Return true if attendance already exists for today
            return !empty($result);
            
        } catch (Exception $e) {
            error_log("Attendance check exists error: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateAttendance($id, $data) {
        try {
            return $this->update('attendance', $data, 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Attendance update error: " . $e->getMessage());
            return false;
        }
    }
    
    public function deleteAttendance($id) {
        try {
            return $this->delete('attendance', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Attendance delete error: " . $e->getMessage());
            return false;
        }
    }
    
    public function getAttendanceByEvent($eventId) {
        try {
            $sql = "
                SELECT a.*, 
                m.first_name, m.last_name,
                d.name as department_name
                FROM attendance a
                JOIN members m ON a.member_id = m.id
                LEFT JOIN departments d ON m.department_id = d.id
                WHERE a.event_id = ?
                ORDER BY a.attendance_time DESC
            ";
            return $this->fetchAll($sql, [$eventId]);
        } catch (Exception $e) {
            error_log("Attendance getByEvent error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getAttendanceByMember($memberId) {
        try {
            $sql = "
                SELECT a.*, 
                e.name as event_name, e.event_date
                FROM attendance a
                JOIN events e ON a.event_id = e.id
                WHERE a.member_id = ?
                ORDER BY e.event_date DESC
            ";
            return $this->fetchAll($sql, [$memberId]);
        } catch (Exception $e) {
            error_log("Attendance getByMember error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getAttendanceStats($startDate = null, $endDate = null) {
        try {
            $sql = "
                SELECT 
                    COUNT(*) as total_attendance,
                    COUNT(DISTINCT member_id) as unique_members,
                    COUNT(DISTINCT event_id) as total_events,
                    AVG(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100 as attendance_rate
                FROM attendance
            ";
            
            $params = [];
            
            if ($startDate && $endDate) {
                $sql .= " WHERE attendance_time BETWEEN ? AND ?";
                $params = [$startDate, $endDate];
            }
            
            return $this->fetchOne($sql, $params);
        } catch (Exception $e) {
            error_log("Attendance getStats error: " . $e->getMessage());
            return false;
        }
    }
}
?>