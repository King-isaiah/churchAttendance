<?php
// Database configuration - Non-class version

function getDatabaseConnection() {
    // Get database URL from environment variable (set in Render)
    $databaseUrl = getenv('DATABASE_URL');
    
    if ($databaseUrl) {
        // Parse the Render PostgreSQL URL
        $db = parse_url($databaseUrl);
        
        $host = $db['host'];
        $port = $db['port'] ?? '5432';
        $dbname = ltrim($db['path'], '/');
        $user = $db['user'];
        $pass = $db['pass'];
        
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";
    } else {
        // Fallback for local development 
        // Change these to match your local database
        $host = 'localhost';
        $port = '3306';  // MySQL default port
        $dbname = 'church_attendance';
        $user = 'root';
        $pass = '';
        
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    }
    
    try {
        $pdo = new PDO($dsn, $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Only set this for MySQL (it causes issues with PostgreSQL)
        if (!$databaseUrl) {
            $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        }
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        die("Database connection failed. Please check your configuration.");
    }
}

// For backwards compatibility with your existing code
// If your other files use DatabaseConfig::getConnection()
// you can still keep this class that uses the function above
if (!class_exists('DatabaseConfig')) {
    class DatabaseConfig {
        public static function getConnection() {
            return getDatabaseConnection();
        }
    }
}
?>