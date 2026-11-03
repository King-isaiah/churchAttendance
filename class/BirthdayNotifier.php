<?php
require_once 'Database.php';
require_once 'Mailer.php';

class BirthdayNotifier extends Database {
    
    public function run() {
        // Force the correct timezone just in case
        date_default_timezone_set('Africa/Lagos');
        
        $today = date('m-d'); 
        $debugLog = __DIR__ . '/birthday_debug.txt';
        
        // Log that the script started
        file_put_contents($debugLog, "\n[" . date('Y-m-d H:i:s') . "] Script started. Looking for: " . $today . "\n", FILE_APPEND);
        
        $sql = "SELECT unique_id, first_name, last_name, email FROM members WHERE birth_month_day = ?";
        $birthdayMembers = $this->fetchAll($sql, [$today]);
        
        // Log how many people were found
        $count = count($birthdayMembers);
        file_put_contents($debugLog, "Found {$count} member(s) with this birthday.\n", FILE_APPEND);

        if (empty($birthdayMembers)) {
            return ["Debug: Today is {$today}. Found 0 members."]; 
        }

        $results = ["Debug: Today is {$today}. Found {$count} member(s)."];
        $mailer = new Mailer();
        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

        foreach ($birthdayMembers as $member) {
            $fullName = $member['first_name'] . ' ' . $member['last_name'];
            $memberUniqueId = $member['unique_id'];

            // STEP 1: Broadcast Notification
            try {
                $broadcastId = $this->insert('notifications', [
                    'title' => "🎉 It's a Birthday!",
                    'message' => "Today is {$fullName}'s birthday! Let's shower them with love and prayers.",
                    'notification_type' => 'announcement',
                    'department_id' => 0, 
                    'target_unique_id' => null, 
                    'is_active' => 1,
                    'priority' => 'high',
                    'created_at' => $now,
                    'expires_at' => $expires
                ]);
                if (!$broadcastId) throw new Exception("DB Insert returned false.");
                $results[] = "✅ Broadcast notification created for {$fullName}";
                file_put_contents($debugLog, "Broadcast notification created for {$fullName}.\n", FILE_APPEND);
            } catch (Exception $e) {
                $results[] = "❌ Failed Broadcast: " . $e->getMessage();
                file_put_contents($debugLog, "ERROR Broadcast: " . $e->getMessage() . "\n", FILE_APPEND);
                return $results; 
            }

            // STEP 2: Personal Notification
            try {
                $personalId = $this->insert('notifications', [
                    'title' => "🎂 Happy Birthday, {$member['first_name']}!",
                    'message' => "We are so glad to have you in our church family. Wishing you a wonderful day!",
                    'notification_type' => 'system', 
                    'department_id' => null, 
                    'target_unique_id' => $memberUniqueId, 
                    'is_active' => 1,
                    'priority' => 'high',
                    'created_at' => $now,
                    'expires_at' => $expires
                ]);
                if (!$personalId) throw new Exception("DB Insert returned false.");
                $results[] = "✅ Personal notification created for {$fullName}";
                file_put_contents($debugLog, "Personal notification created for {$fullName}.\n", FILE_APPEND);
            } catch (Exception $e) {
                $results[] = "❌ Failed Personal: " . $e->getMessage();
                file_put_contents($debugLog, "ERROR Personal: " . $e->getMessage() . "\n", FILE_APPEND);
                return $results; 
            }

            // STEP 3: Send Email
            try {
                $html = "<h2>🎉 Happy Birthday, {$member['first_name']}! 🎂</h2><p>Wishing you a wonderful day!</p>";
                $mailer->sendEmail($member['email'], $member['first_name'], "Happy Birthday!", $html);
                $results[] = "✅ Email sent to {$member['email']}";
                file_put_contents($debugLog, "Email sent to {$member['email']}.\n", FILE_APPEND);
            } catch (Exception $e) {
                $results[] = "❌ Failed Email: " . $e->getMessage();
                file_put_contents($debugLog, "ERROR Email: " . $e->getMessage() . "\n", FILE_APPEND);
            }
        }
        
        return $results;
    }
}
?>