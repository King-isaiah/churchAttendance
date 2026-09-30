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