<?php
require_once 'Database.php';

class AttendanceMethod extends Database {
    
    public function getAllAttendanceMethods() {
        try {
            $sql = "SELECT * FROM attendance_methods ORDER BY name ASC";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("AttendanceMethod getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getAttendanceMethod($id) {
        try {
            $sql = "SELECT * FROM attendance_methods WHERE id = ?";
            $result = $this->fetchOne($sql, [$id]);
            
            if (!$result) {
                throw new Exception("Attendance method not found", 404);
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("AttendanceMethod get error [ID: $id]: " . $e->getMessage());
            if ($e->getCode() === 404) {
                throw $e; 
            }
            throw new Exception("Unable to retrieve attendance method information");
        }
    }
    
    public function createAttendanceMethod($data) {
        try {
            $this->validateAttendanceMethodData($data);
            return $this->insert('attendance_methods', $data);
        } catch (Exception $e) {
            error_log("AttendanceMethod create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; 
        }
    }
    
    public function updateAttendanceMethod($id, $data) {
        try {
            $existing = $this->getAttendanceMethod($id);
            if (!$existing) {
                throw new Exception("Attendance method not found", 404);
            }
            
            $this->validateAttendanceMethodData($data, true);
            return $this->update('attendance_methods', $data, 'id = ?', [$id]);
            
        } catch (Exception $e) {
            error_log("AttendanceMethod update error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function deleteAttendanceMethod($id) {
        try {
            $existing = $this->getAttendanceMethod($id);
            if (!$existing) {
                throw new Exception("Attendance method not found", 404);
            }
            
            return $this->delete('attendance_methods', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("AttendanceMethod delete error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    public function getDefaultAttendanceMethods() {
        return [
            ['name' => 'QR Code', 'code' => 'qr_code', 'description' => 'Scan QR code to check in'],
            ['name' => 'Numeric Code', 'code' => 'numeric_code', 'description' => 'Enter numeric code to check in'],
            ['name' => 'Location', 'code' => 'location', 'description' => 'GPS location-based check in'],
            ['name' => 'NFC/RFID', 'code' => 'nfc', 'description' => 'Tap NFC/RFID card to check in']
        ];
    }
    
    public function populateDefaultMethods() {
        try {
            $defaultMethods = $this->getDefaultAttendanceMethods();
            $inserted = 0;
            
            foreach ($defaultMethods as $method) {
                // Check if method already exists
                $existing = $this->fetchOne("SELECT id FROM attendance_methods WHERE code = ?", [$method['code']]);
                if (!$existing) {
                    $this->insert('attendance_methods', $method);
                    $inserted++;
                }
            }
            
            return $inserted;
        } catch (Exception $e) {
            error_log("AttendanceMethod populateDefault error: " . $e->getMessage());
            return 0;
        }
    }
    
    private function validateAttendanceMethodData($data, $isUpdate = false) {
        $required = ['name', 'code'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("$field is required", 400); 
            }
        }
        
        if (isset($data['name']) && strlen($data['name']) > 100) {
            throw new Exception("Attendance method name is too long", 400);
        }
        
        if (isset($data['code']) && strlen($data['code']) > 50) {
            throw new Exception("Attendance method code is too long", 400);
        }
        
        if (isset($data['description']) && strlen($data['description']) > 255) {
            throw new Exception("Description is too long", 400);
        }
        
        // Validate code format (only lowercase letters and underscores)
        if (isset($data['code']) && !preg_match('/^[a-z_]+$/', $data['code'])) {
            throw new Exception("Code can only contain lowercase letters and underscores", 400);
        }
    }
}
?>