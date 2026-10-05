<?php
require_once 'Database.php';

class Speaker extends Database {
    
    public function getAllSpeakers() {
        try {
            $sql = "
                SELECT * FROM speakers                
                ORDER BY created_at DESC
            ";
            // $sql = "
            //     SELECT s.*, COUNT(e.id) as event_count 
            //     FROM speakers s 
            //     LEFT JOIN events e ON s.id = e.speaker_id 
            //     GROUP BY s.id 
            //     ORDER BY s.created_at DESC
            // ";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Speaker getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getSpeaker($id) {
        try {
            $sql = "SELECT * FROM speakers WHERE id = ?";
            return $this->fetchOne($sql, [$id]);
        } catch (Exception $e) {
            error_log("Speaker get error: " . $e->getMessage());
            return false;
        }
    }
    
    public function createSpeaker($data) {
        try {
            return $this->insert('speakers', $data);
        } catch (Exception $e) {
            error_log("Speaker create error: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateSpeaker($id, $data) {
        try {
            return $this->update('speakers', $data, 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Speaker update error: " . $e->getMessage());
            return false;
        }
    }
    
    // public function deleteSpeaker($id) {
    //     try {
    //         // First set events speaker_id to NULL
    //         $this->executeQuery(
    //             "DELETE speakers WHERE id = ?", [$id]
    //         );
            
    //         // Then delete the speaker
    //         return $this->delete('speakers', 'id = ?', [$id]);
    //     } catch (Exception $e) {
    //         error_log("Speaker delete error: " . $e->getMessage());
    //         return false;
    //     }
    // }

    public function deleteSpeaker($id) {
        try {
            // Delete the speaker from the speakers table
            return $this->delete('speakers', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Speaker delete error: " . $e->getMessage());
            return false;
        }
    }
}
?>