<?php
   



    class Database {
        protected $db;
        
        // Error type constants
        const ERROR_USER_FACING = 'user_facing';
        const ERROR_DEVELOPER = 'developer';
        
        public function __construct() {
            $this->db = $this->getConnection();
        }
        
        protected function getConnection() {
            $host = 'localhost';
            $dbname = 'church_attendance';
            $user = 'root';
            $pass = '';
            $charset = 'utf8mb4';
            
            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            
            try {
                $pdo = new PDO($dsn, $user, $pass);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
                return $pdo;
            } catch (PDOException $e) {
                error_log("Database connection failed: " . $e->getMessage());
                throw new Exception("Database connection failed: " . $e->getMessage());
            }
        }
        
        /**
         * Enhanced error classification system
         */
        
        
        /**
         * Extract meaningful information from duplicate entry errors
         */
       
private function extractDuplicateFieldMessage($errorMessage) {
    // MySQL pattern: Duplicate entry 'value' for key 'column_name'
    if (preg_match("/Duplicate entry '([^']*)' for key '([^']*)'/", $errorMessage, $matches)) {
        $value = $matches[1];
        $field = $matches[2];
        
        // Convert field name to readable format
        $readableField = $this->getReadableFieldName($field);
        return "The $readableField '$value' already exists. Please choose a different one.";
    }
    
    // Generic unique constraint message
    if (stripos($errorMessage, 'unique') !== false || stripos($errorMessage, 'duplicate') !== false) {
        return "This value already exists. Please choose a different one.";
    }
    
    return null;
}
        
        /**
         * Ultra-simple dynamic field name converter
         */
        private function getReadableFieldName($fieldName) {
            // Remove everything before the last dot (table prefix) and index suffixes
            $cleanField = preg_replace([
                '/^[^\.]*\./',           // Remove table prefix (everything before dot)
                '/_(unique|key|index|uk|idx|pk)$/i', // Remove index suffixes
                '/^[a-z]+_/'             // Remove common table prefixes from field names
            ], '', $fieldName);
            
            // Convert snake_case to readable text
            $readable = str_replace('_', ' ', $cleanField);
            $readable = ucwords($readable);
            
            return strtolower($readable);
        }
        
        // Common database methods that child classes can use
        protected function executeQuery($sql, $params = []) {
            try {
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
                return $stmt;
            } catch (PDOException $e) {
                $errorInfo = $this->classifyError($e);
                
                if ($errorInfo['type'] === self::ERROR_USER_FACING) {
                    throw new Exception($errorInfo['message']);
                } else {
                    // Log developer errors but don't expose them to users
                    error_log("Query execution failed [Developer]: " . $e->getMessage() . " | SQL: " . $sql . " | Params: " . json_encode($params));
                    throw new Exception("A database error occurred. Please try again.");
                }
            }
        }
        
        protected function fetchAll($sql, $params = []) {
            $stmt = $this->executeQuery($sql, $params);
            return $stmt->fetchAll();
        }
        
        protected function fetchOne($sql, $params = []) {
            $stmt = $this->executeQuery($sql, $params);
            return $stmt->fetch();
        }
        
        
        
     

protected function insert($table, $data) {
    try {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $values = array_values($data);
        
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        
        $this->executeQuery($sql, $values);
        return $this->db->lastInsertId();
    } catch (PDOException $e) {
        // This will now throw exceptions with proper HTTP status codes
        $this->classifyError($e);
    }
}

protected function update($table, $data, $where, $whereParams) {
    try {
        $setClause = implode(' = ?, ', array_keys($data)) . ' = ?';
        $values = array_merge(array_values($data), $whereParams);
        
        $sql = "UPDATE $table SET $setClause WHERE $where";
        
        $stmt = $this->executeQuery($sql, $values);
        return $stmt->rowCount();
        
    } catch (PDOException $e) {
        // Let classifyError handle ALL errors - it will throw the appropriate exception
        $this->classifyError($e);
    }
}
        protected function delete($table, $where, $params) {
            $sql = "DELETE FROM $table WHERE $where";
            
            try {
                $stmt = $this->executeQuery($sql, $params);
                return $stmt->rowCount();
            } catch (PDOException $e) {
                $errorInfo = $this->classifyError($e);
                
                if ($errorInfo['type'] === self::ERROR_USER_FACING) {
                    throw new Exception($errorInfo['message']);
                } else {
                    error_log("Delete failed [Developer]: " . $e->getMessage() . " | Table: $table | Where: $where | Params: " . json_encode($params));
                    throw new Exception("Failed to delete record. Please try again.");
                }
            }
        }
        
        /**
         * Additional helper method to check if a value already exists
         */
        protected function valueExists($table, $column, $value, $excludeId = null) {
            $sql = "SELECT COUNT(*) as count FROM $table WHERE $column = ?";
            $params = [$value];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $result = $this->fetchOne($sql, $params);
            return $result['count'] > 1;
        }

private function classifyError(PDOException $e) {
    $errorCode = $e->getCode();
    $errorMessage = $e->getMessage();
    $sqlState = $e->errorInfo[0] ?? '';
    
    error_log("Database Error - Code: $errorCode, SQLState: $sqlState, Message: $errorMessage");
    
    // Check for any kind of unique constraint violation
    $isUniqueViolation = 
        $errorCode === 1062 ||
        $sqlState === '23000' ||
        stripos($errorMessage, 'duplicate') !== false ||
        stripos($errorMessage, 'unique') !== false;
    
    if ($isUniqueViolation) {
        $userMessage = $this->extractDuplicateFieldMessage($errorMessage);
        throw new Exception(
            $userMessage ?: 'This value already exists. Please use a different one.',
            409 // CONFLICT status code for duplicate entries
        );
    }
    
    // Foreign key constraint violations
    $isForeignKeyViolation = 
        $errorCode === 1451 ||
        stripos($errorMessage, 'foreign key') !== false ||
        stripos($errorMessage, 'constraint') !== false;
    
    if ($isForeignKeyViolation) {
        throw new Exception(
            'This operation cannot be completed because it is linked to other records.',
            409 // CONFLICT status code
        );
    }
    
    // Data validation errors
    if ($errorCode === 1406 || stripos($errorMessage, 'data too long') !== false) {
        throw new Exception(
            'The data you entered is too long. Please shorten it.',
            400 // BAD REQUEST
        );
    }
    
    if ($errorCode === 1364 || stripos($errorMessage, 'doesn\'t have a default value') !== false) {
        throw new Exception(
            'Required fields are missing. Please fill in all required information.',
            400 // BAD REQUEST
        );
    }
    
    // All other errors are for developers only
    throw new Exception("A database error occurred. Please try again.");
}

        /**
         * Additional helper method for transaction support
         */
        protected function beginTransaction() {
            return $this->db->beginTransaction();
        }
        
        protected function commit() {
            return $this->db->commit();
        }
        
        protected function rollBack() {
            return $this->db->rollBack();
        }
    }


?>