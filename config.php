<?php
// Greenland Academy Configuration File
// Easy configuration for email settings and contact form

// Email Configuration
define('ADMIN_EMAIL', 'greenlandacademy12345@gmail.com');
define('SCHOOL_NAME', 'Greenland Academy E.F. Sunsari P.V.T. L.T.D');
define('WEBSITE_URL', 'https://yourdomain.com'); // Update with your actual domain

// Contact Form Settings
define('EMAIL_SUBJECT_PREFIX', '[Greenland Academy] New Contact Form Submission');
define('AUTO_REPLY_ENABLED', true); // Set to false to disable auto-reply to users

// Email Delivery Method
define('EMAIL_METHOD', 'php'); // Options: 'php', 'smtp', 'file'
define('LOG_EMAILS', true); // Log emails to file for debugging

// SMTP Configuration (Optional - for better email delivery)
/*
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-app-password');
define('SMTP_ENCRYPTION', 'tls');
*/

// Security Settings
define('ENABLE_CSRF_PROTECTION', true);
define('RATE_LIMIT_REQUESTS', 5); // Max 5 submissions per minute per IP
define('RATE_LIMIT_WINDOW', 60); // 60 seconds window

// Development Settings
define('DEBUG_MODE', true); // Set to true for development, false for production
define('LOG_ERRORS', true); // Log errors to file

// File Logging Settings
define('LOG_FILE', 'contact_form.log');
define('EMAIL_LOG_FILE', 'email_log.txt');

// Phone Numbers (for auto-reply and contact info)
define('PHONE_PRIMARY', '9819304211');
define('PHONE_SECONDARY', '9842155795');

// Social Media Links (optional)
define('FACEBOOK_URL', '#');
define('TWITTER_URL', '#');
define('INSTAGRAM_URL', '#');
define('LINKEDIN_URL', '#');

return [
    'admin_email' => ADMIN_EMAIL,
    'school_name' => SCHOOL_NAME,
    'website_url' => WEBSITE_URL,
    'email_subject_prefix' => EMAIL_SUBJECT_PREFIX,
    'auto_reply_enabled' => AUTO_REPLY_ENABLED,
    'phone_primary' => PHONE_PRIMARY,
    'phone_secondary' => PHONE_SECONDARY,
    'email_method' => EMAIL_METHOD,
    'log_emails' => LOG_EMAILS,
    'debug_mode' => DEBUG_MODE
];
?>
