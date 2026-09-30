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
        
        // 2. Check if attendance already exists
        $existingAttendance = $this->checkAttendanceExists($data);
        
        if ($existingAttendance) {
            // Attendance already exists - return a special result or throw an exception
            throw new Exception("Attendance already recorded for this activity", 409);
        }
        
        // 3. If no duplicate found, proceed with insertion
        return $this->insert('attendance', $data);
        
    } catch (Exception $e) {
        error_log("Attendance create error: " . $e->getMessage() . " | Data: " . json_encode($data));
        throw $e; 
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
        // Check based on multiple criteria to avoid duplicates
        $sql = "SELECT id FROM attendance WHERE 
                unique_id = ? AND 
                attendance_category = ? AND 
                attendance_category_id = ? AND 
                dayofactivity = ? AND 
                status = ?";
        
        $params = [
            $data['unique_id'],
            $data['attendance_category'], 
            $data['attendance_category_id'],
            $data['dayofactivity'],
            $data['status']
        ];
        
        $result = $this->fetchOne($sql, $params);
        
        // Return true if attendance already exists
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