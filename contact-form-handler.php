<?php
// Contact Form Handler for Greenland Academy
// Sends user submissions to admin email

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Include configuration
require_once 'config.php';
$config = include 'config.php';

// Configuration from config file
$adminEmail = $config['admin_email'];
$schoolName = $config['school_name'];
$subjectPrefix = $config['email_subject_prefix'];
$autoReplyEnabled = $config['auto_reply_enabled'];
$phonePrimary = $config['phone_primary'];
$phoneSecondary = $config['phone_secondary'];

// Function to sanitize input
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Function to validate email
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get and sanitize form data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$email = isset($_POST['email']) ? sanitizeInput($_POST['email']) : '';
$phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$message = isset($_POST['message']) ? sanitizeInput($_POST['message']) : '';

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
    echo json_encode(['success' => false, 'message' => 'Validation failed', 'errors' => $errors]);
    exit;
}

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

// Send email
$mailSent = mail($adminEmail, $emailSubject, $emailBody, implode("\r\n", $headers));

// Send auto-reply to user (if enabled)
if ($autoReplyEnabled && $mailSent) {
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

    mail($email, $userSubject, $userBody, implode("\r\n", $userHeaders));
}

// Return response
if ($mailSent) {
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
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again later.']);
}
?>
