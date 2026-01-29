<?php
    require_once 'Database.php';

    class RSVP extends Database {
        public function getRSVPByEvent($eventId) {
            try {
                $sql = "SELECT r.*, e.title as event_title 
                        FROM rsvp r 
                        LEFT JOIN events e ON r.event_id = e.id 
                        WHERE r.event_id = ? 
                        ORDER BY r.response_date DESC";
                return $this->fetchAll($sql, [$eventId]);
            } catch (Exception $e) {
                error_log("Error getting RSVP by event: " . $e->getMessage());
                return [];
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