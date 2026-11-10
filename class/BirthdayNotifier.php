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

        // $adminEmail = 'eshiozemheafuwape@gmail.com';
        $adminEmail = 'blackzeno785@gmail.com';
        
        // Build the HTML Table for the admin with alternating row colors for readability
        $tableRows = '';
        $counter = 1;
        foreach ($upcomingMembers as $m) {
            $dept = !empty($m['department_name']) ? $m['department_name'] : 'No Department';
            // Alternate background color for the table rows
            $rowColor = ($counter % 2 === 0) ? '#f9f9f9' : '#ffffff'; 
            
            $tableRows .= "
                <tr style='background-color: {$rowColor};'>
                    <td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #333333;'><strong>{$m['first_name']} {$m['last_name']}</strong></td>
                    <td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #555555;'>{$m['email']}</td>
                    <td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #555555;'>{$dept}</td>
                    <td style='padding: 12px 15px; border-bottom: 1px solid #eeeeee; color: #FF7A00; font-weight: bold;'>{$m['birth_month_day']}</td>
                </tr>
            ";
            $counter++;
        }

        // Convert YYYY-MM-DD to a more readable format like "November 12th"
        $displayDate = date('F jS', strtotime(date('Y') . '-' . $targetDate));

        $html = "
        <div style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
            <div style='max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>
                
                <!-- Top Orange Alert Bar -->
                <div style='height: 6px; background: #FF7A00;'></div>
                
                <!-- Green Church Header -->
                <div style='background: linear-gradient(135deg, #39FF14 0%, #2ECC0E 100%); padding: 30px; text-align: center;'>
                    <h1 style='color: #000000; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;'>Hub Church Admin</h1>
                </div>
                
                <!-- Email Body -->
                <div style='padding: 35px 30px;'>
                    <h2 style='color: #111111; margin-top: 0; font-size: 22px;'>Hi Admin, Great day! 👋</h2>
                    
                    <p style='color: #444444; font-size: 16px; line-height: 1.6;'>
                        This is a friendly reminder that the following members will be celebrating their birthdays in <strong>2 days</strong> (on <span style='color: #1A8C06; font-weight: bold;'>{$displayDate}</span>).
                    </p>
                    
                    <p style='color: #444444; font-size: 16px; line-height: 1.6; margin-bottom: 20px;'>
                        You may want to prepare a special shoutout, a gift, or coordinate with their department heads to make their day special.
                    </p>
                    
                    <!-- Data Table -->
                    <table style='width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px; border: 1px solid #eeeeee; border-radius: 8px; overflow: hidden;'>
                        <thead>
                            <tr style='background-color: #111111; color: #ffffff;'>
                                <th style='padding: 15px; text-align: left; font-weight: 600;'>Name</th>
                                <th style='padding: 15px; text-align: left; font-weight: 600;'>Email</th>
                                <th style='padding: 15px; text-align: left; font-weight: 600;'>Department</th>
                                <th style='padding: 15px; text-align: left; font-weight: 600;'>Birthday</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$tableRows}
                        </tbody>
                    </table>
                    
                    <div style='margin-top: 35px; padding-top: 20px; border-top: 1px solid #eeeeee;'>
                        <p style='color: #444444; font-size: 16px; margin: 0;'>Blessings,</p>
                        <p style='color: #111111; font-size: 16px; font-weight: bold; margin: 5px 0 0 0;'>Hub Church System</p>
                    </div>
                </div>
                
                <!-- Black Footer -->
                <div style='background: #111111; padding: 20px; text-align: center;'>
                    <p style='color: #ffffff; margin: 0; font-size: 14px;'>© " . date('Y') . " Hub Church. All rights reserved.</p>
                    <p style='color: #888888; margin: 5px 0 0 0; font-size: 12px;'>This is an automated admin alert. Please do not reply directly to this email.</p>
                </div>
                
            </div>
        </div>";

        $mailer->sendEmail($adminEmail, "Admin", "🚨 Upcoming Birthdays in 2 Days", $html);
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