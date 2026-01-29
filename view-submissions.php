<?php
// Admin Dashboard - View Contact Form Submissions
// Simple file-based submission viewer

session_start();
// Simple password protection (you should improve this in production)
$password = 'admin123'; // Change this to a secure password

if (!isset($_SESSION['logged_in'])) {
    if ($_POST['password'] === $password) {
        $_SESSION['logged_in'] = true;
    } elseif ($_POST) {
        $error = 'Invalid password';
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['logged_in']);
    header('Location: view-submissions.php');
    exit;
}

if (!isset($_SESSION['logged_in'])):
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Greenland Academy</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
        .login-form { background: #f8f9fa; padding: 30px; border-radius: 8px; border: 1px solid #ddd; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background: #0056b3; }
        .error { color: red; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="login-form">
        <h2>🎓 Greenland Academy Admin</h2>
        <p>Enter password to view submissions:</p>
        <form method="post">
            <input type="password" name="password" placeholder="Enter password" required>
            <button type="submit">Login</button>
        </form>
        <?php if (isset($error)): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>
    </div>
</body>
</html>
<?php
exit;
endif;

// Get all submission files
$submission_files = glob('submissions_*.json');
rsort($submission_files); // Most recent first

$submissions = [];
foreach ($submission_files as $file) {
    $json_data = file_get_contents($file);
    if ($json_data) {
        $file_submissions = json_decode($json_data, true) ?: [];
        $submissions = array_merge($submissions, $file_submissions);
    }
}

// Sort by timestamp (most recent first)
usort($submissions, function($a, $b) {
    return strtotime($b['timestamp']) - strtotime($a['timestamp']);
});

// Get admin notification
$notifications = '';
if (file_exists('admin_notification.txt')) {
    $notifications = file_get_contents('admin_notification.txt');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Submissions - Greenland Academy Admin</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .submission { background: white; margin: 10px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .submission.new { border-left-color: #28a745; }
        .meta { color: #666; font-size: 12px; margin-bottom: 10px; }
        .field { margin: 10px 0; }
        .field strong { color: #333; display: inline-block; width: 80px; }
        .message { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .btn { background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .notifications { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .notifications pre { background: #f8f9fa; padding: 10px; border-radius: 4px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Greenland Academy - Contact Submissions</h1>
        <div style="float: right;">
            <a href="view-submissions.php" class="btn">Refresh</a>
            <a href="view-submissions.php?logout=1" class="btn btn-danger">Logout</a>
        </div>
        <div style="clear: both;"></div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number"><?php echo count($submissions); ?></div>
                <div>Total Submissions</div>
            </div>
            <div class="stat">
                <div class="stat-number"><?php echo count($submission_files); ?></div>
                <div>Monthly Files</div>
            </div>
            <div class="stat">
                <div class="stat-number"><?php echo date('F Y'); ?></div>
                <div>Current Month</div>
            </div>
        </div>
    </div>

    <?php if (!empty($notifications)): ?>
        <div class="notifications">
            <h3>📬 Recent Notifications</h3>
            <pre><?php echo htmlspecialchars(substr($notifications, -2000)); ?></pre>
            <button onclick="clearNotifications()" class="btn btn-danger">Clear Notifications</button>
        </div>
    <?php endif; ?>

    <?php if (empty($submissions)): ?>
        <div class="header">
            <p>No submissions found yet.</p>
        </div>
    <?php else: ?>
        <?php foreach ($submissions as $index => $sub): ?>
            <div class="submission <?php echo $index < 5 ? 'new' : ''; ?>">
                <div class="meta">
                    📅 <?php echo date('M j, Y H:i', strtotime($sub['timestamp'])); ?> 
                    🌐 <?php echo htmlspecialchars($sub['ip_address']); ?>
                    📱 <?php echo htmlspecialchars(substr($sub['user_agent'], 0, 50)); ?>
                </div>
                
                <div class="field">
                    <strong>Name:</strong> <?php echo htmlspecialchars($sub['data']['name']); ?>
                </div>
                
                <div class="field">
                    <strong>Email:</strong> 
                    <a href="mailto:<?php echo htmlspecialchars($sub['data']['email']); ?>"><?php echo htmlspecialchars($sub['data']['email']); ?></a>
                </div>
                
                <?php if (!empty($sub['data']['phone'])): ?>
                <div class="field">
                    <strong>Phone:</strong> <?php echo htmlspecialchars($sub['data']['phone']); ?>
                </div>
                <?php endif; ?>
                
                <?php if (!empty($sub['data']['subject'])): ?>
                <div class="field">
                    <strong>Subject:</strong> <?php echo htmlspecialchars($sub['data']['subject']); ?>
                </div>
                <?php endif; ?>
                
                <div class="field">
                    <strong>Message:</strong>
                    <div class="message"><?php echo nl2br(htmlspecialchars($sub['data']['message'])); ?></div>
                </div>
                
                <div style="margin-top: 15px;">
                    <a href="mailto:<?php echo htmlspecialchars($sub['data']['email']); ?>" class="btn">Reply via Email</a>
                    <button onclick="markAsRead(<?php echo $index; ?>)" class="btn">Mark as Read</button>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>

    <script>
        function clearNotifications() {
            if (confirm('Clear all notifications?')) {
                window.location.href = 'view-submissions.php?clear=1';
            }
        }
        
        function markAsRead(index) {
            // This would mark the submission as read in a real system
            alert('Marked as read (feature not implemented in this demo)');
        }
        
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>

    <?php
    if (isset($_GET['clear'])) {
        file_put_contents('admin_notification.txt', '');
        echo '<script>window.location.href = "view-submissions.php";</script>';
    }
    ?>
</body>
</html>
