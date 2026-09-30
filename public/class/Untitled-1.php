    // protected function getConnection() {
        //     $host = 'localhost';
        //     $dbname = 'church_attendance';
        //     $user = 'root';
        //     $pass = '';
        //     $charset = 'utf8mb4';
            
        //     $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            
        //     try {
        //         $pdo = new PDO($dsn, $user, $pass);
        //         $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        //         $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        //         $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        //         return $pdo;
        //     } catch (PDOException $e) {
        //         error_log("Database connection failed: " . $e->getMessage());
        //         throw new Exception("Database connection failed: " . $e->getMessage());
        //     }
        // }
        /**
         * Extract meaningful information from duplicate entry errors
         */