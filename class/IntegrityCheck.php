<?php
require_once 'Database.php';

class IntegrityCheck extends Database {
    private $log = [];

    private $requiredTables = [
        'activities' => "CREATE TABLE IF NOT EXISTS `activities` (
            `id` int NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `description` text,
            `category_id` int NOT NULL,
            `department_id` varchar(110) NOT NULL,
            `dayofactivity` varchar(50) NOT NULL,
            `time` time NOT NULL,
            `time_exp` time NOT NULL,
            `location_id` int NOT NULL,
            `attendance_method_id` int NOT NULL,
            `status_id` int NOT NULL,
            `expected_count` int DEFAULT '0',
            `deleted` varchar(110) DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `name` (`name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'activity_qr_codes' => "CREATE TABLE IF NOT EXISTS `activity_qr_codes` (
            `id` int NOT NULL AUTO_INCREMENT,
            `activity_id` int NOT NULL,
            `qr_code` varchar(255) NOT NULL,
            `expires_at` datetime NOT NULL,
            `max_uses` int DEFAULT '100',
            `uses` int DEFAULT '0',
            `is_active` tinyint DEFAULT '1',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `qr_code` (`qr_code`),
            KEY `idx_activity_id` (`activity_id`),
            KEY `idx_qr_code` (`qr_code`),
            KEY `idx_expires_at` (`expires_at`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'attendance' => "CREATE TABLE IF NOT EXISTS `attendance` (
            `id` int NOT NULL AUTO_INCREMENT,
            `attendance_category` varchar(110) NOT NULL,
            `attendance_category_id` int NOT NULL,
            `unique_id` int NOT NULL,
            `department_id` int NOT NULL,
            `attendance_method_id` int NOT NULL,
            `location_id` int NOT NULL,
            `dayofactivity` varchar(50) NOT NULL,
            `status` varchar(110) DEFAULT 'present',
            `check_in_time` varchar(110) DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'attendance_methods' => "CREATE TABLE IF NOT EXISTS `attendance_methods` (
            `id` int NOT NULL AUTO_INCREMENT,
            `name` varchar(100) NOT NULL,
            `code` varchar(50) NOT NULL,
            `description` text,
            `is_active` varchar(110) DEFAULT '1',
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `code` (`code`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'categories' => "CREATE TABLE IF NOT EXISTS `categories` (
            `id` int NOT NULL AUTO_INCREMENT,
            `categories` varchar(255) NOT NULL,
            `color` varchar(110) NOT NULL,
            `description` varchar(200) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `categories` (`categories`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'departments' => "CREATE TABLE IF NOT EXISTS `departments` (
            `id` int NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `no_members` int DEFAULT NULL,
            `description` varchar(400) NOT NULL,
            `HOD` varchar(500) DEFAULT NULL,
            `ASS_HOD` varchar(500) DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `name` (`name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'email_logs' => "CREATE TABLE IF NOT EXISTS `email_logs` (
            `id` int NOT NULL AUTO_INCREMENT,
            `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        'events' => "CREATE TABLE IF NOT EXISTS `events` (
            `id` int NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `description` text,
            `event_date` date NOT NULL,
            `event_time` time NOT NULL,
            `location_id` int NOT NULL,
            `department_id` varchar(110) NOT NULL DEFAULT '0',
            `category_id` int DEFAULT NULL,
            `attendance_method_id` int DEFAULT NULL,
            `time_exp` time NOT NULL,
            `expected_attendance` int DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_events_date` (`event_date`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'locations' => "CREATE TABLE IF NOT EXISTS `locations` (
            `id` int NOT NULL AUTO_INCREMENT,
            `name` varchar(255) NOT NULL,
            `capacity` int NOT NULL,
            `address` varchar(400) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `latitude` decimal(10,8) DEFAULT NULL,
            `longitude` decimal(11,8) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `location` (`name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'members' => "CREATE TABLE IF NOT EXISTS `members` (
            `id` int NOT NULL AUTO_INCREMENT,
            `unique_id` int NOT NULL,
            `user_name` varchar(255) NOT NULL,
            `first_name` varchar(100) NOT NULL,
            `last_name` varchar(100) NOT NULL,
            `email` varchar(255) NOT NULL,
            `phone` varchar(20) DEFAULT NULL,
            `department_id` varchar(110) NOT NULL,
            `primary_dept_id` int NOT NULL,
            `password` varchar(250) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
            `join_date` date DEFAULT NULL,
            `status` varchar(110) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'offline',
            `role` enum('admin','worker') DEFAULT 'worker',
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `reset_token` varchar(10) DEFAULT NULL,
            `reset_expires_at` datetime DEFAULT NULL,
            `is_verified` tinyint(1) NOT NULL DEFAULT '0',
            `verification_token` varchar(10) DEFAULT NULL,
            `verification_expires_at` datetime DEFAULT NULL,
            `last_activity` datetime DEFAULT NULL,
            `current_streak` int NOT NULL DEFAULT '0',
            PRIMARY KEY (`id`),
            UNIQUE KEY `email` (`email`),
            UNIQUE KEY `unique_id` (`unique_id`),
            UNIQUE KEY `user_name` (`user_name`),
            KEY `idx_email` (`email`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'notifications' => "CREATE TABLE IF NOT EXISTS `notifications` (
            `id` int NOT NULL AUTO_INCREMENT,
            `title` varchar(255) NOT NULL,
            `message` text NOT NULL,
            `notification_type` enum('member','announcement','event','activity','department','system') CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'announcement',
            `department_id` int DEFAULT '0',
            `is_active` tinyint(1) DEFAULT '1',
            `priority` enum('low','medium','high') DEFAULT 'medium',
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            `expires_at` datetime DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_active_department` (`is_active`,`department_id`),
            KEY `idx_expires` (`expires_at`,`is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1;",

        'rsvp' => "CREATE TABLE IF NOT EXISTS `rsvp` (
            `id` int NOT NULL AUTO_INCREMENT,
            `event_id` int NOT NULL,
            `unique_id` int NOT NULL,
            `attending` int NOT NULL,
            `guest_count` int NOT NULL,
            `notes` varchar(500) NOT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'speakers' => "CREATE TABLE IF NOT EXISTS `speakers` (
            `id` int NOT NULL AUTO_INCREMENT,
            `speakers_name` varchar(255) NOT NULL,
            `email` varchar(255) NOT NULL,
            `phone_number` varchar(11) NOT NULL,
            `speciality` varchar(255) DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `speakers_name` (`speakers_name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'statuses' => "CREATE TABLE IF NOT EXISTS `statuses` (
            `id` int NOT NULL AUTO_INCREMENT,
            `name` varchar(100) NOT NULL,
            `color` varchar(7) NOT NULL,
            `description` text,
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `name` (`name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1;",

        'testimonies' => "CREATE TABLE IF NOT EXISTS `testimonies` (
            `id` int NOT NULL AUTO_INCREMENT,
            `unique_id` varchar(50) NOT NULL,
            `title` varchar(255) NOT NULL,
            `content` text NOT NULL,
            `status` enum('pending','approved','rejected') DEFAULT 'pending',
            `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_unique_id` (`unique_id`),
            KEY `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
    ];

    private $criticalRows = [
        'statuses' => [
            ['column' => 'id', 'value' => 1, 'data' => ['id' => 1, 'name' => 'Active', 'color' => '#29db53', 'description' => 'Currently ongoing activities']],
            ['column' => 'id', 'value' => 2, 'data' => ['id' => 2, 'name' => 'Upcoming', 'color' => '#17a2b8', 'description' => 'Scheduled future activities']],
            ['column' => 'id', 'value' => 3, 'data' => ['id' => 3, 'name' => 'Completed', 'color' => '#6c757d', 'description' => 'Finished activities']],
            ['column' => 'id', 'value' => 4, 'data' => ['id' => 4, 'name' => 'Cancelled', 'color' => '#dc3545', 'description' => 'Cancelled activities']]
        ],
        'attendance_methods' => [
            ['column' => 'id', 'value' => 1, 'data' => ['id' => 1, 'name' => 'QR Code', 'code' => 'qr_code', 'description' => 'Scan QR code to check in', 'is_active' => 'active']],
            ['column' => 'id', 'value' => 2, 'data' => ['id' => 2, 'name' => 'Numeric Code', 'code' => 'numeric_code', 'description' => 'Enter numeric code to check in', 'is_active' => 'active']],
            ['column' => 'id', 'value' => 3, 'data' => ['id' => 3, 'name' => 'Location', 'code' => 'gps', 'description' => 'GPS location-based check ins', 'is_active' => 'active']],
            ['column' => 'id', 'value' => 4, 'data' => ['id' => 4, 'name' => 'NFC/RFID', 'code' => 'nfc', 'description' => 'Tap NFC/RFID card to check in', 'is_active' => 'active']]
        ],
        'members' => [
            [
                'column' => 'role', 
                'value' => 'admin', 
                'data' => [
                    'unique_id' => 999999,
                    'user_name' => 'admin',
                    'first_name' => 'System',
                    'last_name' => 'Administrator',
                    'email' => 'admin@hubchurch.org',
                    'phone' => '0000000000',
                    'department_id' => '0',
                    'primary_dept_id' => 0,
                    'password' => 'admin', 
                    'role' => 'admin',
                    'is_verified' => 1
                ]
            ]
        ]
    ];

    public function __construct() {
        parent::__construct();
    }

    public function run() {
        $this->checkTables();
        $this->checkCriticalRows();
        
        if (!empty($this->log)) {
            $this->writeLog();
        }
        
        return $this->log;
    }

    private function checkTables() {
        foreach ($this->requiredTables as $tableName => $createSql) {
            try {
                // Query information_schema instead of using SHOW TABLES LIKE ?
                $result = $this->fetchOne(
                    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", 
                    [$tableName]
                );
                
                if (!$result) {
                    $this->executeQuery($createSql);
                    $this->log[] = "RESTORED TABLE: `{$tableName}`";
                }
            } catch (Exception $e) {
                $this->log[] = "ERROR checking table `{$tableName}`: " . $e->getMessage();
            }
        }
    }

    private function checkCriticalRows() {
        foreach ($this->criticalRows as $tableName => $rows) {
            foreach ($rows as $row) {
                try {
                    $column = $row['column'];
                    $value = $row['value'];
                    $insertData = $row['data'];

                    $existing = $this->fetchOne(
                        "SELECT `{$column}` FROM `{$tableName}` WHERE `{$column}` = ?", 
                        [$value]
                    );

                    if (!$existing) {
                        $columns = array_keys($insertData);
                        $placeholders = array_fill(0, count($columns), '?');
                        $sql = "INSERT INTO `{$tableName}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
                        
                        $this->executeQuery($sql, array_values($insertData));
                        $this->log[] = "RESTORED ROW in `{$tableName}`: " . json_encode($insertData);
                    }
                } catch (Exception $e) {
                    $this->log[] = "ERROR checking row in `{$tableName}`: " . $e->getMessage();
                }
            }
        }
    }

    private function writeLog() {
        // Save log in the same folder as this file (class/)
        $logFile = __DIR__ . '/integrity_log.txt'; 
        $timestamp = date('Y-m-d H:i:s');
        $message = "[{$timestamp}] " . implode(" | ", $this->log) . PHP_EOL;
        file_put_contents($logFile, $message, FILE_APPEND);
    }
}
?>