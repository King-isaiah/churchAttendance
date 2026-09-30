<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once 'Database.php';

    require_once '../admin/class/Activity.php';
    require_once '../admin/class/Location.php';
    require_once '../admin/class/Department.php';
    require_once '../admin/class/Dashboard.php';
    require_once '../admin/class/Category.php';
    require_once '../admin/class/Speaker.php';
    require_once '../admin/class/Event.php';
    require_once 'Member.php';
    require_once '../admin/class/Attendance.php';
    require_once '../admin/class/Activity.php';
    require_once '../admin/class/AttendanceMethod.php';
    require_once '../admin/class/Status.php';
    require_once '../admin/class/LocationValidator.php';
    require_once '../admin/class/QRGenerator.php';
    require_once '../admin/class/RSVP.php';
    require_once '../admin/class/Report.php';
    require_once '../admin/class/Notification.php';
    require_once 'Auth.php';

    class ApiHandler {
        private $entity;
        private $action;
        private $id;
        private $input;
        private $requestMethod;

        public function __construct() {
            $this->action = $_GET['action'] ?? '';
            $this->id = $_GET['id'] ?? 0;
            $this->entity = $_GET['entity'] ?? '';
            $this->requestMethod = $_SERVER['REQUEST_METHOD'];

            $input = file_get_contents('php://input');
            $this->input = $input ? json_decode($input, true) : [];

            header('Content-Type: application/json');
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
        }

        public function handleRequest() {
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }

            try {
                switch ($_SERVER['REQUEST_METHOD']) {
                    case 'GET':  $this->handleGet();  break;
                    case 'POST': $this->handlePost(); break;
                    case 'PUT':  $this->handlePut();  break;
                    case 'DELETE': $this->handleDelete(); break;
                    default:
                        $this->sendResponse([
                            'success' => false,
                            'message' => 'Method not allowed',
                            'errorType' => 'client'], 405);
                }
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }

        // -------------------- Handlers --------------------

        private function handleGet() {
            switch ($this->action) {
                case 'getAll': $this->getAll(); break;
                case 'get':    $this->get();    break;
                case 'getQR':  $this->getQR();  break;
                default:
                    $this->sendResponse(['success' => false, 'message' => 'Invalid action get request', 'errorType' => 'client'], 400);
            }
        }

        private function handlePost() {
            switch ($this->action) {
                case 'create':     $this->create();     break;
                case 'generateQR': $this->generateQR(); break;
                case 'special':    $this->special();    break;
                default:
                    $this->sendResponse(['success' => false, 'message' => 'Invalid action post request', 'errorType' => 'client'], 400);
            }
        }

        private function handlePut() {
            switch ($this->action) {
                case 'update': $this->update(); break;
                default:
                    $this->sendResponse(['success' => false, 'message' => 'Invalid action put request', 'errorType' => 'client'], 400);
            }
        }

        private function handleDelete() {
            switch ($this->action) {
                case 'delete': $this->delete(); break;
                default:
                    $this->sendResponse(['success' => false, 'message' => 'Invalid action delete request', 'errorType' => 'client'], 400);
            }
        }

        // -------------------- Core Actions --------------------

        private function getAll() {
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
            $methodMap = [
                'department_counts' => 'getDepartmentMemberCounts',
                'dashboard' => 'getDashboardStats',
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
                'reports' => 'getAttendanceReports',
                'notifications' => 'getAllNotifications',
                // 'auth' => 'Auth'
            ];
            $method = $methodMap[$this->entity] ?? 'getAll';

            if (method_exists($entity, $method)) {
                $data = $entity->$method();
                $this->sendSuccessResponse(['data' => $data], 200);
            } else {
                $this->sendResponse(['success' => false, 'message' => "Method $method not found for {$this->entity}", 'errorType' => 'server'], 500);
            }
        }

        private function get() {
            if (!$this->id) {
                $this->sendResponse(['success' => false, 'message' => 'ID required', 'errorType' => 'client'], 400);
                return;
            }

            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
            $methodMap = [
                'locations' => 'getLocation',
                'departments' => 'getDepartment',
                'categories' => 'getCategory',
                'speakers' => 'getSpeaker',
                'events' => 'getEvent',
                'members' => 'getMember',
                'attendance' => 'getAttendance',
                'activities' => 'getActivity',
                'attendance_methods' => 'getAttendanceMethod',
                'statuses' => 'getStatus',
                'notifications' => 'getNotificationsForUser',
                'rsvp' => 'getRSVPDetails',
                'reports' => 'getWeeklyAttendanceTrend',
                'auth' => 'getSessionUser',
            ];
            $method = $methodMap[$this->entity] ?? 'get';

            if (method_exists($entity, $method)) {
                $data = $entity->$method($this->id);
                if ($data) {
                    $this->sendSuccessResponse(['data' => $data], 200);
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Item not found', 'errorType' => 'client'], 404);
                }
            } else {
                $this->sendResponse(['success' => false, 'message' => "Method $method not found", 'errorType' => 'server'], 500);
            }
        }
       
        private function create() {
            if (empty($this->input)) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid data', 'errorType' => 'client'], 400);
                return;
            }
            
           
            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
            $methodMap = [
                'locations' => 'createLocation',
                'departments' => 'createDepartment',
                'categories' => 'createCategory',
                'speakers' => 'createSpeaker',
                'events' => 'createEvent',
                'members' => 'createMember',
                'attendance' => 'createAttendance',
                'activities' => 'createActivity',
                'attendance_methods' => 'createAttendanceMethod',
                'statuses' => 'createStatus',
                'activity_qr_codes' => 'generateQRCode',
                'reports' => 'exportToCSV',
                'notifications' => 'createNotification',
            ];
            $method = $methodMap[$this->entity] ?? 'create';
            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->input);

                // If result is an array, check for 'success' key
                if (is_array($result)) {
                    // If success is explicitly false, treat as error
                    if (isset($result['success']) && $result['success'] === false) {
                        $statusCode = $result['status'] ?? 400; // allow custom status
                        $this->sendResponse($result, $statusCode);
                        return;
                    }
                    // Otherwise, treat as success
                    $this->sendSuccessResponse($result, 201);
                    return;
                }   

                // Scalar result (ID) – treat as success
                if ($result !== false) {
                    $this->sendSuccessResponse(['id' => $result], 201);
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Create failed', 'errorType' => 'server'], 500);
                }
            } 
            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->input);

                // If result is an array, we can pass it directly.
                // If it's scalar (ID), wrap it.
                   if (is_array($result)) {
                    // If success is explicitly false, treat as error
                    if (isset($result['success']) && $result['success'] === false) {
                        $statusCode = $result['status'] ?? 400; // allow custom status
                        $this->sendResponse($result, $statusCode);
                        return;
                    }
                    // Otherwise, treat as success
                    $this->sendSuccessResponse($result, 201);
                    return;
                }
                if ($result !== false) {
                    $this->sendSuccessResponse(['id' => $result], 201);
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Create failed', 'errorType' => 'server'], 500);
                }
            } else {
                $this->sendResponse(['success' => false, 'message' => "Method $method not found", 'errorType' => 'server'], 500);
            }
        }



        private function update() {
            if (!$this->id || empty($this->input)) {
                $this->sendResponse(['success' => false, 'message' => 'ID and data required', 'errorType' => 'client'], 400);
                return;
            }

            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
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
                if ($result !== false) {
                    if (is_array($result)) {
                        if (isset($result['success']) && $result['success'] === false) {
                            $statusCode = $result['status'] ?? 400;
                            $this->sendResponse($result, $statusCode);
                            return;
                        }
                        $this->sendSuccessResponse($result, 200);
                        return;
                    }
                    
                    else {
                        $this->sendSuccessResponse(['affected' => $result], 200);
                    }
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Update failed', 'errorType' => 'server'], 500);
                }
            } else {
                $this->sendResponse(['success' => false, 'message' => "Method $method not found", 'errorType' => 'server'], 500);
            }
        }

        private function delete() {
            if (!$this->id) {
                $this->sendResponse(['success' => false, 'message' => 'ID required', 'errorType' => 'client'], 400);
                return;
            }

            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
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
                'notifications' => 'deleteNotification',
            ];
            $method = $methodMap[$this->entity] ?? 'delete';

            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->id);
                if ($result !== false) {
                    if (is_array($result)) {
                        if (isset($result['success']) && $result['success'] === false) {
                            $statusCode = $result['status'] ?? 400;
                            $this->sendResponse($result, $statusCode);
                            return;
                        }
                        $this->sendSuccessResponse($result, 200);
                        return;
                    }
                     else {
                        $this->sendSuccessResponse(['affected' => $result], 200);
                    }
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Delete failed', 'errorType' => 'server'], 500);
                }
            }else {
                $this->sendResponse(['success' => false, 'message' => "Method $method not found", 'errorType' => 'server'], 500);
            }
        }

        // -------------------- Special Actions --------------------

        private function special() {
            if (empty($this->input)) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid data', 'errorType' => 'client'], 400);
                return;
            }

            $entityClass = $this->getEntityClass();
            if (!$entityClass) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid entity', 'errorType' => 'client'], 400);
                return;
            }

            $entity = new $entityClass();
            $methodMap = [
                'locations' => 'createLocation',
                'departments' => 'createDepartment',
                'categories' => 'createCategory',
                'speakers' => 'createSpeaker',
                'events' => 'createEvent',
                'members' => 'createMember',
                'attendance' => 'createAttendance',
                'activities' => 'createActivity',
                'attendance_methods' => 'createAttendanceMethod',
                'statuses' => 'createStatus',
                'activity_qr_codes' => 'generateQRCode',
                'reports' => 'creatAReport',
                'auth' => 'login',
            ];
            $method = $methodMap[$this->entity] ?? 'special';

            if (method_exists($entity, $method)) {
                $result = $entity->$method($this->input);
                if ($result !== false) {
                    $this->sendSuccessResponse($result, 200);
                } else {
                    $this->sendResponse(['success' => false, 'message' => 'Operation failed', 'errorType' => 'server'], 500);
                }
            } else {
                $this->sendResponse(['success' => false, 'message' => 'Method not found', 'errorType' => 'server'], 500);
            }
        }

        private function generateQR() {
            if (empty($this->input)) {
                $this->sendResponse(['success' => false, 'message' => 'Invalid data', 'errorType' => 'client'], 400);
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
                $qrData = ['expiry_hours' => $expiryHours, 'max_uses' => $maxUses];
                $result = $qrGenerator->generateQRCode($activityId, $qrData);

                $this->sendSuccessResponse([
                    'qr_data' => $result['qr_data'],
                    'expires_at' => $result['expires_at']
                ], 200);
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }

        private function getQR() {
            $activityId = $_GET['id'] ?? null;
            if (!$activityId) {
                $this->sendResponse(['success' => false, 'message' => 'Activity ID required', 'errorType' => 'client'], 400);
                return;
            }

            try {
                $qrGenerator = new QRGenerator();
                $qrCode = $qrGenerator->getQRCode($activityId);
                $this->sendSuccessResponse([
                    'qr_data' => $qrCode ? $qrCode['qr_code'] : null,
                    'expires_at' => $qrCode ? $qrCode['expires_at'] : null,
                    'uses' => $qrCode ? $qrCode['uses'] : 0,
                    'max_uses' => $qrCode ? $qrCode['max_uses'] : 0
                ], 200);
            } catch (Exception $e) {
                $this->handleException($e);
            }
        }

        // -------------------- Response Helpers --------------------

        /**
         * Send a success response with an optional custom message.
         * The $data array is merged into the response root (except 'success' and 'message' keys).
         * If $data is scalar, it is placed under 'data'.
         */
        private function sendSuccessResponse($data, $statusCode = 200, $message = null) {
            $success = true;
            $response = ['success' => $success];

            if (is_array($data)) {
                if (isset($data['success'])) {
                    $success = (bool)$data['success'];
                    $response['success'] = $success;
                }
                // Extract message if present in data
                if ($message === null && isset($data['message'])) {
                    $message = $data['message'];
                }

                // ---- NEW: Detect if this is a plain list (sequential numeric keys) ----
                $isSequentialList = array_keys($data) === range(0, count($data) - 1);

                if ($isSequentialList) {
                    // It's a list → put it under 'data' to keep response structure consistent
                    $response['data'] = $data;
                } else {
                    // It's an associative array → merge all key-value pairs (except success/message)
                    foreach ($data as $key => $value) {
                        if ($key !== 'success' && $key !== 'message') {
                            $response[$key] = $value;
                        }
                    }
                }
                // ----------------------------------------------------------------

            } else {
                // Scalar value – put under 'data'
                $response['data'] = $data;
            }

            // Set the message
            $response['message'] = $message ?: $this->getDefaultSuccessMessage();

            // Add request ID
            $response['requestId'] = uniqid();

            http_response_code($statusCode);
            echo json_encode($response);
            exit();
        }

        /**
         * Generate a default success message based on action and entity.
         */
        private function getDefaultSuccessMessage() {
            $actionMap = [
                'create' => 'created',
                'update' => 'updated',
                'delete' => 'deleted',
            ];
            $actionWord = $actionMap[$this->action] ?? 'processed';
            $entityName = ucwords(str_replace('_', ' ', $this->entity));
            return "$entityName $actionWord successfully.";
        }

        /**
         * Send a generic response (used for errors and other non‑success cases).
         */
        private function sendResponse($data, $statusCode = 200) {
            http_response_code($statusCode);
            if (!isset($data['requestId'])) {
                $data['requestId'] = uniqid();
            }
            echo json_encode($data);
            exit();
        }

        // -------------------- Exception Handling --------------------

        private function handleException(Exception $e) {
            $errorCode = $e->getCode() ?: 500;
            $errorMessage = $e->getMessage();

            error_log("API Error: $errorMessage | Code: $errorCode | Entity: {$this->entity} | Action: {$this->action}");

            $httpCode = $this->getHttpStatusCode($errorCode);
            $errorType = $this->getErrorType($errorCode);

            $response = [
                'success' => false,
                'message' => $errorMessage,
                'errorType' => $errorType,
                'debug' => $this->shouldIncludeDebugInfo()
            ];

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

        // private function getHttpStatusCode($errorCode) {
        //     $codeMap = [400 => 400, 404 => 404, 409 => 409];
        //     return $codeMap[$errorCode] ?? 500;
        // }

        // private function getErrorType($errorCode) {
        //     if (in_array($errorCode, [400, 409])) return 'validation';
        //     if ($errorCode === 404) return 'not_found';
        //     return 'server';
        // }

        private function getHttpStatusCode($errorCode) {
            $codeMap = [400 => 400, 401 => 401, 403 => 403, 404 => 404, 409 => 409];
            return $codeMap[$errorCode] ?? 500;
        }

        private function getErrorType($errorCode) {
            if (in_array($errorCode, [400, 409])) return 'validation';
            if (in_array($errorCode, [401, 403])) return 'auth'; // <--- ADD THIS
            if ($errorCode === 404) return 'not_found';
            return 'server';
        }

        private function shouldIncludeDebugInfo() {
            return ($_SERVER['HTTP_HOST'] ?? '') === 'localhost' ||
                ($_SERVER['SERVER_NAME'] ?? '') === 'localhost' ||
                (isset($_GET['debug']) && $_GET['debug'] === 'true');
        }

        private function getSafeTrace(Exception $e) {
            if (!$this->shouldIncludeDebugInfo()) return null;
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

        // -------------------- Entity Mapping --------------------

        private function getEntityClass() {
            $entityMap = [
                'dashboard' => 'Dashboard',
                'locations' => 'Location',
                'departments' => 'Department',
                'categories' => 'Category',
                'speakers' => 'Speaker',
                'events' => 'Event',
                'members' => 'Member',
                'attendance' => 'Attendance',
                'activities' => 'Activity',
                'attendance_methods' => 'AttendanceMethod',
                'statuses' => 'Status',
                'reports' => 'Report',
                'activity_qr_codes' => 'QRGenerator',
                'rsvp' => 'RSVP',
                'notifications' => 'Notification',
                'auth' => 'Auth' 
            ];
            return $entityMap[$this->entity] ?? null;
        }
    }

// Handle the request
$apiHandler = new ApiHandler();
$apiHandler->handleRequest();