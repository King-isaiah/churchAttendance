<?php
require_once 'Database.php';
require_once 'Mailer.php';

class BirthdayNotifier extends Database {
    
    public function run() {
        // Force the correct timezone just in case
        date_default_timezone_set('Africa/Lagos');
        
        $today = date('m-d'); 
        $twoDaysFromNow = date('m-d', strtotime('+2 days'));
        $debugLog = __DIR__ . '/birthday_debug.txt';
        
        // Log that the script started
        file_put_contents($debugLog, "\n[" . date('Y-m-d H:i:s') . "] Script started. Looking for today: " . $today . " and upcoming: " . $twoDaysFromNow . "\n", FILE_APPEND);
        
        $mailer = new Mailer();
        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

        // =========================================================
        // 1. PROCESS TODAY'S BIRTHDAYS
        // =========================================================
        $sql = "SELECT unique_id, first_name, last_name, email FROM members WHERE birth_month_day = ?";
        $birthdayMembers = $this->fetchAll($sql, [$today]);
        
        $count = count($birthdayMembers);
        file_put_contents($debugLog, "Found {$count} member(s) with a birthday today.\n", FILE_APPEND);

        $results = ["Debug: Today is {$today}. Found {$count} birthday(s)."];

        foreach ($birthdayMembers as $member) {
            $fullName = $member['first_name'] . ' ' . $member['last_name'];
            $memberUniqueId = $member['unique_id'];

            // STEP 1: Broadcast Notification
            try {
                $this->insert('notifications', [
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
                $results[] = "✅ Broadcast notification created for {$fullName}";
            } catch (Exception $e) {
                $results[] = "❌ Failed Broadcast: " . $e->getMessage();
            }

            // STEP 2: Personal Notification
            try {
                $this->insert('notifications', [
                    'title' => "🎂 Happy Birthday, {$member['first_name']}!",
                    'message' => "Hey Hubber, today is your birthday! Let us send our warm regards and prayers. Wishing {$member['first_name']} a wonderful day!",
                    'notification_type' => 'system', 
                    'department_id' => null, 
                    'target_unique_id' => $memberUniqueId, 
                    'is_active' => 1,
                    'priority' => 'high',
                    'created_at' => $now,
                    'expires_at' => $expires
                ]);
                $results[] = "✅ Personal notification created for {$fullName}";
            } catch (Exception $e) {
                $results[] = "❌ Failed Personal: " . $e->getMessage();
            }

            // STEP 3: Send Fancy Email to Member
            try {
                $html = $this->getBirthdayEmailTemplate($member['first_name']);
                $mailer->sendEmail($member['email'], $member['first_name'], "Happy Birthday from Hub Church! 🎉", $html);
                $results[] = "✅ Email sent to {$member['email']}";
            } catch (Exception $e) {
                $results[] = "❌ Failed Email: " . $e->getMessage();
            }
        }

        // =========================================================
        // 2. PROCESS UPCOMING BIRTHDAYS (2 DAYS FROM NOW) FOR ADMIN
        // =========================================================
        try {
            $this->notifyAdminOfUpcomingBirthdays($twoDaysFromNow, $mailer);
        } catch (Exception $e) {
            file_put_contents($debugLog, "ERROR Admin Notification: " . $e->getMessage() . "\n", FILE_APPEND);
            $results[] = "❌ Failed Admin Notification: " . $e->getMessage();
        }
        
        return $results;
    }

    /**
     * Sends an email to the admin about upcoming birthdays
     */
    private function notifyAdminOfUpcomingBirthdays($targetDate, $mailer) {
        // Join with departments table to get the department name
        $sql = "SELECT m.first_name, m.last_name, m.email, m.birth_month_day, d.name as department_name 
                FROM members m 
                LEFT JOIN departments d ON m.primary_dept_id = d.id 
                WHERE m.birth_month_day = ?";
        $upcomingMembers = $this->fetchAll($sql, [$targetDate]);

        if (empty($upcomingMembers)) {
            return; // No upcoming birthdays, don't send an email
        }

        $adminEmail = 'eshiozemheafuwape@gmail.com';
        
        // Build the HTML Table for the admin
        $tableRows = '';
        foreach ($upcomingMembers as $m) {
            $dept = !empty($m['department_name']) ? $m['department_name'] : 'No Department';
            $tableRows .= "
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{$m['first_name']} {$m['last_name']}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{$m['email']}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #ddd;'>{$dept}</td>
                    <td style='padding: 10px; border-bottom: 1px solid #ddd;'><strong>{$m['birth_month_day']}</strong></td>
                </tr>
            ";
        }

        $html = "
        <div style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                <div style='background: #FF7A00; padding: 20px; text-align: center;'>
                    <h2 style='color: #ffffff; margin: 0;'>Upcoming Birthdays Alert</h2>
                </div>
                <div style='padding: 30px;'>
                    <p style='color: #333333; font-size: 16px;'>Hello Admin,</p>
                    <p style='color: #333333; font-size: 16px;'>This is a friendly reminder that the following members will be celebrating their birthdays in <strong>2 days</strong> ({$targetDate}).</p>
                    
                    <table style='width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;'>
                        <thead>
                            <tr style='background-color: #39FF14; color: #000000;'>
                                <th style='padding: 10px; text-align: left;'>Name</th>
                                <th style='padding: 10px; text-align: left;'>Email</th>
                                <th style='padding: 10px; text-align: left;'>Department</th>
                                <th style='padding: 10px; text-align: left;'>Birthday</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$tableRows}
                        </tbody>
                    </table>
                    
                    <p style='color: #333333; font-size: 16px; margin-top: 30px;'>You might want to prepare a shoutout or a gift!</p>
                </div>
                <div style='background: #111111; padding: 15px; text-align: center;'>
                    <p style='color: #ffffff; margin: 0; font-size: 12px;'>Hub Church Admin System</p>
                </div>
            </div>
        </div>";

        $mailer->sendEmail($adminEmail, "Admin", "🚨 Alert: Upcoming Birthdays in 2 Days", $html);
    }

    /**
     * Generates the fancy HTML template for the member's birthday email
     */
    private function getBirthdayEmailTemplate($firstName) {
        return "
        <div style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
                
                <!-- Header -->
                <div style='background: linear-gradient(135deg, #39FF14 0%, #2ECC0E 100%); padding: 30px; text-align: center;'>
                    <h1 style='color: #000000; margin: 0; font-size: 28px; letter-spacing: 1px;'>Hub Church</h1>
                </div>
                
                <!-- Body -->
                <div style='padding: 40px 30px; text-align: center;'>
                    <h2 style='color: #FF7A00; font-size: 26px; margin-top: 0;'>🎉 Happy Birthday, {$firstName}! 🎂</h2>
                    
                    <p style='color: #333333; font-size: 16px; line-height: 1.6;'>
                        The entire Hub Church family is wishing you a wonderful day filled with joy, blessings, and love. 
                    </p>
                    <p style='color: #333333; font-size: 16px; line-height: 1.6;'>
                        May this new year of your life be your best one yet!
                    </p>
                    
                    <div style='margin: 30px 0;'>
                        <span style='font-size: 40px;'>🎈🎁🥳</span>
                    </div>
                    
                    <p style='color: #333333; font-size: 16px; font-weight: bold;'>
                        Have a fantastic day!
                    </p>
                </div>
                
                <!-- Footer -->
                <div style='background: #111111; padding: 20px; text-align: center;'>
                    <p style='color: #ffffff; margin: 0; font-size: 14px;'>© " . date('Y') . " Hub Church. All rights reserved.</p>
                    <p style='color: #888888; margin: 5px 0 0 0; font-size: 12px;'>This is an automated message, please do not reply.</p>
                </div>
                
            </div>
        </div>";
    }
}
?>