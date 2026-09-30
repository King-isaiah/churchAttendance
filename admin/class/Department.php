<?php
require_once '../class/Database.php';

class Department extends Database {
    
    public function getAllDepartments() {
        try {
            // $sql = "
            //     SELECT d.*, COUNT(m.id) as member_count 
            //     FROM departments d 
            //     LEFT JOIN members m ON d.id = m.department_id 
            //     GROUP BY d.id 
            //     ORDER BY d.created_at DESC
            // ";
            $sql = "
                SELECT * FROM departments                
                ORDER BY created_at DESC
            ";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Department getAll error: " . $e->getMessage());
            return [];
        }
    }
    
    public function getDepartment($id) {
        try {
            $sql = "SELECT * FROM departments WHERE id = ?";
            return $this->fetchOne($sql, [$id]);
        } catch (Exception $e) {
            error_log("Department get error: " . $e->getMessage());
            return false;
        }
    }
    
    public function createDepartment($data) {
        try {
            $id =  $this->insert('departments', $data);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Create Department.Please try again or call dev.',
                    'status' => 500 
                ];
                
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Department created succesfully."
            ];
        } catch (Exception $e) {
            error_log("Department create error: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateDepartment($id, $data) {
        try {
            $id =  $this->update('departments', $data, 'id = ?', [$id]);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Update Department.Please try again or call dev.',
                    'status' => 500 
                ];
                // throw new Exception("Failed to insert location", 500);
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Location Updated succesfully."
            ];
        } catch (Exception $e) {
            error_log("Department update error: " . $e->getMessage());
            return false;
        }
    }
    
    
       
    
    public function deleteDepartment($id) {
        try {
            $existing = $this->getDepartment($id);            
            if (!$existing) {
                throw new Exception("Department not found", 404);
            }
            $members = "SELECT * FROM members WHERE department_id = ?";
            $resultMember = $this->fetchOne($members, [$id]);    
            if ($resultMember) {
                
                // throw new Exception("Department already in use in members module", 404);
                
            
                return [
                    'success' => false,                    
                    'message' => "Department already in use in members module.",
                    'status' => 404
                ];
            }        
           
            // Delete the speaker from the speakers table
            $id = $this->delete('departments', 'id = ?', [$id]);
            if ($id === false) {
                return [
                    'success' => false,
                    'message' => 'Failed to Delete Department.Please try again or call dev.',
                    'status' => 500 
                ];
                // throw new Exception("Failed to insert location", 500);
            }
            
            return [
                'success' => true,
                'id' => $id,
                'message' => "Department deleted succesfully."
            ];
        } catch (Exception $e) {
            error_log("Department delete error: " . $e->getMessage());
            return false;
        }
    }
}
?>