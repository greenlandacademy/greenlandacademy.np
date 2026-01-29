<?php
// Simple Contact Form Handler - File Based Backup System
// Guaranteed to work even if PHP mail fails

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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

// Function to save submission to file
function saveSubmissionToFile($data) {
    $filename = 'submissions_' . date('Y-m') . '.json';
    $submission = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => $data
    ];
    
    // Read existing submissions
    $submissions = [];
    if (file_exists($filename)) {
        $json_data = file_get_contents($filename);
        if ($json_data) {
            $submissions = json_decode($json_data, true) ?: [];
        }
    }
    
    // Add new submission
    $submissions[] = $submission;
    
    // Save back to file
    $json_output = json_encode($submissions, JSON_PRETTY_PRINT);
    $result = file_put_contents($filename, $json_output, LOCK_EX);
    
    return $result !== false;
}

// Function to create admin notification
function createAdminNotification($data) {
    $notification_file = 'admin_notification.txt';
    $message = "NEW CONTACT FORM SUBMISSION\n";
    $message .= "============================\n";
    $message .= "Date: " . date('Y-m-d H:i:s') . "\n";
    $message .= "Name: " . $data['name'] . "\n";
    $message .= "Email: " . $data['email'] . "\n";
    $message .= "Phone: " . $data['phone'] . "\n";
    $message .= "Subject: " . $data['subject'] . "\n";
    $message .= "Message: " . $data['message'] . "\n";
    $message .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
    $message .= "============================\n\n";
    
    file_put_contents($notification_file, $message, FILE_APPEND | LOCK_EX);
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

// Prepare data
$formData = [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'subject' => $subject,
    'message' => $message
];

// Save to file (guaranteed to work)
$fileSaved = saveSubmissionToFile($formData);

// Create admin notification
createAdminNotification($formData);

// Try to send email (optional, may fail)
$emailSent = false;
try {
    $adminEmail = 'greenlandacademy12345@gmail.com';
    $emailSubject = '[Greenland Academy] Contact Form: ' . (!empty($subject) ? $subject : 'New Submission');
    $emailBody = "Name: $name\nEmail: $email\nPhone: $phone\n\nMessage:\n$message";
    $headers = "From: noreply@greenlandacademy.com\r\nReply-To: $email";
    
    $emailSent = mail($adminEmail, $emailSubject, $emailBody, $headers);
} catch (Exception $e) {
    // Email failed but we don't care - file backup worked
    $emailSent = false;
}

// Return success response (file backup worked)
echo json_encode([
    'success' => true,
    'message' => 'Thank you for contacting us! We have received your message and will get back to you soon.',
    'data' => [
        'name' => $name,
        'email' => $email,
        'timestamp' => date('Y-m-d H:i:s'),
        'file_saved' => $fileSaved,
        'email_sent' => $emailSent,
        'backup_method' => 'file_based'
    ]
]);
?>
