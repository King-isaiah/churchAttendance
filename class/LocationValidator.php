<?php
require_once 'Database.php';

class LocationValidator extends Database {
    private $allowedRadius = 100; // meters
    
    public function __construct() {
        parent::__construct(); // Call parent constructor
    }
    
    public function validateUserLocation($userId, $activityId, $userLat, $userLng) {
        try {
            // Get activity location
            $activityLocation = $this->getActivityLocation($activityId);
            
            if (!$activityLocation || !$activityLocation['latitude'] || !$activityLocation['longitude']) {
                return ['valid' => false, 'error' => 'Activity location not set'];
            }
            
            // Calculate distance
            $distance = $this->calculateDistance(
                $userLat, 
                $userLng, 
                $activityLocation['latitude'], 
                $activityLocation['longitude']
            );
            
            $isValid = $distance <= $this->allowedRadius;
            
            return [
                'valid' => $isValid,
                'distance' => round($distance, 2),
                'max_allowed' => $this->allowedRadius,
                'activity_location' => $activityLocation
            ];
            
        } catch (Exception $e) {
            error_log("Location Validation Error: " . $e->getMessage());
            return ['valid' => false, 'error' => 'Location validation failed'];
        }
    }
    
    private function getActivityLocation($activityId) {
        $sql = "SELECT l.latitude, l.longitude 
                FROM activities a 
                JOIN locations l ON a.location_id = l.id 
                WHERE a.id = ?";
        // CORRECTED: Use inherited method directly
        return $this->fetchOne($sql, [$activityId]);
    }
    
    private function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371000; // meters
        
        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);
        
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;
        
        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        
        return $angle * $earthRadius;
    }
    
    // Simple method to update activity location coordinates
    public function setActivityLocation($locationId, $lat, $lng) {
        try {
            $sql = "UPDATE locations SET latitude = ?, longitude = ? WHERE id = ?";
            // CORRECTED: Use inherited method directly
            $result = $this->executeQuery($sql, [$lat, $lng, $locationId]);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
?>