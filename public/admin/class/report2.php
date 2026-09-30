<?php
require_once 'Database.php';

class Report extends Database {
    
    public function getAllAttendanceReports() {
        try {
            // Default to last 30 days of reports
            $startDate = date('Y-m-d', strtotime('-30 days'));
            $endDate = date('Y-m-d');
            
            $sql = "
                SELECT 
                    a.date,
                    a.name,
                    a.department,
                    COUNT(CASE WHEN at.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN at.status = 'absent' THEN 1 END) as absent_count,
                    ROUND(
                        (COUNT(CASE WHEN at.status = 'present' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(CASE WHEN at.status IN ('present', 'absent') THEN 1 END), 0)
                    ), 2) as attendance_rate
                FROM attendance at
                INNER JOIN activities a ON at.activity_id = a.id
                WHERE a.date BETWEEN ? AND ?
                GROUP BY a.time, a.name, a.department_id
                ORDER BY a.time DESC
            ";
            
            return $this->fetchAll($sql, [$startDate, $endDate]);
        } catch (Exception $e) {
            error_log("Report getAll error: " . $e->getMessage());
            throw new Exception("Unable to retrieve attendance reports");
        }
    }
    
    public function getAttendanceReports($filters = []) {
        try {
            $whereConditions = [];
            $params = [];
            
            // Build WHERE clause based on filters
            if (!empty($filters['start_date'])) {
                $whereConditions[] = "a.date >= ?";
                $params[] = $filters['start_date'];
            }
            
            if (!empty($filters['end_date'])) {
                $whereConditions[] = "a.date <= ?";
                $params[] = $filters['end_date'];
            }
            
            if (!empty($filters['department'])) {
                $whereConditions[] = "a.department = ?";
                $params[] = $filters['department'];
            }
            
            if (!empty($filters['activity_type'])) {
                $whereConditions[] = "a.activity_name LIKE ?";
                $params[] = '%' . $filters['activity_type'] . '%';
            }
            
            $whereClause = '';
            if (!empty($whereConditions)) {
                $whereClause = "WHERE " . implode(' AND ', $whereConditions);
            }
            
            $sql = "
                SELECT 
                    a.time,
                    a.name,
                    a.department,
                    COUNT(CASE WHEN at.status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN at.status = 'absent' THEN 1 END) as absent_count,
                    ROUND(
                        (COUNT(CASE WHEN at.status = 'present' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(CASE WHEN at.status IN ('present', 'absent') THEN 1 END), 0)
                    ), 2) as attendance_rate
                FROM attendance at
                INNER JOIN activities a ON at.activity_id = a.id
                $whereClause
                GROUP BY a.date, a.activity_name, a.department
                ORDER BY a.date DESC
            ";
            
            return $this->fetchAll($sql, $params);
        } catch (Exception $e) {
            error_log("Report getAttendanceReports error: " . $e->getMessage());
            throw new Exception("Unable to generate attendance reports");
        }
    }
    
    public function getWeeklyAttendanceTrend($startDate = null, $endDate = null) {
        try {
            $params = [];
            $dateFilter = '';
            
            if ($startDate && $endDate) {
                $dateFilter = "WHERE a.date BETWEEN ? AND ?";
                $params = [$startDate, $endDate];
            }
            
            $sql = "
                SELECT 
                    DATE(a.date) as date,
                    COUNT(CASE WHEN at.status = 'present' THEN 1 END) as attendance_count
                FROM attendance at
                INNER JOIN activities a ON at.activity_id = a.id
                $dateFilter
                GROUP BY DATE(a.date)
                ORDER BY DATE(a.date)
                LIMIT 7
            ";
            
            $data = $this->fetchAll($sql, $params);
            
            // Format for chart.js
            $labels = [];
            $values = [];
            
            foreach ($data as $row) {
                $labels[] = date('M j', strtotime($row['date']));
                $values[] = (int)$row['attendance_count'];
            }
            
            return [
                'labels' => $labels,
                'values' => $values
            ];
        } catch (Exception $e) {
            error_log("Report getWeeklyAttendanceTrend error: " . $e->getMessage());
            throw new Exception("Unable to generate weekly trend data");
        }
    }
    
    public function getReportSummary($filters = []) {
        try {
            $whereConditions = [];
            $params = [];
            
            if (!empty($filters['start_date'])) {
                $whereConditions[] = "a.date >= ?";
                $params[] = $filters['start_date'];
            }
            
            if (!empty($filters['end_date'])) {
                $whereConditions[] = "a.date <= ?";
                $params[] = $filters['end_date'];
            }
            
            if (!empty($filters['department'])) {
                $whereConditions[] = "a.department = ?";
                $params[] = $filters['department'];
            }
            
            $whereClause = '';
            if (!empty($whereConditions)) {
                $whereClause = "WHERE " . implode(' AND ', $whereConditions);
            }
            
            $sql = "
                SELECT 
                    COUNT(DISTINCT at.member_id) as total_members,
                    COUNT(CASE WHEN at.status = 'present' THEN 1 END) as total_present,
                    COUNT(CASE WHEN at.status = 'absent' THEN 1 END) as total_absent,
                    COUNT(DISTINCT a.id) as total_activities,
                    ROUND(
                        AVG(
                            (COUNT(CASE WHEN at.status = 'present' THEN 1 END) * 100.0 / 
                            NULLIF(COUNT(CASE WHEN at.status IN ('present', 'absent') THEN 1 END), 0)
                        )
                    ), 2) as avg_attendance_rate
                FROM attendance at
                INNER JOIN activities a ON at.activity_id = a.id
                $whereClause
            ";
            
            return $this->fetchOne($sql, $params);
        } catch (Exception $e) {
            error_log("Report getReportSummary error: " . $e->getMessage());
            throw new Exception("Unable to generate report summary");
        }
    }
    
