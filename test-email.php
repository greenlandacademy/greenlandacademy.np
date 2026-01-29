<?php
// Test email functionality
// This file helps diagnose email sending issues

require_once 'config.php';
$config = include 'config.php';

header('Content-Type: text/html; charset=UTF-8');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Test - Greenland Academy</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .success { background: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🎓 Greenland Academy - Email System Test</h1>
    
    <div class="test-section info">
        <h2>System Information</h2>
        <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
        <p><strong>Server:</strong> <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></p>
        <p><strong>Admin Email:</strong> <?php echo $config['admin_email']; ?></p>
        <p><strong>Email Method:</strong> <?php echo $config['email_method']; ?></p>
        <p><strong>Debug Mode:</strong> <?php echo $config['debug_mode'] ? 'Enabled' : 'Disabled'; ?></p>
    </div>

    <div class="test-section info">
        <h2>PHP Mail Function Test</h2>
        <form method="post">
            <button type="submit" name="test_mail">Test PHP Mail Function</button>
        </form>
        
        <?php
        if (isset($_POST['test_mail'])) {
            $testEmail = $config['admin_email'];
            $testSubject = 'Test Email from Greenland Academy';
            $testMessage = 'This is a test email to verify that the PHP mail function is working correctly.';
            $testHeaders = [
                'From: Greenland Academy <noreply@greenlandacademy.com>',
                'Content-Type: text/plain; charset=UTF-8'
            ];
            
            echo '<h3>Test Results:</h3>';
            echo '<pre>';
            echo 'Attempting to send email to: ' . $testEmail . "\n";
            echo 'Subject: ' . $testSubject . "\n";
            echo 'Headers: ' . implode("\r\n", $testHeaders) . "\n";
            echo '</pre>';
            
            $mailResult = mail($testEmail, $testSubject, $testMessage, implode("\r\n", $testHeaders));
            
            if ($mailResult) {
                echo '<div class="success">';
                echo '<h4>✅ SUCCESS: PHP mail function returned true</h4>';
                echo '<p>The mail function reported success. Check your inbox (including spam folder) for the test email.</p>';
                echo '</div>';
            } else {
                echo '<div class="error">';
                echo '<h4>❌ FAILED: PHP mail function returned false</h4>';
                echo '<p>The mail function failed. This could be due to:</p>';
                echo '<ul>';
                echo '<li>PHP mail function not configured on server</li>';
                echo '<li>SMTP server not available</li>';
                echo '<li>Incorrect mail configuration in php.ini</li>';
                echo '<li>Server restrictions on outgoing emails</li>';
                echo '</ul>';
                echo '</div>';
                
                // Show PHP mail configuration
                echo '<h4>PHP Mail Configuration:</h4>';
                echo '<pre>';
                echo 'SMTP: ' . (ini_get('SMTP') ?: 'not set') . "\n";
                echo 'smtp_port: ' . (ini_get('smtp_port') ?: 'not set') . "\n";
                echo 'sendmail_path: ' . (ini_get('sendmail_path') ?: 'not set') . "\n";
                echo 'mail.add_x_header: ' . (ini_get('mail.add_x_header') ?: 'not set') . "\n";
                echo '</pre>';
            }
            
            // Show last error
            $error = error_get_last();
            if ($error) {
                echo '<h4>Last PHP Error:</h4>';
                echo '<pre>';
                echo print_r($error, true);
                echo '</pre>';
            }
        }
        ?>
    </div>

    <div class="test-section info">
        <h2>Contact Form Test</h2>
        <form method="post">
            <button type="submit" name="test_contact_form">Test Contact Form Handler</button>
        </form>
        
        <?php
        if (isset($_POST['test_contact_form'])) {
            // Simulate form submission
            $_POST['name'] = 'Test User';
            $_POST['email'] = 'test@example.com';
            $_POST['phone'] = '1234567890';
            $_POST['subject'] = 'Test Subject';
            $_POST['message'] = 'This is a test message from the contact form test.';
            
            echo '<h3>Contact Form Handler Test:</h3>';
            
            try {
                // Include the contact form handler
                include 'contact-form-handler-v2.php';
            } catch (Exception $e) {
                echo '<div class="error">';
                echo '<h4>❌ Exception:</h4>';
                echo '<pre>' . $e->getMessage() . '</pre>';
                echo '</div>';
            }
        }
        ?>
    </div>

    <div class="test-section info">
        <h2>Log Files</h2>
        <p>Check these log files for debugging information:</p>
        <ul>
            <li><strong>Contact Form Log:</strong> <?php echo LOG_FILE; ?></li>
            <li><strong>Email Log:</strong> <?php echo EMAIL_LOG_FILE; ?></li>
            <li><strong>Pending Emails:</strong> pending_emails.txt (if email logging is enabled)</li>
        </ul>
        
        <?php
        // Show recent log entries if files exist
        if (file_exists(LOG_FILE)) {
            echo '<h4>Recent Contact Form Log:</h4>';
            echo '<pre>';
            $lines = file(LOG_FILE);
            $recentLines = array_slice($lines, -10); // Last 10 lines
            echo implode('', $recentLines);
            echo '</pre>';
        }
        
        if (file_exists(EMAIL_LOG_FILE)) {
            echo '<h4>Recent Email Log:</h4>';
            echo '<pre>';
            $lines = file(EMAIL_LOG_FILE);
            $recentLines = array_slice($lines, -10); // Last 10 lines
            echo implode('', $recentLines);
            echo '</pre>';
        }
        
        if (file_exists('pending_emails.txt')) {
            echo '<h4>Pending Emails (File Backup):</h4>';
            echo '<pre>';
            $lines = file('pending_emails.txt');
            $recentLines = array_slice($lines, -5); // Last 5 entries
            foreach ($recentLines as $line) {
                $data = json_decode($line, true);
                if ($data) {
                    echo "To: {$data['to']} | Subject: {$data['subject']} | Time: {$data['timestamp']}\n";
                }
            }
            echo '</pre>';
        }
        ?>
    </div>

    <div class="test-section info">
        <h2>Troubleshooting Steps</h2>
        <ol>
            <li><strong>Check PHP Configuration:</strong> Ensure mail() function is enabled in php.ini</li>
            <li><strong>Verify SMTP Settings:</strong> Configure SMTP server if required</li>
            <li><strong>Check Server Logs:</strong> Look for email-related errors in server logs</li>
            <li><strong>Test with Different Email:</strong> Try sending to a different email address</li>
            <li><strong>Check Spam Folder:</strong> Test emails might go to spam/junk folder</li>
            <li><strong>Use File Logging:</strong> Enable EMAIL_METHOD = 'file' to backup emails</li>
            <li><strong>Contact Hosting Provider:</strong> Some hosts restrict outgoing emails</li>
        </ol>
    </div>

    <div class="test-section info">
        <h2>Alternative Solutions</h2>
        <p>If PHP mail() doesn't work, consider these alternatives:</p>
        <ul>
            <li><strong>SMTP Configuration:</strong> Set up SMTP in config.php</li>
            <li><strong>Third-party Service:</strong> Use SendGrid, Mailgun, or Amazon SES</li>
            <li><strong>File Backup:</strong> Enable file logging to save submissions</li>
            <li><strong>Hosting Support:</strong> Contact your hosting provider for email setup</li>
        </ul>
    </div>

    <p><small><a href="index.html">← Back to Website</a></small></p>
</body>
</html>
