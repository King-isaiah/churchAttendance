<?php
require_once 'Database.php';
require_once 'Mailer.php';


class BirthdayNotifier extends Database {
    
    public function run() {
        // Get today's date in 'MM-DD' format (e.g., '11-03')
        $today = date('m-d'); 
        
        // 1. Find everyone whose birthday is today
        $sql = "SELECT unique_id, first_name, last_name, email FROM members WHERE birth_month_day = ?";
        $birthdayMembers = $this->fetchAll($sql, [$today]);
        
        if (empty($birthdayMembers)) {
            return []; // No birthdays today, exit quietly
        }

        $results = [];
        $mailer = new Mailer();
        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', strtotime('+2 days')); // Notifications expire in 2 days

        foreach ($birthdayMembers as $member) {
            $fullName = $member['first_name'] . ' ' . $member['last_name'];
            $memberUniqueId = $member['unique_id'];

            // =========================================================
            // ACTION 1: Send Birthday Email
            // =========================================================
            try {
                $html = "
                    <div style='text-align: center; padding: 20px; font-family: sans-serif;'>
                        <h2 style='color: #28a745;'>🎉 Happy Birthday, {$member['first_name']}! 🎂</h2>
                        <p>Dear {$fullName},</p>
                        <p>Wishing you a wonderful birthday filled with joy, blessings, and God's grace.</p>
                        <p>From all of us at Hub Church!</p>
                    </div>
                ";
                $mailer->sendEmail($member['email'], $member['first_name'], "Happy Birthday, {$member['first_name']}!", $html);
                $results[] = "Email sent to {$member['email']}";
            } catch (Exception $e) {
                $results[] = "Failed to send email to {$member['email']}: " . $e->getMessage();
            }

            // =========================================================
            // ACTION 2: Broadcast Notification (Everyone sees it)
            // =========================================================
            try {
                $this->insert('notifications', [
                    'title' => "🎉 It's a Birthday!",
                    'message' => "Today is {$fullName}'s birthday! Let's shower them with love and prayers.",
                    'notification_type' => 'announcement', // Broadcast type
                    'department_id' => 0, // 0 means everyone
                    'target_unique_id' => null, // Null means not targeted to a specific person
                    'is_active' => 1,
                    'priority' => 'medium',
                    'created_at' => $now,
                    'expires_at' => $expires
                ]);
                $results[] = "Broadcast notification created for {$fullName}";
            } catch (Exception $e) {
                $results[] = "Failed to create broadcast notification: " . $e->getMessage();
            }

            // =========================================================
            // ACTION 3: Personal Notification (Only the birthday person sees it)
            // =========================================================
            try {
                $this->insert('notifications', [
                    'title' => "🎂 Happy Birthday!",
                    'message' => "Happy Birthday, {$member['first_name']}! We are so glad to have you in our church family.",
                    'notification_type' => 'system', // Personal type
                    'department_id' => 0, 
                    'target_unique_id' => $memberUniqueId, // Only this user sees it
                    'is_active' => 1,
                    'priority' => 'high',
                    'created_at' => $now,
                    'expires_at' => $expires
                ]);
                $results[] = "Personal notification created for {$fullName}";
            } catch (Exception $e) {
                $results[] = "Failed to create personal notification: " . $e->getMessage();
            }
        }
        
        return $results;
    }
}
?>