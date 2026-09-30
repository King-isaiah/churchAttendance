
<?php
require_once '../class/Database.php';

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
    

    

    private function geocodeAddress($address) {
        if (empty($address)) {
            error_log("🚨 Geocoding: Empty address received");
            // return null;
        }
        
        try {
            // REPLACE THIS WITH YOUR ACTUAL LOCATIONIQ TOKEN
            $apiKey = 'pk.6f5cef3bfb39d96452613eccf69240d5';
            
            // LocationIQ API endpoint
            $url = "https://us1.locationiq.com/v1/search?" . 
                http_build_query([
                    'key' => $apiKey,
                    'q' => $address,
                    'format' => 'json',
                    'limit' => 1
                ]);
            
            // 🔍 DEBUG: Log the URL (masking API key)
            error_log("📍 Geocoding URL: " . str_replace($apiKey, 'REDACTED', $url));
            
            // Context with timeout
            $context = stream_context_create([
                'http' => [
                    'timeout' => 40
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            
            // 🔍 DEBUG: Log raw response
            error_log("📡 Raw API Response: " . substr($response, 0, 200) . "...");
            
            // Check if response is HTML/error
            if (strpos($response, '<html') !== false || strpos($response, '<!DOCTYPE') !== false) {
                error_log("❌ API returned HTML instead of JSON. Full response: " . $response);
                throw new Exception("❌ API returned HTML instead of JSON. Full response: " . $response);
                // return null;
            }
            
            $data = json_decode($response, true);
            
            // 🔍 DEBUG: Log parsed data
            error_log("📊 Parsed Data: " . print_r($data, true));
            
            // LocationIQ returns data in a different structure
            if (!empty($data) && isset($data[0]['lat'])) {
                error_log("✅ Geocoding SUCCESS for: '$address' -> Lat: {$data[0]['lat']}, Lon: {$data[0]['lon']}");
                return [
                    'latitude' => $data[0]['lat'],
                    'longitude' => $data[0]['lon']
                ];
            } else {
                error_log("❌ Geocoding FAILED for: '$address'. No coordinates found.");
                error_log("   Data structure: " . print_r($data, true));
                // throw new Exception("❌ Geocoding FAILED for: '$address'. No coordinates found.");
                // error_log("   Data structure: " . print_r($data, true));
            }
            
            return null;
        } catch (Exception $e) {
            error_log("🚨 Geocoding ERROR for address: $address - " . $e->getMessage());
            throw new Exception("🚨 Geocoding ERROR for address: $address - " . $e->getMessage());
            // return null;
        }
    }
    
        
    public function createLocation($data) {
        try {
            $this->validateLocationData($data);
            
            // Auto-geocode if address is provided
            if (!empty($data['address'])) {
                $coordinates = $this->geocodeAddress($data['address']);
                if ($coordinates) {
                    $data['latitude'] = $coordinates['latitude'];
                    $data['longitude'] = $coordinates['longitude'];
                }else{
                    return [
                        'success' => false,
                        'message' => 'Address not found. Please enter a valid address.',
                        'status' => 400 // optional, will be used as HTTP status
                    ];
                    // throw new Exception("Address not found. Please enter a valid address.", 400);
                }
                // If geocoding fails, we still proceed (location created without coordinates)
            }
            
            $id = $this->insert('locations', $data);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Create Location.Please try again or call dev.',
                    'status' => 400 // optional, will be used as HTTP status
                ];
                // throw new Exception("Failed to insert location", 500);
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Location '{$data['name']}' created with capacity {$data['capacity']}."
            ];
        } catch (Exception $e) {
            error_log("Location create error: " . $e->getMessage() . " | Data: " . json_encode($data));
            throw $e; // ApiHandler catches and sends error response
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
            
            // Auto-geocode if address is provided and changed
            // if (!empty($data['address']) && $data['address'] !== $existing['address']) {
            if (!empty($data['address'])) {
                $coordinates = $this->geocodeAddress($data['address']);
                if ($coordinates) {
                    $data['latitude'] = $coordinates['latitude'];
                    $data['longitude'] = $coordinates['longitude'];
                    //  throw new Exception("Location was found", 200);
                }
               else{
                    return [
                        'success' => false,
                        'message' => 'Address not found. Please enter a valid address.',
                        'status' => 400 // optional, will be used as HTTP status
                    ];
                    // throw new Exception("Address not found. Please enter a valid address.", 400);
                }
            }
            
            
            // Let the database handle duplicates
            $id = $this->update('locations', $data, 'id = ?', [$id]);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Update Location.Please try again or call dev.',
                    'status' => 400 // optional, will be used as HTTP status
                ];                
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Location '{$data['name']}' updated with capacity {$data['capacity']}."
            ];
            
        } catch (Exception $e) {
            error_log("Location update error [ID: $id]: " . $e->getMessage());
            throw $e;
        }
    }
    
    
    public function deleteLocation($id) {
        try {
            $activities = "SELECT * FROM activities WHERE location_id = ?";
            $resultActivity = $this->fetchOne($activities, [$id]);
            $event = "SELECT * FROM `events` WHERE location_id = ?";
            $resultEvent = $this->fetchOne($event, [$id]);
            // Check if location exists first
            $existing = $this->getLocation($id);            
            if (!$existing) {
                return [
                    'success' => false,
                    'message' => 'Location not found.',
                    'status' => 404
                ];                 
            }
            if ($resultActivity) {
                return [
                    'success' => false,
                    'message' => 'Location already used in activity module.',
                    'status' => 404
                ];                
            }
            if ($resultEvent) {
                return [
                    'success' => false,
                    'message' => 'Location already used in events module.',
                    'status' => 404
                ];
            }
            
            $id = $this->delete('locations', 'id = ?', [$id]);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Delete Location.Please try again or call dev.',
                    'status' => 500 
                ];
                // throw new Exception("Failed to insert location", 500);
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Location deleted succesfully."
            ];
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