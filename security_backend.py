#!/usr/bin/env python3
"""
Greenland Academy Security Backend
Comprehensive security system with Flask, rate limiting, CSRF protection, and input validation
"""

from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
import os
import json
import sqlite3
import datetime
import re
import hashlib
import hmac
import secrets
from functools import wraps
import logging
from logging.handlers import RotatingFileHandler
import bleach
import validators

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['WTF_CSRF_TIME_LIMIT'] = None
app.config['WTF_CSRF_SSL_STRICT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = datetime.timedelta(minutes=30)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Security middleware
csrf = CSRFProtect(app)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Logging setup
if not os.path.exists('logs'):
    os.mkdir('logs')
file_handler = RotatingFileHandler('logs/security.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)

# Database initialization
def init_db():
    """Initialize secure database with proper schema"""
    conn = sqlite3.connect('security.db')
    cursor = conn.cursor()
    
    # Create users table for admin authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            failed_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP
        )
    ''')
    
    # Create security logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            user_agent TEXT,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            severity TEXT DEFAULT 'INFO'
        )
    ''')
    
    # Create rate limiting table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            request_count INTEGER DEFAULT 1,
            window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ip_address, endpoint)
        )
    ''')
    
    # Create contact submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT,
            message TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            spam_score REAL DEFAULT 0.0
        )
    ''')
    
    conn.commit()
    conn.close()

