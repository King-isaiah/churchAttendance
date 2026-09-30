<?php
require_once 'Database.php';
require_once 'Activity.php';
class QRGenerator extends Database {
    public function generateQRCode($activityId, $data) {
        try {
            $activityObj =  new Activity;
            // Validate activity exists
            $activity = $activityObj->getActivity($activityId);
            if (!$activity) {
                throw new Exception("Activity not found", 404);
            }
            
            // Generate unique QR data
            $qrData = "ACTIVITY_" . $activityId . "_" . time() . "_" . bin2hex(random_bytes(4));
            
            // Calculate expiry time
            $expiryHours = $data['expiry_hours'] ?? 3;
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));
            $maxUses = $data['max_uses'] ?? 100;
            
            // Check if QR code table exists, create if not
            $this->createQRCodeTableIfNotExists();
            
            // Deactivate any existing QR codes for this activity
            $this->deactivateExistingQRCodes($activityId);
            
            // Save new QR code
            $qrRecord = [
                'activity_id' => $activityId,
                'qr_code' => $qrData,
                'expires_at' => $expiresAt,
                'max_uses' => $maxUses,
                'uses' => 0,
                'is_active' => 1,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $this->insert('activity_qr_codes', $qrRecord);
            
            return [
                'success' => true,
                'qr_data' => $qrData,
                'expires_at' => $expiresAt,
                'max_uses' => $maxUses
            ];
            
        } catch (Exception $e) {
            error_log("QR Generation error: " . $e->getMessage());
            throw new Exception("Unable to generate QR code: " . $e->getMessage());
        }
    }

    
    public function getQRCode($activityId) {
        try {
            $this->createQRCodeTableIfNotExists();
            
            $sql = "SELECT qr_code, expires_at, uses, max_uses, is_active 
                    FROM activity_qr_codes 
                    WHERE activity_id = ? AND is_active = 1 AND expires_at > NOW() AND uses < max_uses 
                    ORDER BY created_at DESC LIMIT 1";
            return $this->fetchOne($sql, [$activityId]);
        } catch (Exception $e) {
            error_log("Get QR error: " . $e->getMessage());
            return null;
        }
    }

    private function createQRCodeTableIfNotExists() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS activity_qr_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                activity_id INT NOT NULL,
                qr_code VARCHAR(255) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                max_uses INT DEFAULT 100,
                uses INT DEFAULT 0,
                is_active TINYINT DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
                INDEX idx_activity_id (activity_id),
                INDEX idx_qr_code (qr_code),
                INDEX idx_expires_at (expires_at)
            )";
            
            // Use executeQuery() for the CREATE TABLE statement
            $this->executeQuery($sql);
        } catch (Exception $e) {
            error_log("QR table creation error: " . $e->getMessage());
            throw new Exception("Unable to setup QR code system");
        }
    }

    private function deactivateExistingQRCodes($activityId) {
        try {
            $sql = "UPDATE activity_qr_codes SET is_active = 0 WHERE activity_id = ? AND is_active = 1";
            // Use executeQuery() with parameters for the UPDATE statement
            $this->executeQuery($sql, [$activityId]);
        } catch (Exception $e) {
            error_log("Deactivate QR codes error: " . $e->getMessage());
            // Continue anyway - this is not critical
        }
    }
    public function generateActivityQR($activityId, $options = []) {
        try {
            // Generate unique QR code for activity
            $uniqueCode = $this->generateUniqueCode($activityId);
            
            // Store QR code data in database
            $this->storeQRCode($activityId, $uniqueCode, $options);
            
            // Return QR code data (you can generate image later)
            return [
                'success' => true,
                'qr_code' => $uniqueCode,
                'activity_id' => $activityId,
                'expires_at' => $options['expires_at'] ?? date('Y-m-d H:i:s', strtotime('+24 hours'))
            ];
            
        } catch (Exception $e) {
            error_log("QR Generation Error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function validateQRCode($qrData, $userId = null) {
        try {
            $sql = "SELECT * FROM activity_qr_codes 
                    WHERE qr_code = ? AND expires_at > NOW() AND uses < max_uses";
            // CORRECTED: Use inherited method directly, not $this->db->fetchOne()
            $qrRecord = $this->fetchOne($sql, [$qrData]);
            
            if (!$qrRecord) {
                return ['valid' => false, 'error' => 'Invalid or expired QR code'];
            }
            
            // Record the attendance
            $attendanceSql = "INSERT INTO attendance 
                             (activity_id, member_id, qr_code_used, attended_at) 
                             VALUES (?, ?, ?, NOW())";
            // CORRECTED: Use inherited method directly
            $this->executeQuery($attendanceSql, [
                $qrRecord['activity_id'], 
                $userId, 
                $qrData
            ]);
            
            // Increment QR code uses
            $updateSql = "UPDATE activity_qr_codes SET uses = uses + 1 WHERE id = ?";
            // CORRECTED: Use inherited method directly
            $this->executeQuery($updateSql, [$qrRecord['id']]);
            
            return ['valid' => true, 'activity_id' => $qrRecord['activity_id']];
            
        } catch (Exception $e) {
            error_log("QR Validation Error: " . $e->getMessage());
            return ['valid' => false, 'error' => 'Validation failed'];
        }
    }
    
    private function generateUniqueCode($activityId) {
        return 'ACT_' . $activityId . '_' . uniqid() . '_' . bin2hex(random_bytes(4));
    }
    
    private function storeQRCode($activityId, $code, $options) {
        $sql = "INSERT INTO activity_qr_codes (activity_id, qr_code, expires_at, max_uses) 
                VALUES (?, ?, ?, ?)";
        // CORRECTED: Use inherited method directly
        return $this->executeQuery($sql, [
            $activityId, 
            $code,
            $options['expires_at'] ?? date('Y-m-d H:i:s', strtotime('+24 hours')),
            $options['max_uses'] ?? 100
        ]);
    }
}
?>