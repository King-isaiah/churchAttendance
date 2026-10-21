<?php
require_once 'Database.php';
require_once 'Config.php'; 

class Mailer extends Database {
    
    // Set your daily limit here
    private $dailyLimit = 2;
    // private $dailyLimit = 270;

    public function sendEmail($toEmail, $toName, $subject, $htmlContent) {
        try {
            // 1. Check how many emails have been sent today
            $sql = "SELECT COUNT(*) as count FROM email_logs WHERE DATE(sent_at) = CURDATE()";
            $result = $this->fetchOne($sql);
            $sentToday = $result['count'];

            // 2. If limit reached, stop
            if ($sentToday >= $this->dailyLimit) {
                throw new Exception("Daily email limit of {$this->dailyLimit} reached. Please try again tomorrow.", 429);
            }

            // 3. Prepare Brevo API Payload
            $apiKey = BREVO_API_KEY;
            $payload = [
                'sender' => [
                    'name'  => 'Hub Church',
                    'email' => 'eshiozemheafuwape@gmail.com'
                ],
                'to' => [[
                    'email' => $toEmail,
                    'name'  => $toName
                ]],
                'subject' => $subject,
                'htmlContent' => $htmlContent
            ];

            // 4. Send via cURL
            $ch = curl_init('https://api.brevo.com/v3/smtp/email');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_HTTPHEADER     => [
                    'accept: application/json',
                    'api-key: ' . $apiKey,
                    'content-type: application/json'
                ],
                CURLOPT_TIMEOUT        => 15
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            // 5. If Brevo fails, throw error
            if ($httpCode !== 201) {
                throw new Exception("Brevo API Error: HTTP $httpCode | $response | cURL: $curlError", 500);
            }

            // 6. Log the successful email to the database
            $this->insert('email_logs', [
                'recipient_email' => $toEmail,
                'subject' => $subject
            ]);

            return true;

        } catch (Exception $e) {
            error_log("Mailer Error: " . $e->getMessage());
            throw $e; // Re-throw so the API handler can catch it
        }
    }
}
?>