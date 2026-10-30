<?php
require_once 'Database.php';

class Testimony extends Database {

    // User submits a testimony
    public function createTestimony($data) {
        try {
            if (empty($data['unique_id']) || empty($data['title']) || empty($data['content'])) {
                throw new Exception("Title and content are required.", 400);
            }

            $insertData = [
                'unique_id' => $data['unique_id'],
                'title' => $data['title'],
                'content' => $data['content'],
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ];

            return $this->insert('testimonies', $insertData);
        } catch (Exception $e) {
            error_log("Testimony create error: " . $e->getMessage());
            throw $e;
        }
    }

    // Admin gets all testimonies with member details
    public function getAllTestimonies() {
        try {
            $sql = "SELECT t.*, m.first_name, m.last_name, m.email 
                    FROM testimonies t 
                    LEFT JOIN members m ON t.unique_id = m.unique_id 
                    ORDER BY t.created_at DESC";
            return $this->fetchAll($sql);
        } catch (Exception $e) {
            error_log("Testimony getAll error: " . $e->getMessage());
            return [];
        }
    }

    // User gets their own testimonies
    public function getUserTestimonies($uniqueId) {
        try {
            $sql = "SELECT * FROM testimonies WHERE unique_id = ? ORDER BY created_at DESC";
            return $this->fetchAll($sql, [$uniqueId]);
        } catch (Exception $e) {
            error_log("Testimony getUser error: " . $e->getMessage());
            return [];
        }
    }

    // Admin updates status (approve/reject)
    public function updateStatus($id, $status) {
        try {
            $allowed = ['pending', 'approved', 'rejected'];
            if (!in_array($status, $allowed)) {
                throw new Exception("Invalid status", 400);
            }
            return $this->update('testimonies', ['status' => $status], 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Testimony updateStatus error: " . $e->getMessage());
            throw $e;
        }
    }

    // Admin deletes a testimony
    public function deleteTestimony($id) {
        try {
            return $this->delete('testimonies', 'id = ?', [$id]);
        } catch (Exception $e) {
            error_log("Testimony delete error: " . $e->getMessage());
            throw $e;
        }
    }

    // Admin Dashboard Stats
    public function getTestimonyStats() {
        try {
            $stats = [];

            // Total Testimonies
            $stats['total'] = $this->fetchOne("SELECT COUNT(*) as count FROM testimonies")['count'];

            // Total Members
            $stats['total_members'] = $this->fetchOne("SELECT COUNT(*) as count FROM members")['count'];

            // This Week
            $stats['weekly'] = $this->fetchOne("SELECT COUNT(*) as count FROM testimonies WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)")['count'];

            // This Month
            $stats['monthly'] = $this->fetchOne("SELECT COUNT(*) as count FROM testimonies WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())")['count'];

            // Ratio (Percentage of members who have submitted at least one testimony)
            $uniqueSubmitters = $this->fetchOne("SELECT COUNT(DISTINCT unique_id) as count FROM testimonies")['count'];
            $stats['ratio'] = $stats['total_members'] > 0 ? round(($uniqueSubmitters / $stats['total_members']) * 100, 1) : 0;

            return $stats;
        } catch (Exception $e) {
            error_log("Testimony stats error: " . $e->getMessage());
            return [];
        }
    }
}
?>