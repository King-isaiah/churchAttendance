<?php
require_once 'Database.php';

class Status extends Database {
    
    public function getAllStatuses() {
        try {
            $sql = "SELECT * FROM statuses ORDER BY name ASC";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Status getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getStatus($id) {
        try {
            $sql = "SELECT * FROM statuses WHERE id = ?";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Status not found", 404);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Status get error [ID: $id]: " . $e->getMessage());
            if ($e->getCode() === 404) {
                throw $e; 
            }
            throw new Exception("Unable to retrieve status information");
        }
    }
    
    public function createStatus($data) {
        try {
            $this->validateStatusData($data);
            return $this->insert('statuses', $data);
        } catch (Exception $e) {
            error_log("Status create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; 
        }
    }
    
    public function updateStatus($id, $data) {
        try {
            $existing = $this->getStatus($id);
            if (!$existing) {
                throw new Exception("Status not found", 404);
            }
            
            $this->validateStatusData($data, true);
            return $this->update('statuses', $data, 'id = ?', [$id]);
            
        } catch (Exception $e) {
            error_log("Status update error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function deleteStatus($id) {
        try {
            $existing = $this->getStatus($id);
            if (!$existing) {
                throw new Exception("Status not found", 404);
            }
            
            return $this->delete('statuses', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Status delete error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function validateStatusData($data, $isUpdate = false) {
        $required = ['name', 'color'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400); 
            }
        }
        
        if (isset($data['name']) && strlen($data['name']) > 100) {
            throw new Exception("Status name is too long", 400);
        }
        
        if (isset($data['color']) && !preg_match('/^#[0-9A-F]{6}$/i', $data['color'])) {
            throw new Exception("Invalid color format", 400);
        }
    }
}
?>