# Security utilities
class SecurityValidator:
    """Comprehensive input validation and sanitization"""
    
    @staticmethod
    def sanitize_input(data, max_length=1000):
        """Sanitize and validate input data"""
        if not data:
            return ""
        
        # Convert to string if not already
        if not isinstance(data, str):
            data = str(data)
        
        # Remove potential malicious content
        data = bleach.clean(data, tags=[], attributes={}, strip=True)
        
        # Remove script and event handlers
        data = re.sub(r'<script.*?</script>', '', data, flags=re.IGNORECASE | re.DOTALL)
        data = re.sub(r'on\w+\s*=', '', data, flags=re.IGNORECASE)
        
        # Limit length
        data = data[:max_length]
        
        return data.strip()
    
    @staticmethod
    def validate_email(email):
        """Validate email format with comprehensive checks"""
        if not email or len(email) > 254:
            return False
        
        # Basic format validation
        if not validators.email(email):
            return False
        
        # Additional security checks
        email_lower = email.lower()
        suspicious_patterns = [
            r'\.ru$', r'\.cn$', r'\.tk$',  # Suspicious TLDs
            r'[0-9]{5,}',  # Too many numbers
            r'[<>"\']',  # HTML characters
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email_lower):
                return False
        
        return True
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number format"""
        if not phone:
            return True  # Phone is optional
        
        # Remove common formatting
        clean_phone = re.sub(r'[^\d+]', '', phone)
        
        # Check length and format
        if len(clean_phone) < 10 or len(clean_phone) > 15:
            return False
        
        # Must start with + or digit
        if not clean_phone.startswith('+') and not clean_phone[0].isdigit():
            return False
        
        return True
    
    @staticmethod
    def calculate_spam_score(submission):
        """Calculate spam score for contact form submissions"""
        score = 0.0
        
        # Check for suspicious patterns
        spam_keywords = [
            'viagra', 'cialis', 'lottery', 'winner', 'free money',
            'click here', 'limited offer', 'act now', 'congratulations'
        ]
        
        message_lower = submission.get('message', '').lower()
        for keyword in spam_keywords:
            if keyword in message_lower:
                score += 0.2
        
        # Check for excessive links
        url_count = len(re.findall(r'http[s]?://', message_lower))
        score += min(url_count * 0.1, 0.3)
        
        # Check for excessive capitalization
        if sum(1 for c in message_lower if c.isupper()) > len(message_lower) * 0.5:
            score += 0.2
        
        # Check for repetitive content
        words = message_lower.split()
        if len(set(words)) < len(words) * 0.3:
            score += 0.2
        
        return min(score, 1.0)

# Security decorators
def log_security_event(action, details="", severity="INFO"):
    """Decorator to log security events"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = get_remote_address()
            user_agent = request.headers.get('User-Agent', 'Unknown')
            
            # Log to database
            conn = sqlite3.connect('security.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO security_logs (ip_address, user_agent, action, details, severity)
                VALUES (?, ?, ?, ?, ?)
            ''', (ip, user_agent, action, details, severity))
            conn.commit()
            conn.close()
            
            # Log to file
            app.logger.info(f'{action} from {ip}: {details}')
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_admin(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Admin authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# API Routes
@app.route('/api/contact', methods=['POST'])
@limiter.limit("5 per minute")
@log_security_event("CONTACT_FORM_SUBMISSION")
def contact_form():
    """Secure contact form endpoint with comprehensive validation"""
    try:
        # Get form data
        data = {
            'name': request.form.get('name', ''),
            'email': request.form.get('email', ''),
            'phone': request.form.get('phone', ''),
            'subject': request.form.get('subject', ''),
            'message': request.form.get('message', '')
        }
        
        # Validate and sanitize
        validator = SecurityValidator()
        
        # Name validation
        name = validator.sanitize_input(data['name'], 100)
        if not name or len(name) < 2:
            return jsonify({'error': 'Valid name is required'}), 400
        
        # Email validation
        email = validator.sanitize_input(data['email'], 254)
        if not validator.validate_email(email):
            return jsonify({'error': 'Valid email is required'}), 400
        
        # Phone validation
        phone = validator.sanitize_input(data['phone'], 20)
        if not validator.validate_phone(phone):
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        # Subject validation
        subject = validator.sanitize_input(data['subject'], 200)
        
        # Message validation
        message = validator.sanitize_input(data['message'], 2000)
        if not message or len(message) < 10:
            return jsonify({'error': 'Message must be at least 10 characters'}), 400
        
        # Calculate spam score
        spam_score = validator.calculate_spam_score({
            'message': message,
            'subject': subject,
            'email': email
        })
        
        # Reject high spam scores
        if spam_score > 0.7:
            return jsonify({'error': 'Submission flagged as spam'}), 400
        
        # Save to database
        conn = sqlite3.connect('security.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO contact_submissions 
            (name, email, phone, subject, message, ip_address, user_agent, spam_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            name, email, phone, subject, message,
            get_remote_address(),
            request.headers.get('User-Agent', 'Unknown'),
            spam_score
        ))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully',
            'spam_score': spam_score
        })
        
    except Exception as e:
        app.logger.error(f'Contact form error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/security/health', methods=['GET'])
def security_health():
    """Security health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'csrf_enabled': True,
        'rate_limiting_enabled': True,
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/admin/login', methods=['POST'])
@limiter.limit("3 per minute")
@log_security_event("ADMIN_LOGIN_ATTEMPT")
def admin_login():
    """Secure admin login endpoint"""
    try:
        username = SecurityValidator.sanitize_input(request.form.get('username', ''), 50)
        password = request.form.get('password', '')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Check against database
        conn = sqlite3.connect('security.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id, password_hash, failed_attempts, locked_until FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        if not user:
            # Log failed attempt
            cursor.execute('INSERT INTO security_logs (ip_address, action, details, severity) VALUES (?, ?, ?, ?)',
                         (get_remote_address(), 'LOGIN_FAILED', f'Username: {username}', 'WARNING'))
            conn.commit()
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        user_id, password_hash, failed_attempts, locked_until = user
        
        # Check if account is locked
        if locked_until and datetime.datetime.fromisoformat(locked_until) > datetime.datetime.now():
            return jsonify({'error': 'Account temporarily locked'}), 429
        
        # Verify password
        if check_password_hash(password_hash, password):
            # Successful login
            session['admin_id'] = user_id
            session.permanent = True
            
            # Reset failed attempts
            cursor.execute('UPDATE users SET failed_attempts = 0, last_login = ? WHERE id = ?',
                         (datetime.datetime.now().isoformat(), user_id))
            
            cursor.execute('INSERT INTO security_logs (ip_address, action, details, severity) VALUES (?, ?, ?, ?)',
                         (get_remote_address(), 'LOGIN_SUCCESS', f'Username: {username}', 'INFO'))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            # Failed login
            failed_attempts += 1
            cursor.execute('UPDATE users SET failed_attempts = ? WHERE id = ?', (failed_attempts, user_id))
            
            # Lock account after 5 failed attempts
            if failed_attempts >= 5:
                lock_until = datetime.datetime.now() + datetime.timedelta(minutes=30)
                cursor.execute('UPDATE users SET locked_until = ? WHERE id = ?', (lock_until.isoformat(), user_id))
            
            cursor.execute('INSERT INTO security_logs (ip_address, action, details, severity) VALUES (?, ?, ?, ?)',
                         (get_remote_address(), 'LOGIN_FAILED', f'Username: {username}, Attempts: {failed_attempts}', 'WARNING'))
            
            conn.commit()
            conn.close()
            
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        app.logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/submissions', methods=['GET'])
@require_admin
def get_submissions():
    """Get contact submissions for admin"""
    try:
        conn = sqlite3.connect('security.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, email, phone, subject, message, ip_address, 
                   timestamp, status, spam_score
            FROM contact_submissions 
            ORDER BY timestamp DESC 
            LIMIT 100
        ''')
        
        submissions = []
        for row in cursor.fetchall():
            submissions.append({
                'id': row[0],
                'name': row[1],
                'email': row[2],
                'phone': row[3],
                'subject': row[4],
                'message': row[5],
                'ip_address': row[6],
                'timestamp': row[7],
                'status': row[8],
                'spam_score': row[9]
            })
        
        conn.close()
        
        return jsonify({'submissions': submissions})
        
    except Exception as e:
        app.logger.error(f'Get submissions error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

# Security headers middleware
@app.after_request
def add_security_headers(response):
    """Add comprehensive security headers"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://cdnjs.cloudflare.com; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = (
        'geolocation=(), microphone=(), camera=(), payment=(), usb=(), '
        'magnetometer=(), gyroscope=(), accelerometer=()'
    )
    return response

# Error handlers
@app.errorhandler(429)
def ratelimit_handler(e):
    """Custom rate limit error handler"""
    return jsonify({'error': 'Rate limit exceeded', 'message': str(e.description)}), 429

@app.errorhandler(400)
def bad_request_handler(e):
    """Custom bad request error handler"""
    return jsonify({'error': 'Bad request', 'message': str(e.description)}), 400

@app.errorhandler(500)
def internal_error_handler(e):
    """Custom internal error handler"""
    app.logger.error(f'Internal server error: {str(e)}')
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False, ssl_context='adhoc')
