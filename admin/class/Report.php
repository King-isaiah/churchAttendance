<?php
require_once 'Database.php';

class Report extends Database {
    
    public function creatAReport($data){
        try {         
            $start_date = $data['start_date']; 
            $end_date = $data['end_date'];
            $department_id = ($data['department_id'] === 'all') ? null : (int)$data['department_id'];
            $attendance_category = ($data['attendance_category'] === 'all') ? null : $data['attendance_category'];
            $attendance_category_id = ($data['attendance_category_id'] === 'all') ? null : (int)$data['attendance_category_id'];

            $conditions = [];

            if (!empty($start_date) && !empty($end_date)) {
                $conditions[] = "DATE(a.created_at) BETWEEN '$start_date' AND '$end_date'";
            } else if (!empty($start_date)) {
                $conditions[] = "DATE(a.created_at) >= '$start_date'";
            } else if (!empty($end_date)) {
                $conditions[] = "DATE(a.created_at) <= '$end_date'";
            }

            if ($department_id !== null) {
                $conditions[] = "a.department_id = $department_id";
            }

            if ($attendance_category !== null) {
                $conditions[] = "a.attendance_category = '$attendance_category'";
            }

            if ($attendance_category_id !== null) {
                $conditions[] = "a.attendance_category_id = $attendance_category_id";
            }

            $where = empty($conditions) ? '' : ' WHERE ' . implode(' AND ', $conditions);

            $sql = "SELECT a.id, a.dayofactivity as date, a.attendance_category, a.attendance_category_id, a.created_at, 
                    a.status, m.first_name, m.user_name, m.last_name, a.unique_id,a.check_in_time,
                    CASE 
                        WHEN a.attendance_category = 'activity' THEN act.name
                        WHEN a.attendance_category = 'event' THEN ev.title
                        ELSE 'Unknown'
                    END as activity_name,
                    COALESCE(d.name, 'All') as department
                    FROM attendance a
                    LEFT JOIN departments d ON a.department_id = d.id
                    LEFT JOIN members m ON a.unique_id = m.unique_id
                    LEFT JOIN activities act ON a.attendance_category = 'activity' AND a.attendance_category_id = act.id
                    LEFT JOIN events ev ON a.attendance_category = 'event' AND a.attendance_category_id = ev.id
                    $where
                    ORDER BY a.created_at DESC";

            return $this->fetchAll($sql);
                        
        } catch (Exception $e) {
            error_log("Report creatAReport error: " . $e->getMessage());
            return [];
        }
    }
    public function getDepartmentMemberCounts() {
        $sql = "SELECT d.id, d.name, COUNT(m.id) as total_members 
                FROM departments d 
                LEFT JOIN members m ON m.department_id = d.id 
                GROUP BY d.id, d.name";
        return $this->fetchAll($sql);
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
    public function getMemberReport($uniqueId) {
        try {
            $sql = "SELECT a.id, a.dayofactivity as date, a.status, a.check_in_time, 
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
                    ORDER BY a.created_at DESC";
            return $this->fetchAll($sql, [$uniqueId]);
        } catch (Exception $e) {
            error_log("Report getMemberReport error: " . $e->getMessage());
            return [];
        }
    }
    public function exportToCSV($filters = []) {
        try {
            $data = $this->getAttendanceReports($filters);
            
            if (empty($data)) {
                return false;
            }
            
            // Generate CSV content
            $csv = "No,Day,Date,Activity Category,Activity/Event,Department,Present,Absent,Attendance Rate\n";
            
            foreach ($data as $row) {
                $csv .= sprintf(
                    "%s,%s,%s,%s,%d,%d,%.1f%%\n",
                    $row['no'],
                    $row['day'],
                    $row['date'],
                    $row['attendance_category'],
                    $row['activity_name'],
                    $row['department'],
                    $row['present_count'],
                    $row['absent_count'],
                    $row['attendance_rate']
                );
            }
            
            return $csv;
            
        } catch (Exception $e) {
            error_log("Report exportToCSV error: " . $e->getMessage());
            return false;
        }
    }
}
?>