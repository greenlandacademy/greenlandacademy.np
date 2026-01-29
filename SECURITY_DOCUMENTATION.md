# Greenland Academy Security System Documentation

## Overview

The Greenland Academy Security System is a comprehensive, multi-layered security solution that combines Python backend security with Java-based filters to protect your website from various threats including XSS, SQL injection, CSRF attacks, and DDoS attacks.

## Architecture

### Components

1. **Python Security Backend** (`security_backend.py`)
   - Flask-based REST API with comprehensive security features
   - Rate limiting, CSRF protection, input validation
   - Secure database storage with SQLite
   - Comprehensive logging and monitoring

2. **Java Security Filter** (`SecurityFilter.java`)
   - Servlet filter for additional security layer
   - XSS and SQL injection pattern detection
   - Request validation and sanitization
   - Rate limiting and IP blocking

3. **Security Client** (`security-client.js`)
   - Client-side validation and monitoring
   - CSRF token management
   - Real-time input validation
   - Security event logging

4. **Security Configuration** (`.env`)
   - Environment-specific security settings
   - Database and email configuration
   - Rate limiting and timeout settings

## Features

### 🔒 Input Validation & Sanitization
- **XSS Protection**: Detects and blocks cross-site scripting attempts
- **SQL Injection Prevention**: Identifies and blocks SQL injection patterns
- **Content Validation**: Validates email, phone, and text input formats
- **Spam Detection**: Advanced spam scoring algorithm
- **File Upload Security**: Validates file types and sizes

### 🛡️ CSRF Protection
- **Token-based Protection**: CSRF tokens for all forms
- **Automatic Token Management**: Client-side token fetching and injection
- **Session Security**: Secure session management with timeouts

### ⚡ Rate Limiting
- **Multi-level Limits**: Per-minute, per-hour, and per-day limits
- **IP-based Tracking**: Tracks requests by IP address
- **Automatic Cleanup**: Removes expired rate limit data
- **Configurable Thresholds**: Adjustable limits per endpoint

### 🔍 Security Monitoring
- **Comprehensive Logging**: All security events logged to database and files
- **Real-time Monitoring**: Live security event tracking
- **Alert System**: Email notifications for critical events
- **Dashboard**: Security health monitoring

### 🔐 Authentication & Authorization
- **Secure Login**: Brute-force protection with account lockout
- **Session Management**: Secure session handling with expiration
- **Role-based Access**: Admin-only endpoints for sensitive operations
- **Password Security**: Bcrypt password hashing

### 🌐 Security Headers
- **CSP**: Content Security Policy to prevent XSS
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-type sniffing

## Installation

### Prerequisites
- Python 3.8+
- Java 8+
- OpenSSL
- Web server (Apache/Nginx)

### Quick Start

1. **Clone and Setup**
   ```bash
   cd "c:\Users\hp\OneDrive\Desktop\School website 2"
   chmod +x deploy-security.sh
   ./deploy-security.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your configuration
   ```

3. **Start Security System**
   ```bash
   ./start-security.sh
   ```

4. **Verify Installation**
   ```bash
   ./monitor-security.sh
   ```

## Configuration

### Environment Variables (.env)

```bash
# Flask Configuration
SECRET_KEY=your-super-secret-key-256-bits-long
FLASK_ENV=production

# Database
DATABASE_URL=sqlite:///security.db

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
ADMIN_EMAIL=admin@greenlandacademy.com

# Security Settings
SESSION_TIMEOUT=1800
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_TIME=1800
```

### Security Headers Configuration

```python
# In security_backend.py
response.headers['Content-Security-Policy'] = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: https:; "
    "font-src 'self' https://cdnjs.cloudflare.com; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)
```

## API Endpoints

### Security Health Check
```http
GET /api/security/health
```

### Contact Form (Secure)
```http
POST /api/contact
Content-Type: application/x-www-form-urlencoded
X-CSRF-Token: [token]

name=John+Doe&email=john@example.com&message=Hello
```

### Admin Login
```http
POST /api/admin/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=securepassword
```

### Get Submissions (Admin Only)
```http
GET /api/admin/submissions
Authorization: Bearer [session-token]
```

## Security Rules

### Input Validation Rules

| Field Type | Validation Rules | Max Length |
|------------|------------------|------------|
| Name | Required, alphanumeric + spaces | 100 chars |
| Email | Required, valid format, no suspicious TLDs | 254 chars |
| Phone | Optional, international format | 20 chars |
| Subject | Optional, no XSS patterns | 200 chars |
| Message | Required, min 10 chars, spam detection | 2000 chars |

