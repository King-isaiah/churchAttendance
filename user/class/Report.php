<?php
require_once 'Database.php';

class Report extends Database {
    public function creatAReport($data){
        try {         
            $year = isset($data['year']) && $data['year'] !== 'all' ? (int)$data['year'] : null;
            $month = isset($data['month']) && $data['month'] !== 'all' ? $data['month'] : null;
            $status = isset($data['status']) && $data['status'] !== 'all' ? $data['status'] : null;
            $unique_id = isset($data['unique_id']) ? $data['unique_id'] : null;

            $conditions = [];

           
            if ($year !== null) {
                $conditions[] = "YEAR(a.created_at) = $year";
            }

            if ($month !== null) {
                $month = ucfirst(strtolower($month));
                $conditions[] = "MONTHNAME(a.created_at) = '$month'";
            }

 
            if ($status !== null) {
                $conditions[] = "a.status = '$status'"; 
            }

            
            if ($unique_id !== null) {
                $conditions[] = "a.unique_id = $unique_id";
            }

            $where = empty($conditions) ? '' : ' WHERE ' . implode(' AND ', $conditions);

            $year = isset($data['year']) && $data['year'] !== 'all' ? (int)$data['year'] : null;
            $month = isset($data['month']) && $data['month'] !== 'all' ? $data['month'] : null;
            $status = isset($data['status']) && $data['status'] !== 'all' ? $data['status'] : null;
            $unique_id = isset($data['unique_id']) ? $data['unique_id'] : null;

            $conditions = [];

       
            if ($year !== null) {
                $conditions[] = "YEAR(a.created_at) = $year";
            }

        
            if ($month !== null) {
                $month = ucfirst(strtolower($month));
                $conditions[] = "MONTHNAME(a.created_at) = '$month'";
            }


            if ($status !== null) {
                $conditions[] = "a.status = '$status'"; 
            }


            if ($unique_id !== null) {
                $conditions[] = "a.unique_id = $unique_id";
            }

            $where = empty($conditions) ? '' : ' WHERE ' . implode(' AND ', $conditions);

            $sql = "SELECT DATE(a.created_at) as date, a.attendance_category, a.created_at, a.status,a.unique_id,
                        a.dayofactivity,  l.name as location_name, a.check_in_time,
                        COALESCE(act.name, ev.title) as activity_or_event_name,                        
                        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
                        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
                        ROUND(
                            (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / 
                            NULLIF(COUNT(CASE WHEN a.status IN ('Present', 'Absent') THEN 1 END), 0)
                        ), 1) as attendance_rate
                    FROM attendance a  LEFT JOIN activities act ON a.attendance_category = 'activity' AND a.attendance_category_id = act.id
                    LEFT JOIN events ev ON a.attendance_category = 'event' AND a.attendance_category_id = ev.id
                    LEFT JOIN locations l ON a.location_id = l.id $where GROUP BY 
                        DATE(a.created_at),                        
                        COALESCE(act.name, ev.title),
                        l.name
                    ORDER BY a.created_at DESC";
                        // $sql .= "
                        //     GROUP BY DATE(a.dayofactivity), a.attendance_category, 
                        //             a.attendance_category_id
                        //     ORDER BY DATE(a.dayofactivity) DESC
                        // ";
                        
                        return $this->fetchAll($sql);
                                    
        } catch (Exception $e) {
            error_log("Report getIndividualAttendance error: " . $e->getMessage());
            return [];
        }
    }

            
}
?>