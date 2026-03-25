
<?php
    require_once 'Database.php';

    class Category extends Database {
        
        public function getAllCategory() {
            try {
                $sql = "
                    SELECT * FROM categories 
                    ORDER BY created_at DESC
                ";
                return $this->fetchAll($sql);
            } catch (Exception $e) {
                error_log("Category getAll error: " . $e->getMessage());
                return [];
            }
        }
        
        public function getCategory($id) {
            try {
                $sql = "SELECT * FROM categories WHERE id = ?";
                $result = $this->fetchOne($sql, [$id]);
                
                if (!$result) {
                    throw new Exception("Category not found", 404);
                }
                
                return $result;
            } catch (Exception $e) {
                error_log("Category get error [ID: $id]: " . $e->getMessage());
                if ($e->getCode() === 404) {
                    throw $e; 
                }
                throw new Exception("Unable to retrieve category information");
            }
        }
        
        public function createCategory($data) {
            try {
                // Validate required fields
                $this->validateCategoryData($data);
                
                return $this->insert('categories', $data);
            } catch (Exception $e) {
                error_log("Category create error: " . $e->getMessage() . " | Data: " . json_encode($data));
                throw $e; 
            }
        }
        
        
        public function updateCategory($id, $data) {
            try {
                // Check if Category exists first
                $existing = $this->getCategory($id);
                if (!$existing) {
                    throw new Exception("Category not found", 404);
                }
                
                // Validate data
                $this->validateCategoryData($data, true);
                
                // Let the database handle duplicates
                return $this->update('categories', $data, 'id = ?', [$id]);
                
            } catch (Exception $e) {
                error_log("Category update error [ID: $id]: " . $e->getMessage());
                throw $e;
            }
        }
        
        public function deleteCategory($id) {
            try {
                $activities = "SELECT * FROM activities WHERE category_id = ?";
                $resultActivity = $this->fetchOne($activities, [$id]);
                if ($resultActivity) {
                    throw new Exception("Location already used in activity module", 404);
                }
                $existing = $this->getCategory($id);
                if (!$existing) {
                    throw new Exception("Category not found", 404);
                }
                
                return $this->delete('categories', 'id = ?', [$id]);
            } catch (Exception $e) {
                error_log("Category delete error [ID: $id]: " . $e->getMessage());
                throw $e;
            }
        }
        
       
        
        private function validateCategoryData($data, $isUpdate = false) {
            // $required = ['categories', 'capacity'];
            $required = ['categories'];
            
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("$field is required", 400); 
                }
            }
            
            // if (isset($data['categories']) && (!is_numeric($data['categories']) || $data['categories'] <= 0)) {
            //     throw new Exception("Capacity must be a positive number", 400);
            // }
            
            
            if (isset($data['categories']) && strlen($data['categories']) > 255) {
                throw new Exception("Category name is too long", 400);
            }
        }
    }
?>