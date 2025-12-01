<?php
// require_once 'Database.php';

// class Location extends Database {
    
//     public function getAllLocations() {
//         try {
//             $sql = "
//                 SELECT * FROM locations 
//                 ORDER BY created_at DESC
//             ";
//             return $this->fetchAll($sql);
//         } catch (Exception $e) {
//             error_log("Location getAll error: " . $e->getMessage());
//             return [];
//         }
//     }
    
//     public function getLocation($id) {
//         try {
//             $sql = "SELECT * FROM locations WHERE id = ?";
//             return $this->fetchOne($sql, [$id]);
//         } catch (Exception $e) {
//             error_log("Location get error: " . $e->getMessage());
//             return false;
//         }
//     }
    
//     public function createLocation($data) {
//         try {
//             return $this->insert('locations', $data);
//         } catch (Exception $e) {
//             error_log("Location create error: " . $e->getMessage());
//             return false;
//         }
//     }
    
//     public function updateLocation($id, $data) {
//         try {
//             return $this->update('locations', $data, 'id = ?', [$id]);
//         } catch (Exception $e) {
//             error_log("Location update error: " . $e->getMessage());
//             return false;
//         }
//     }
    
//     public function deleteLocation($id) {
//         try {
//             return $this->delete('locations', 'id = ?', [$id]);
//         } catch (Exception $e) {
//             error_log("Location delete error: " . $e->getMessage());
//             return false;
//         }
//     }
// }
?>
<?php
require_once 'Database.php';

class Location extends Database {
    
    public function getAllLocations() {
        try {
            $sql = "
                SELECT * FROM locations 
                ORDER BY created_at DESC
            ";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Location getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getLocation($id) {
        try {
            $sql = "SELECT * FROM locations WHERE id = ?";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Location not found", 404);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Location get error [ID: $id]: " . $e->getMessage());
            
            // Re-throw user-facing errors, suppress others
            if ($e->getCode() === 404) {
                throw $e; // User should know if something isn't found
            }
            throw new Exception("Unable to retrieve location information");
        }
    }
    
    public function createLocation($data) {
        try {
            // Validate required fields
            $this->validateLocationData($data);
            
            return $this->insert('locations', $data);
        } catch (Exception $e) {
            error_log("Location create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; // Re-throw so ApiHandler can handle it properly
        }
    }
    
    
public function updateLocation($id, $data) {
    try {
        // Check if location exists first
        $existing = $this->getLocation($id);
        if (!$existing) {
            throw new Exception("Location not found", 404);
        }
        
        // Validate data
        $this->validateLocationData($data, true);
        
        // Let the database handle duplicates
        return $this->update('locations', $data, 'id = ?', [$id]);
        
    } catch (Exception $e) {
        error_log("Location update error [ID: $id]: " . $e->getMessage());
        throw $e;
    }
}
    
    public function deleteLocation($id) {
        try {
            // Check if location exists first
            $existing = $this->getLocation($id);
            if (!$existing) {
                throw new Exception("Location not found", 404);
            }
            
            return $this->delete('locations', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Location delete error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Validate location data before create/update
     */
    
    private function validateLocationData($data, $isUpdate = false) {
        $required = ['name', 'capacity'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400); // 400 for validation errors
            }
        }
        
        // Validate capacity is a positive number
        if (isset($data['capacity']) && (!is_numeric($data['capacity']) || $data['capacity'] <= 0)) {
            throw new Exception("Capacity must be a positive number", 400);
        }
        
        // Validate name length
        if (isset($data['name']) && strlen($data['name']) > 255) {
            throw new Exception("Location name is too long", 400);
        }
    }
}
?>