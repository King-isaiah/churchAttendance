<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once 'Database.php';
    require_once 'Location.php';
    require_once 'Department.php';
    require_once 'Category.php';
    require_once 'Speaker.php';
    require_once 'Event.php';
    require_once 'Member.php';
    require_once 'Attendance.php';
    require_once 'Activity.php';
    require_once 'AttendanceMethod.php';
    require_once 'Status.php';
    require_once 'LocationValidator.php';
    require_once 'QRGenerator.php';

    class ApiHandler {
        private $entity;
        private $action;
        private $id;
        private $input;
        
        public function __construct() {
            // Get request parameters
            $this->action = $_GET['action'] ?? '';
            $this->id = $_GET['id'] ?? 0;
            $this->entity = $_GET['entity'] ?? '';
            
            // Get input data
            $input = file_get_contents('php://input');
            $this->input = $input ? json_decode($input, true) : [];
            
            // Set headers
            header('Content-Type: application/json');
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
        }
        
        public function handleRequest() {
            // Handle preflight requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }
            
            try {
                switch ($_SERVER['REQUEST_METHOD']) {
                    case 'GET':
                        $this->handleGet();
                        break;
                    case 'POST':
                        $this->handlePost();
                        break;
                    case 'PUT':
                        $this->handlePut();
                        break;
                    case 'DELETE':
                        $this->handleDelete();
                        break;
                    default:
                        $this->sendResponse([
                            'success' => false, 
                            'message' => 'Method not allowed',
                            'errorType' => 'client'
                        ], 405);
                }
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }
        
        private function handleGet() {
            switch ($this->action) {
                case 'getAll':
                    $this->getAll();
                    break;
                case 'get':
                    $this->get();
                    break;
                case 'getQR': // Add this case
                    $this->getQR();
                    break;
                default:
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Invalid action get request',
                        'errorType' => 'client'
                    ], 400);
            }
        }
        
        private function handlePost() {
            switch ($this->action) {
                case 'create':
                    $this->create();
                    break;
                case 'generateQR': // Add this case
                    $this->generateQR();
                    break;
                default:
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Invalid action post request',
                        'errorType' => 'client'
                    ], 400);
            }
        }
        
        private function handlePut() {
            switch ($this->action) {
                case 'update':
                    $this->update();
                    break;
                default:
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Invalid action put request',
                        'errorType' => 'client'
                    ], 400);
            }
        }
        
        private function handleDelete() {
            switch ($this->action) {
                case 'delete':
                    $this->delete();
                    break;
                default:
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Invalid action',
                        'errorType' => 'client'
                    ], 400);
            }
        }
        
        private function getAll() {
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid entity',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entity = new $entityClass();
            
            // Map entity to method name
            $methodMap = [
                'locations' => 'getAllLocations',
                'departments' => 'getAllDepartments',
                'categories' => 'getAllCategory',
                'speakers' => 'getAllSpeakers',
                'events' => 'getAllEvents',
                'members' => 'getAllMembers',
                'attendance' => 'getAllAttendance',
                'activities' => 'getAllActivities',
                'attendance_methods' => 'getAllAttendanceMethods',
                'statuses' => 'getAllStatuses',
                'attendance' => 'getAllAttendanceReports',

            ];
            
            $method = $methodMap[$this->entity] ?? 'getAll';
            
            if (method_exists($entity, $method)) {
                $data = $entity->$method();
                $this->sendResponse([
                    'success' => true, 
                    'data' => $data
                ]);
            } else {
                $this->sendResponse([
                    'success' => false, 
                    'message' => "Method $method not found for {$this->entity}",
                    'errorType' => 'server'
                ], 500);
            }
        }
        
        private function get() {
            if (!$this->id) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'ID required',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid entity',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entity = new $entityClass();
            
            // Map entity to method name
            $methodMap = [
                'locations' => 'getLocation',
                'departments' => 'getDepartment',
                'categories' => 'getCategory',
                'speakers' => 'getSpeaker',
                'events' => 'getEvent',
                'members' => 'getMember',
                'attendance' => 'getAttendance',
                'activities' => 'getActivity',
                'attendance_methods'=>'getAttendanceMethod',
                'statuses'=>'getStatus',
                'attendance'=>'getAttendanceReports',
                'attendance'=>'getWeeklyAttendanceTrend',
                // 'attendance'=>'getStatus',
                // 'attendance'=>'getStatus',
                // 'attendance'=>'getStatus',
                // 'attendance'=>'getStatus'
            ];
            
            $method = $methodMap[$this->entity] ?? 'get';
            
            if (method_exists($entity, $method)) {
                $data = $entity->$method($this->id);
                
                if ($data) {
                    $this->sendResponse([
                        'success' => true, 
                        'data' => $data
                    ]);
                } else {
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Not found',
                        'errorType' => 'client'
                    ], 404);
                }
            } else {
                $this->sendResponse([
                    'success' => false, 
                    'message' => "Method $method not found",
                    'errorType' => 'server'
                ], 500);
            }
        }
        private function generateQR() {
            if (empty($this->input)) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid data',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            try {
                $activityId = $this->input['activity_id'] ?? null;
                $expiryHours = $this->input['expiry_hours'] ?? 3;
                $maxUses = $this->input['max_uses'] ?? 100;
                
                if (!$activityId) {
                    throw new Exception('Activity ID is required', 400);
                }
                
                $qrGenerator = new QRGenerator();
                
                // Generate QR code data
                $qrData = [
                    'expiry_hours' => $expiryHours,
                    'max_uses' => $maxUses
                ];
                
                $result = $qrGenerator->generateQRCode($activityId, $qrData);
                
                $this->sendResponse([
                    'success' => true,
                    'qr_data' => $result['qr_data'],
                    'expires_at' => $result['expires_at']
                ]);
                
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }
        private function create() {
            if (empty($this->input)) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid data',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid entity',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entity = new $entityClass();
            
            // Map entity to method name
            $methodMap = [
                'locations' => 'createLocation',
                'departments' => 'createDepartment',
                'categories' => 'createCategory',
                'speakers' => 'createSpeaker',
                'events' => 'createEvent',
                'members' => 'createMember',
                'attendance' => 'createAttendance',
                'activities' => 'createActivity',
                'attendance_methods'=>'createAttendanceMethod',
                'statuses'=>'createStatus',
                'activity_qr_codes'=>'generateQRCode',
            ];
            
            $method = $methodMap[$this->entity] ?? 'create';
            
            if (method_exists($entity, $method)) {
                $id = $entity->$method($this->input);
                
                if ($id) {
                    $this->sendResponse([
                        'success' => true, 
                        'id' => $id
                    ], 201);
                } else {
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Create failed',
                        'errorType' => 'server'
                    ], 500);
                }
            } else {
                $this->sendResponse([
                    'success' => false, 
                    'message' => "Method $method not found",
                    'errorType' => 'server'
                ], 500);
            }
        }
        
        private function update() {
            if (!$this->id || empty($this->input)) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'ID and data required',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid entity',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entity = new $entityClass();
            
            // Map entity to method name
            $methodMap = [
                'locations' => 'updateLocation',
                'departments' => 'updateDepartment',
                'categories' => 'updateCategory',
                'speakers' => 'updateSpeaker',
                'events' => 'updateEvent',
                'members' => 'updateMember',
                'attendance' => 'updateAttendance',
                'activities' => 'updateActivity',
                'attendance_methods' => 'updateAttendanceMethod',
                'statuses' => 'updateStatus',
                'activity_qr_codes' => 'updateStatus'
            ];
            
            $method = $methodMap[$this->entity] ?? 'update';
            
            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->id, $this->input);
                
                if ($result) {
                    $this->sendResponse([
                        'success' => true, 
                        'affected' => $result
                    ]);
                } else {
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Update failed',
                        'errorType' => 'server'
                    ], 500);
                }
            } else {
                $this->sendResponse([
                    'success' => false, 
                    'message' => "Method $method not found",
                    'errorType' => 'server'
                ], 500);
            }
        }
        
        private function delete() {
            if (!$this->id) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'ID required',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Invalid entity',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            $entity = new $entityClass();
            
            // Map entity to method name
            $methodMap = [
                'locations' => 'deleteLocation',
                'departments' => 'deleteDepartment',
                'categories' => 'deleteCategory',
                'speakers' => 'deleteSpeaker',
                'events' => 'deleteEvent',
                'members' => 'deleteMember',
                'attendance' => 'deleteAttendance',
                'activities' => 'deleteActivity',
                'statuses' => 'deleteStatus',
                'attendance_methods' => 'deleteAttendanceMethod',
                'activity_qr_codes' => 'deleteAttendanceMethod',
            ];
            
            $method = $methodMap[$this->entity] ?? 'delete';
            
            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->id);
                
                if ($result) {
                    $this->sendResponse([
                        'success' => true, 
                        'affected' => $result
                    ]);
                } else {
                    $this->sendResponse([
                        'success' => false, 
                        'message' => 'Delete failed',
                        'errorType' => 'server'
                    ], 500);
                }
            } else {
                $this->sendResponse([
                    'success' => false, 
                    'message' => "Method $method not found",
                    'errorType' => 'server'
                ], 500);
            }
        }
        
        /**
         * Enhanced exception handler
         */
        private function handleException(Exception $e) {
            $errorCode = $e->getCode();
            $errorMessage = $e->getMessage();
            
            // Log all errors for developers
            error_log("API Error: " . $errorMessage . " | Code: " . $errorCode . " | Entity: " . $this->entity . " | Action: " . $this->action);
            
            // Determine HTTP status code
            $httpCode = $this->getHttpStatusCode($errorCode);
            
            // Determine error type for frontend
            $errorType = $this->getErrorType($errorCode);
            
            // Prepare response
            $response = [
                'success' => false,
                'message' => $errorMessage,
                'errorType' => $errorType,
                'debug' => $this->shouldIncludeDebugInfo()
            ];
            
            // Add debug info in development
            if ($response['debug']) {
                $response['debugInfo'] = [
                    'code' => $errorCode,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $this->getSafeTrace($e)
                ];
            }
            
            $this->sendResponse($response, $httpCode);
        }
        
        /**
         * Map error codes to HTTP status codes
         */
        private function getHttpStatusCode($errorCode) {
            $codeMap = [
                400 => 400, // Bad Request
                404 => 404, // Not Found
                409 => 409, // Conflict (for duplicate entries)
            ];
            
            return $codeMap[$errorCode] ?? 500;
        }
        
        /**
         * Categorize errors for frontend handling
         */
        private function getErrorType($errorCode) {
            // User input errors
            if (in_array($errorCode, [400, 409])) {
                return 'validation';
            }
            
            // Not found errors
            if ($errorCode === 404) {
                return 'not_found';
            }
            
            // Server errors
            return 'server';
        }
        
        /**
         * Check if we should include debug information
         */
        private function shouldIncludeDebugInfo() {
            return ($_SERVER['HTTP_HOST'] ?? '') === 'localhost' || 
                ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' ||
                (isset($_GET['debug']) && $_GET['debug'] === 'true');
        }
        
        /**
         * Get safe stack trace without sensitive information
         */
        private function getSafeTrace(Exception $e) {
            if (!$this->shouldIncludeDebugInfo()) {
                return null;
            }
            
            $trace = $e->getTrace();
            $safeTrace = [];
            
            foreach ($trace as $item) {
                $safeTrace[] = [
                    'file' => $item['file'] ?? '',
                    'line' => $item['line'] ?? '',
                    'function' => $item['function'] ?? ''
                ];
            }
            
            return $safeTrace;
        }
        
        private function getEntityClass() {
            $entityMap = [
                'locations' => 'Location',
                'departments' => 'Department',
                'categories' => 'Category',
                'speakers' => 'Speaker',
                'events' => 'Event',
                'members' => 'Member',
                'attendance' => 'Attendance',
                'activities' => 'Activity',
                'attendance_methods'=>'AttendanceMethod',
                'statuses'=>'Status',
                'reports' => 'Report',
                'activity_qr_codes' => 'QRGenerator',
            ];
            
            return $entityMap[$this->entity] ?? null;
        }
        
        private function sendResponse($data, $statusCode = 200) {
            http_response_code($statusCode);
            
            // Add request ID for tracking
            $data['requestId'] = uniqid();
            
            echo json_encode($data);
            exit();
        }
        

        private function getQR() {
            $activityId = $_GET['id'] ?? null;
            
            if (!$activityId) {
                $this->sendResponse([
                    'success' => false, 
                    'message' => 'Activity ID required',
                    'errorType' => 'client'
                ], 400);
                return;
            }
            
            try {
                $qrGenerator = new QRGenerator();
                $qrCode = $qrGenerator->getQRCode($activityId);
                
                $this->sendResponse([
                    'success' => !empty($qrCode),
                    'qr_data' => $qrCode ? $qrCode['qr_code'] : null,
                    'expires_at' => $qrCode ? $qrCode['expires_at'] : null,
                    'uses' => $qrCode ? $qrCode['uses'] : 0,
                    'max_uses' => $qrCode ? $qrCode['max_uses'] : 0
                ]);
                
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }
    }



    // Handle the request
    $apiHandler = new ApiHandler();
    $apiHandler->handleRequest();
?>