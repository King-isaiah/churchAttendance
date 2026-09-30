<?php
    require_once 'Database.php';

    class RSVP extends Database {
        public function getRSVPByEvent($eventId) {
            try {
                $sql = "SELECT rsvp.*, rsvp.id AS ide, rsvp.created_at AS dated, members.* FROM rsvp 
                LEFT JOIN members ON rsvp.unique_id = members.unique_id WHERE event_id =?";
                return $this->fetchAll($sql, [$eventId]);
            } catch (Exception $e) {
                error_log("Error getting RSVP by event: " . $e->getMessage());
                return [];
            }
        }

    public function getRSVPTrendByEvent($eventId, $days = 7) {
        try {
            // Calculate start date
            $startDate = date('Y-m-d', strtotime("-$days days"));
            
            $sql = "SELECT 
                        DATE(created_at) as response_date,
                        COUNT(*) as count,
                        SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END) as attending_count,
                        SUM(CASE WHEN attending = 2 THEN 1 ELSE 0 END) as not_attending_count,
                        SUM(CASE WHEN attending = 3 THEN 1 ELSE 0 END) as maybe_count
                    FROM rsvp 
                    WHERE event_id = ? 
                    AND created_at >= ?
                    GROUP BY DATE(created_at)
                    ORDER BY response_date ASC";
            
            // CORRECTED: Pass both parameters in a single array
            $results = $this->fetchAll($sql, [$eventId, $startDate]);
            
            // Create array for all days in the period
            $trendData = [];
            $dates = [];
            
            // Generate all dates in the period
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $dates[] = $date;
                $trendData[$date] = [
                    'date' => $date,
                    'day_name' => date('D', strtotime($date)),
                    'total' => 0,
                    'attending' => 0,
                    'not_attending' => 0,
                    'maybe' => 0
                ];
            }
            
            // Fill with actual data
            foreach ($results as $row) {
                $date = $row['response_date'];
                if (isset($trendData[$date])) {
                    $trendData[$date]['total'] = (int)$row['count'];
                    $trendData[$date]['attending'] = (int)$row['attending_count'];
                    $trendData[$date]['not_attending'] = (int)$row['not_attending_count'];
                    $trendData[$date]['maybe'] = (int)$row['maybe_count'];
                }
            }
            
            return array_values($trendData);
            
        } catch (Exception $e) {
            error_log("Error getting RSVP trend: " . $e->getMessage());
            return [];
        }
    }    
    public function getRSVPDetails($id) {
        try {
            $sql = "
                SELECT r.*, m.first_name as first_name, m.last_name as last_name, name
                FROM rsvp r LEFT JOIN members m ON r.event_id = m.id
                LEFT JOIN departments d ON m.department_id	 = d.id
                WHERE e.id = ?
            ";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Event not found", 404);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Event get error [ID: $id]: " . $e->getMessage());
            if ($e->getCode() === 404) {
                throw $e;
            }
            throw new Exception("Unable to retrieve event information");
        }
    }
        
        public function saveRSVP($data) {
            try {
                $conditions = [
                    'event_id' => $data['event_id'],
                    'unique_id' => $data['unique_id']
                ];
                
                $check = $this->recordExists('rsvp', $conditions);
                
                if ($check) {                
                    $where = 'event_id = ? AND unique_id = ?';
                    $whereParams = [$data['event_id'], $data['unique_id']];
                    return $this->update('rsvp', $data, $where, $whereParams);
                }else {                    
                    return $this->insert('rsvp', $data);
                }
                
            } catch (Exception $e) {
                error_log("RSVP save error: " . $e->getMessage() . " | Data: " . json_encode($data));
                throw $e; 
            }
        }
    }
?>