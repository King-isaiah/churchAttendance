<?php
require_once 'Database.php';

class Dashboard extends Database {
    
    public function getDashboardStats() {
        try {
            $stats = [];
           
            $stats['total_attendees'] = $this->fetchOne("SELECT COUNT(DISTINCT unique_id) as total FROM attendance 
                    WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
                ")['total'] ?? 0;

                
           $stats['weekly_attendees'] = $this->fetchAll("SELECT DISTINCT m.user_name FROM attendance a 
                LEFT JOIN members m ON a.unique_id = m.unique_id 
                WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY m.user_name
            ");


            $stats['weekly_attendees'] = $this->fetchAll("SELECT m.user_name FROM members m
                WHERE (
                    SELECT COUNT(DISTINCT a.attendance_category_id) 
                    FROM attendance a 
                    WHERE a.unique_id = m.unique_id 
                    AND a.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ) = (
                    SELECT COUNT(DISTINCT attendance_category_id) 
                    FROM attendance 
                    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                )
                ORDER BY m.user_name
            ");


            $stats['NewMembers'] = $this->fetchAll("SELECT id, user_name, DAYOFWEEK(created_at) as day_num, DAYNAME(created_at) as day_name,
                    DATE(created_at) as registration_date,
                    DATEDIFF(CURDATE(), DATE(created_at)) as days_since_registration
                FROM members WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY FIELD(DAYOFWEEK(created_at), 2,3,4,5,6,7,1), created_at DESC
            ");

            // Get activities this week
            $stats['activities_this_week'] = $this->fetchOne("
                SELECT COUNT(DISTINCT attendance_category_id) as total 
                FROM attendance 
                WHERE attendance_category = 'activity' 
                AND YEARWEEK(created_at) = YEARWEEK(CURDATE())
            ")['total'] ?? 0;
            
            // Get growth percentage
            $lastWeek = $this->fetchOne("
                SELECT COUNT(DISTINCT unique_id) as total 
                FROM attendance 
                WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK)
            ")['total'] ?? 0;
            
            $thisWeek = $this->fetchOne("
                SELECT COUNT(DISTINCT unique_id) as total 
                FROM attendance 
                WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE())
            ")['total'] ?? 0;
            
            if ($lastWeek > 0) {
                $stats['growth_percentage'] = round((($thisWeek - $lastWeek) / $lastWeek) * 100);
            } else {
                $stats['growth_percentage'] = $thisWeek > 0 ? 100 : 0;
            }
            
            // Get weekly attendance data
            $weeklyData = $this->fetchAll("SELECT 
                    DAYOFWEEK(created_at) as day_num,
                    DAYNAME(created_at) as day_name,
                    COUNT(*) as attendance_count  
                FROM attendance 
                WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)  
                GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
                ORDER BY FIELD(DAYOFWEEK(created_at), 2,3,4,5,6,7,1)
            ");
            
            $stats['weekly_data'] = array_fill(0, 7, 0); // Initialize array with 7 zeros
            
            $dayMapping = [
                1 => 0, 
                2 => 1, 
                3 => 2, 
                4 => 3, 
                5 => 4, 
                6 => 5, 
                7 => 6  
            ];
            
            foreach($weeklyData as $data) {
                $dayPosition = $dayMapping[$data['day_num']];
                $stats['weekly_data'][$dayPosition] = (int)$data['attendance_count'];
            }

            // Monthly data - current year
            $monthlyData = $this->fetchAll("SELECT 
                    MONTH(created_at) as month_num,
                    MONTHNAME(created_at) as month_name,
                    COUNT(*) as attendance_count
                FROM attendance 
                WHERE YEAR(created_at) = YEAR(CURDATE())
                GROUP BY MONTH(created_at), MONTHNAME(created_at)
                ORDER BY MONTH(created_at)
            ");
            
            // Initialize array with 12 zeros (Jan=0, Dec=11)
            $stats['monthly_data'] = array_fill(0, 12, 0);            
            
            foreach($monthlyData as $data) {
                $index = $data['month_num'] - 1; 
                $stats['monthly_data'][$index] = (int)$data['attendance_count'];
            }
            
            
            $stats['monthly_labels'] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            $currentMonth = (int)date('n'); // Current month number
            $currentYear = (int)date('Y'); // Current year

            // Determine if we need to include previous year data
            if ($currentMonth < 4) {   
                $monthsNeeded = 4 - $currentMonth;
                
                $quarterlyQuery = "SELECT YEAR(created_at) as year, MONTH(created_at) as month_num,
                                    MONTHNAME(created_at) as month_name,
                                    COUNT(*) as attendance_count
                                FROM attendance 
                                WHERE (
                                    -- Current year data
                                    (YEAR(created_at) = ? AND MONTH(created_at) <= ?)
                                    OR
                                    -- Previous year data (last months of previous year)
                                    (YEAR(created_at) = ? - 1 AND MONTH(created_at) > 12 - ?)
                                )
                                GROUP BY YEAR(created_at), MONTH(created_at), MONTHNAME(created_at)
                                ORDER BY YEAR(created_at), MONTH(created_at)";
                
                $quarterlyData = $this->fetchAll($quarterlyQuery, [
                    $currentYear, $currentMonth,
                    $currentYear, $monthsNeeded
                ]);
            } else {
                // Enough months in current year for a full quarter
                $quarterlyQuery = "SELECT 
                                    MONTH(created_at) as month_num,
                                    MONTHNAME(created_at) as month_name,
                                    COUNT(*) as attendance_count
                                FROM attendance 
                                WHERE YEAR(created_at) = ?
                                AND MONTH(created_at) <= ?
                                AND MONTH(created_at) > ? - 4
                                GROUP BY MONTH(created_at), MONTHNAME(created_at)
                                ORDER BY MONTH(created_at)";
                
                $quarterlyData = $this->fetchAll($quarterlyQuery, [
                    $currentYear, $currentMonth, $currentMonth
                ]);
            }

            // Process quarterly data
            $stats['quarterly_data'] = [];
            $stats['quarterly_labels'] = [];

            // If we have data from both years, format it properly
            if (!empty($quarterlyData)) {
                foreach ($quarterlyData as $data) {
                    $year = isset($data['year']) ? $data['year'] : $currentYear;
                    $monthNum = $data['month_num'];
                    $monthName = substr($data['month_name'], 0, 3); // Short month name
                    
                    // Create label (e.g., "Jan '24" or "Dec '23")
                    $shortYear = substr($year, -2);
                    $label = $monthName . " '" . $shortYear;
                    
                    $stats['quarterly_labels'][] = $label;
                    $stats['quarterly_data'][] = (int)$data['attendance_count'];
                }
                
                // Ensure we always have exactly 4 months in the quarter
                $count = count($stats['quarterly_data']);
                if ($count < 4) {
                    // Pad with zeros if we don't have enough data
                    for ($i = $count; $i < 4; $i++) {
                        $stats['quarterly_data'][] = 0;
                        $stats['quarterly_labels'][] = "Month " . ($i + 1);
                    }
                }
            }


            return $stats;
            
        } catch (Exception $e) {
            error_log("Dashboard stats error: " . $e->getMessage());
            return false;
        }
    }
    
    public function getRecentActivities() {
        try {
            $sql = "SELECT DISTINCT
                    a.attendance_category,
                    a.attendance_category_id,
                    COALESCE(act.name, ev.title) as activity_name,
                    DATE(a.created_at) as date,
                    COUNT(DISTINCT a.unique_id) as attendance_count,
                    l.name as location_name
                FROM attendance a
                LEFT JOIN activities act ON 
                    a.attendance_category = 'activity' 
                    AND a.attendance_category_id = act.id
                LEFT JOIN events ev ON 
                    a.attendance_category = 'event' 
                    AND a.attendance_category_id = ev.id
                LEFT JOIN locations l ON a.location_id = l.id
                WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY 
                    a.attendance_category,
                    a.attendance_category_id,
                    COALESCE(act.name, ev.title),
                    DATE(a.created_at),
                    l.name
                ORDER BY DATE(a.created_at) DESC
                LIMIT 10
            ";
            
            return $this->fetchAll($sql);
            
        } catch (Exception $e) {
            error_log("Recent activities error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getDepartmentStats() {
        try {
            $sql = "SELECT 
                    d.name as department_name,
                    COUNT(DISTINCT a.unique_id) as total_members,
                    MAX(a.created_at) as last_activity_date
                FROM attendance a
                INNER JOIN members m ON a.unique_id = m.unique_id
                LEFT JOIN departments d ON m.department_id = d.id
                WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                AND d.id IS NOT NULL
                GROUP BY d.id, d.name
                ORDER BY total_members DESC
                LIMIT 10
            ";
            
            return $this->fetchAll($sql);
            
        } catch (Exception $e) {
            error_log("Department stats error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getAttendanceRewards() {
        try {
            $sql = "
                SELECT 
                    m.first_name,
                    m.last_name,
                    COUNT(DISTINCT DATE(a.created_at)) as days_attended,
                    RANK() OVER (ORDER BY COUNT(DISTINCT DATE(a.created_at)) DESC) as ranking
                FROM attendance a
                INNER JOIN members m ON a.unique_id = m.unique_id
                WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY m.unique_id, m.first_name, m.last_name
                ORDER BY days_attended DESC
                LIMIT 3
            ";
            
            return $this->fetchAll($sql);
            
        } catch (Exception $e) {
            error_log("Attendance rewards error: " . $e->getMessage());
            return [];
        }
    }
    
    public function searchActivities($searchTerm) {
        try {
            $sql = "
                SELECT DISTINCT
                    a.attendance_category,
                    a.attendance_category_id,
                    COALESCE(act.name, ev.title) as activity_name,
                    DATE(a.created_at) as date,
                    COUNT(DISTINCT a.unique_id) as attendance_count,
                    l.name as location_name
                FROM attendance a
                LEFT JOIN activities act ON 
                    a.attendance_category = 'activity' 
                    AND a.attendance_category_id = act.id
                LEFT JOIN events ev ON 
                    a.attendance_category = 'event' 
                    AND a.attendance_category_id = ev.id
                LEFT JOIN locations l ON a.location_id = l.id
                WHERE COALESCE(act.name, ev.title) LIKE ?
                    OR l.name LIKE ?
                GROUP BY 
                    a.attendance_category,
                    a.attendance_category_id,
                    COALESCE(act.name, ev.title),
                    DATE(a.created_at),
                    l.name
                ORDER BY DATE(a.created_at) DESC
                LIMIT 10
            ";
            
            $searchParam = "%{$searchTerm}%";
            return $this->fetchAll($sql, [$searchParam, $searchParam]);
            
        } catch (Exception $e) {
            error_log("Search activities error: " . $e->getMessage());
            return [];
        }
    }
}
?>