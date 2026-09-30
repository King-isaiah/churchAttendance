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
            $id =  $this->insert('speakers', $data);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Create Speaker.Please try again or call dev.',
                    'status' => 400 // optional, will be used as HTTP status
                ];               
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Speaker '{$data['speakers_name']}'."
            ];
        } catch (Exception $e) {
            error_log("Speaker create error: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateSpeaker($id, $data) {
        try {
            $id =  $this->update('speakers', $data, 'id = ?', [$id]);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Update Speaker.Please try again or call dev.',
                    'status' => 400 
                ];
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Speaker '{$data['speakers_name']}'."
            ];
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
            $id = $this->delete('speakers', 'id = ?', [$id]);

            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Delete Speaker.Please try again or call dev.',
                    'status' => 500 
                ];
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Speaker deleted succesfully."
            ];
        } catch (Exception $e) {
            error_log("Speaker delete error: " . $e->getMessage());
            return false;
        }
    }
}
?>