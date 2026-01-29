<?php
// Enhanced Contact Form Handler for Greenland Academy
// Improved error handling and debugging

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include configuration
require_once 'config.php';
$config = include 'config.php';

// Enable error reporting for debugging
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Logging function
function logMessage($message, $type = 'INFO') {
    $logFile = LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Email logging function
function logEmail($to, $subject, $body, $success) {
    if (!LOG_EMAILS) return;
    
    $logFile = EMAIL_LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $status = $success ? 'SUCCESS' : 'FAILED';
    $logEntry = "[$timestamp] [$status] To: $to | Subject: $subject" . PHP_EOL;
    $logEntry .= "Body: " . substr(strip_tags($body), 0, 200) . "..." . PHP_EOL;
    $logEntry .= str_repeat("-", 80) . PHP_EOL;
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

// Function to send email with fallback methods
function sendEmail($to, $subject, $body, $headers) {
    global $config;
    
    logMessage("Attempting to send email to: $to", 'INFO');
    
    // Method 1: Try PHP mail function
    if ($config['email_method'] === 'php' || $config['email_method'] === 'all') {
        logMessage("Trying PHP mail function", 'INFO');
        $success = mail($to, $subject, $body, implode("\r\n", $headers));
        logEmail($to, $subject, $body, $success);
        
        if ($success) {
            logMessage("PHP mail function succeeded", 'SUCCESS');
            return true;
        } else {
            logMessage("PHP mail function failed", 'ERROR');
            $error = error_get_last();
            if ($error) {
                logMessage("PHP mail error: " . $error['message'], 'ERROR');
            }
        }
    }
    
    // Method 2: Log to file as fallback
    if ($config['email_method'] === 'file' || $config['email_method'] === 'all') {
        logMessage("Logging email to file as fallback", 'INFO');
        
        $emailFile = 'pending_emails.txt';
        $emailData = [
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'headers' => $headers,
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];
        
        file_put_contents($emailFile, json_encode($emailData) . PHP_EOL, FILE_APPEND | LOCK_EX);
        logMessage("Email logged to file: $emailFile", 'SUCCESS');
        return true;
    }
    
    logMessage("All email methods failed", 'ERROR');
    return false;
}

// Function to sanitize input
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Function to validate email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    logMessage("Invalid request method: " . $_SERVER['REQUEST_METHOD'], 'ERROR');
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Log incoming request
logMessage("Contact form submission from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// Get and sanitize form data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
$phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';

// Log form data (without sensitive info)
logMessage("Form data - Name: $name, Email: $email, Subject: $subject");

// Validate required fields
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required';
}

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!validateEmail($email)) {
    $errors[] = 'Invalid email format';
}

if (empty($message)) {
    $errors[] = 'Message is required';
}

// If there are errors, return them
if (!empty($errors)) {
    http_response_code(400);
    logMessage("Validation errors: " . implode(', ', $errors), 'ERROR');
    echo json_encode(['success' => false, 'message' => 'Validation failed', 'errors' => $errors]);
    exit;
}

// Configuration from config file
$adminEmail = $config['admin_email'];
$schoolName = $config['school_name'];
$subjectPrefix = $config['email_subject_prefix'];
$autoReplyEnabled = $config['auto_reply_enabled'];
$phonePrimary = $config['phone_primary'];
$phoneSecondary = $config['phone_secondary'];

// Prepare email content
$emailSubject = $subjectPrefix . ' - ' . (!empty($subject) ? $subject : 'General Inquiry');

$emailBody = "
<html>
<head>
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 20px; }
        .field-label { font-weight: bold; color: #059669; margin-bottom: 5px; }
        .field-value { background: white; padding: 10px; border-left: 4px solid #10b981; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .timestamp { color: #9ca3af; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎓 " . htmlspecialchars($schoolName) . "</h1>
            <h2>New Contact Form Submission</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='field-label'>👤 Name:</div>
                <div class='field-value'>" . htmlspecialchars($name) . "</div>
            </div>
            
            <div class='field'>
                <div class='field-label'>📧 Email:</div>
                <div class='field-value'>" . htmlspecialchars($email) . "</div>
            </div>
            
            <div class='field'>
                <div class='field-label'>📱 Phone:</div>
                <div class='field-value'>" . htmlspecialchars($phone) . "</div>
            </div>
            
            <div class='field'>
                <div class='field-label'>📋 Subject:</div>
                <div class='field-value'>" . htmlspecialchars($subject) . "</div>
            </div>
            
            <div class='field'>
                <div class='field-label'>💬 Message:</div>
                <div class='field-value'>" . nl2br(htmlspecialchars($message)) . "</div>
            </div>
            
            <div class='timestamp'>
                Submitted on: " . date('Y-m-d H:i:s') . "
                <br>IP Address: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "
                <br>User Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 100) : 'unknown') . "
            </div>
        </div>
        <div class='footer'>
            <p>This message was sent from the " . htmlspecialchars($schoolName) . " website contact form.</p>
            <p>Please respond to the sender at: " . htmlspecialchars($email) . "</p>
        </div>
    </div>
</body>
</html>";

// Email headers
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . $schoolName . ' <noreply@greenlandacademy.com>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion()
];

// Send email to admin
logMessage("Sending admin email to: $adminEmail", 'INFO');
$mailSent = sendEmail($adminEmail, $emailSubject, $emailBody, $headers);

// Send auto-reply to user (if enabled)
if ($autoReplyEnabled && $mailSent) {
    logMessage("Sending auto-reply to: $email", 'INFO');
    
    $userSubject = 'Thank you for contacting ' . $schoolName;
    $userBody = "
<html>
<head>
    <title>Thank you for contacting us</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎓 " . htmlspecialchars($schoolName) . "</h1>
            <h2>Thank You for Contacting Us!</h2>
        </div>
        <div class='content'>
            <p>Dear " . htmlspecialchars($name) . ",</p>
            <p>Thank you for reaching out to " . htmlspecialchars($schoolName) . ". We have received your message and will get back to you as soon as possible.</p>
            <p><strong>Your Message Summary:</strong></p>
            <p><em>\"" . htmlspecialchars(substr($message, 0, 200)) . (strlen($message) > 200 ? '...' : '') . "\"</em></p>
            <p>We typically respond within 24-48 hours during business days. If your matter is urgent, please feel free to call us at:</p>
            <p>📞 " . htmlspecialchars($phonePrimary) . " / " . htmlspecialchars($phoneSecondary) . "</p>
            <p>Best regards,<br>" . htmlspecialchars($schoolName) . " Team</p>
        </div>
    </div>
</body>
</html>";

    $userHeaders = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $schoolName . ' <noreply@greenlandacademy.com>',
        'Reply-To: ' . $adminEmail
    ];

    sendEmail($email, $userSubject, $userBody, $userHeaders);
}

// Return response
if ($mailSent) {
    logMessage("Contact form submission successful", 'SUCCESS');
    echo json_encode([
        'success' => true, 
        'message' => 'Thank you for contacting us! We will get back to you soon.',
        'data' => [
            'name' => $name,
            'email' => $email,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    http_response_code(500);
    logMessage("Contact form submission failed", 'ERROR');
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to send email. Please try again later.',
        'debug_info' => DEBUG_MODE ? [
            'email_method' => $config['email_method'],
            'admin_email' => $adminEmail,
            'log_files' => [LOG_FILE, EMAIL_LOG_FILE]
        ] : null
    ]);
}
?>