    public function getTopDepartment($filters = []) {
        try {
            $whereConditions = [];
            $params = [];
            
            if (!empty($filters['start_date'])) {
                $whereConditions[] = "a.date >= ?";
                $params[] = $filters['start_date'];
            }
            
            if (!empty($filters['end_date'])) {
                $whereConditions[] = "a.date <= ?";
                $params[] = $filters['end_date'];
            }
            
            $whereClause = '';
            if (!empty($whereConditions)) {
                $whereClause = "WHERE " . implode(' AND ', $whereConditions);
            }
            
            $sql = "
                SELECT 
                    a.department,
                    ROUND(
                        (COUNT(CASE WHEN at.status = 'present' THEN 1 END) * 100.0 / 
                        NULLIF(COUNT(CASE WHEN at.status IN ('present', 'absent') THEN 1 END), 0)
                    ), 2) as attendance_rate
                FROM attendance at
                INNER JOIN activities a ON at.activity_id = a.id
                $whereClause
                GROUP BY a.department
                HAVING attendance_rate IS NOT NULL
                ORDER BY attendance_rate DESC
                LIMIT 1
            ";
            
            return $this->fetchOne($sql, $params);
        } catch (Exception $e) {
            error_log("Report getTopDepartment error: " . $e->getMessage());
            throw new Exception("Unable to get top department");
        }
    }
    
    // public function getDepartments() {
    //     try {
    //         $sql = "SELECT DISTINCT department FROM activities WHERE department IS NOT NULL AND department != '' ORDER BY department";
    //         return $this->fetchAll($sql);
    //     } catch (Exception $e) {
    //         error_log("Report getDepartments error: " . $e->getMessage());
    //         throw new Exception("Unable to retrieve departments");
    //     }
    // }
    
    // public function getActivityTypes() {
    //     try {
    //         $sql = "SELECT DISTINCT activity_name FROM activities WHERE activity_name IS NOT NULL ORDER BY activity_name";
    //         return $this->fetchAll($sql);
    //     } catch (Exception $e) {
    //         error_log("Report getActivityTypes error: " . $e->getMessage());
    //         throw new Exception("Unable to retrieve activity types");
    //     }
    // }
    
    // Enhanced validation method (improved version)
    private function validateReportData($data, $isUpdate = false) {
        $required = ['date', 'activity_name'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400);
            }
        }
        
        // Validate date format
        if (isset($data['date']) && !$this->isValidDate($data['date'])) {
            throw new Exception("Invalid date format", 400);
        }
        
        // Validate string lengths
        if (isset($data['activity_name']) && strlen($data['activity_name']) > 255) {
            throw new Exception("Activity name is too long", 400);
        }
        
        if (isset($data['department']) && strlen($data['department']) > 100) {
            throw new Exception("Department name is too long", 400);
        }
        
        // Check for duplicate activity on same date (for create operations)
        if (!$isUpdate && isset($data['activity_name']) && isset($data['date'])) {
            if ($this->valueExists('activities', 'activity_name', $data['activity_name'], null, ['date' => $data['date']])) {
                throw new Exception("An activity with this name already exists on the same date", 409);
            }
        }
        
        // For update operations, check if there's more than one duplicate
        if ($isUpdate && isset($data['activity_name']) && isset($data['date']) && isset($data['id'])) {
            $existingCount = $this->countDuplicates('activities', 'activity_name', $data['activity_name'], $data['id'], ['date' => $data['date']]);
            if ($existingCount > 0) {
                throw new Exception("An activity with this name already exists on the same date", 409);
            }
        }
    }
    
    // Enhanced duplicate checking method
    protected function valueExists($table, $column, $value, $excludeId = null, $additionalConditions = []) {
        $sql = "SELECT COUNT(*) as count FROM $table WHERE $column = ?";
        $params = [$value];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        foreach ($additionalConditions as $field => $conditionValue) {
            $sql .= " AND $field = ?";
            $params[] = $conditionValue;
        }
        
        $result = $this->fetchOne($sql, $params);
        return $result['count'] > 0;
    }
    
    // Count duplicates for update operations
    protected function countDuplicates($table, $column, $value, $excludeId = null, $additionalConditions = []) {
        $sql = "SELECT COUNT(*) as count FROM $table WHERE $column = ?";
        $params = [$value];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        foreach ($additionalConditions as $field => $conditionValue) {
            $sql .= " AND $field = ?";
            $params[] = $conditionValue;
        }
        
        $result = $this->fetchOne($sql, $params);
        return $result['count'];
    }
    
    private function isValidDate($date) {
        return (bool)strtotime($date);
    }
}
?>