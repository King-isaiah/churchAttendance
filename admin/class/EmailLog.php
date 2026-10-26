<?php
require_once '../class/Database.php';

class EmailLog extends Database {
    
    public function getFilteredLogs($data) {
        try {
            // Base query joining with members to get the name of the recipient
            $sql = "SELECT e.*, 
                    CONCAT(m.first_name, ' ', m.last_name) as recipient_name 
                    FROM email_logs e 
                    LEFT JOIN members m ON e.recipient_email = m.email 
                    WHERE 1=1";
            
            $params = [];

            // Filter by Search (Subject or Email)
            if (!empty($data['search'])) {
                $sql .= " AND (e.subject LIKE ? OR e.recipient_email LIKE ?)";
                $searchTerm = "%" . $data['search'] . "%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            // Filter by Date Range
            if (!empty($data['start_date']) && !empty($data['end_date'])) {
                $sql .= " AND DATE(e.sent_at) BETWEEN ? AND ?";
                $params[] = $data['start_date'];
                $params[] = $data['end_date'];
            }

            $sql .= " ORDER BY e.sent_at DESC";

            return $this->fetchAll($sql, $params);

        } catch (Exception $e) {
            error_log("EmailLog getFilteredLogs error: " . $e->getMessage());
            throw new Exception("Unable to retrieve email logs");
        }
    }
}
?>