### Rate Limits

| Endpoint | Per Minute | Per Hour | Per Day |
|----------|------------|----------|---------|
| Contact Form | 5 | 50 | 200 |
| Admin Login | 3 | 20 | 100 |
| General API | 60 | 1000 | 10000 |

### XSS Detection Patterns

```javascript
// Blocked patterns
/<script.*?>.*?<\/script>/gi
/javascript:/gi
/on\w+\s*=/gi
/eval\(/gi
/expression\(/gi
/vbscript:/gi
/onload\s*=/gi
/<iframe.*?>.*?<\/iframe>/gi
```

### SQL Injection Detection Patterns

```java
// Blocked patterns
(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute)\s
(?i)(or|and)\s+\d+\s*=\s*\d+
(?i)(--|#|/\*|\*/|;|')
(?i)(xp_|sp_)
(?i)(waitfor\s+delay|benchmark\s*\()
(?i)(convert\s*\(|cast\s*\()
```

## Monitoring & Logging

### Log Levels
- **INFO**: Normal operations
- **WARNING**: Suspicious activity
- **ERROR**: Security violations
- **CRITICAL**: Attack attempts

### Log Format
```
[2024-01-29 12:34:56] WARNING - 192.168.1.100 - XSS_ATTEMPT - <script>alert('xss')</script>
```

### Monitoring Commands

```bash
# Check system status
./monitor-security.sh

# View recent security events
tail -f logs/security.log

# Check database
sqlite3 security.db "SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 10;"
```

## Security Best Practices

### 1. Regular Updates
- Update Python dependencies monthly
- Apply security patches promptly
- Monitor vulnerability databases

### 2. Password Security
- Use strong, unique passwords
- Enable two-factor authentication
- Change passwords regularly

### 3. SSL/TLS Configuration
- Use valid SSL certificates
- Enable HSTS headers
- Disable weak cipher suites

### 4. Database Security
- Regular database backups
- Encrypt sensitive data
- Limit database access

### 5. Monitoring
- Review security logs daily
- Set up alert notifications
- Monitor for unusual patterns

## Troubleshooting

### Common Issues

#### 1. CSRF Token Errors
```bash
# Check CSRF token endpoint
curl -X GET https://yourdomain.com/api/csrf-token

# Clear browser cache and cookies
```

#### 2. Rate Limit Exceeded
```bash
# Check rate limit status
sqlite3 security.db "SELECT * FROM rate_limits WHERE ip_address = 'your-ip';"

# Clear rate limits (emergency only)
sqlite3 security.db "DELETE FROM rate_limits;"
```

#### 3. Database Connection Issues
```bash
# Check database permissions
ls -la security.db

# Reinitialize database
python3 -c "from security_backend import init_db; init_db()"
```

#### 4. SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in ssl/cert.pem -noout -enddate

# Generate new certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);
CREATE INDEX idx_contact_submissions_timestamp ON contact_submissions(timestamp);
```

### Caching
```python
# Redis configuration for rate limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Load Balancing
```nginx
# Nginx configuration
upstream security_backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
}
```

## Emergency Procedures

### 1. Under Attack
```bash
# Block malicious IP
iptables -A INPUT -s MALICIOUS_IP -j DROP

# Clear rate limits
sqlite3 security.db "DELETE FROM rate_limits;"

# Restart security service
sudo systemctl restart greenland-security
```

### 2. Data Breach
```bash
# Create backup
./backup-security.sh

# Change all secrets
openssl rand -hex 32  # New SECRET_KEY
# Update .env file

# Force logout all users
sqlite3 security.db "DELETE FROM sessions;"
```

### 3. System Recovery
```bash
# Restore from backup
cp backups/TIMESTAMP/security.db ./
cp backups/TIMESTAMP/.env ./

# Restart services
./start-security.sh
```

## Support & Maintenance

### Regular Tasks
- **Daily**: Review security logs
- **Weekly**: Update dependencies
- **Monthly**: SSL certificate check
- **Quarterly**: Security audit

### Contact Information
- **Security Team**: security@greenlandacademy.com
- **Emergency**: +977-XXXX-XXXXXX

### Resources
- [OWASP Security Guidelines](https://owasp.org/)
- [Python Security Best Practices](https://docs.python.org/3/security/)
- [Java Security Documentation](https://docs.oracle.com/javase/8/security/)

---

**Version**: 1.0.0  
**Last Updated**: January 29, 2026  
**Maintained by**: Greenland Academy Security Team
