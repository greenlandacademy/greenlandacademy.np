#!/bin/bash

# Greenland Academy Security Deployment Script
# Deploys the comprehensive security system with Python and Java components

set -e

echo "🚀 Starting Greenland Academy Security Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root (for production deployment)
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Consider using a non-root user for security."
fi

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups
mkdir -p ssl
mkdir -p config

# Set proper permissions
chmod 755 logs uploads backups ssl config
chmod 600 .env 2>/dev/null || true

# Check Python installation
print_status "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_status "Found Python version: $PYTHON_VERSION"

# Check Java installation
print_status "Checking Java installation..."
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 8 or higher."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
print_status "Found Java version: $JAVA_VERSION"

# Install Python dependencies
print_status "Installing Python dependencies..."
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
else
    print_error "pip3 is not installed. Please install pip3."
    exit 1
fi

# Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before proceeding."
    print_warning "Run: nano .env"
    read -p "Press Enter after configuring .env file..."
fi

# Generate SSL certificates (self-signed for development)
print_status "Generating SSL certificates..."
if [ ! -f ssl/cert.pem ]; then
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=NP/ST=Province1/L=Itahari/O=Greenland Academy/CN=greenlandacademy.com"
    print_status "SSL certificates generated in ssl/ directory"
fi

# Initialize database
print_status "Initializing security database..."
python3 -c "
import sys
sys.path.append('.')
from security_backend import init_db
init_db()
print('Database initialized successfully')
"

# Compile Java components (if Maven is available)
print_status "Checking Java build tools..."
if command -v mvn &> /dev/null; then
    print_status "Maven found. Compiling Java components..."
    if [ -f pom.xml ]; then
        mvn clean compile package
    else
        print_warning "No pom.xml found. Skipping Java compilation."
    fi
elif command -v javac &> /dev/null; then
    print_status "Compiling Java files manually..."
    mkdir -p build/classes
    find src/main/java -name "*.java" -exec javac -d build/classes {} \;
    print_status "Java files compiled to build/classes/"
else
    print_warning "No Java compiler found. Java security filters will not be compiled."
fi

# Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/greenland-security 2>/dev/null << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Create systemd service file for Python backend
print_status "Creating systemd service..."
SERVICE_CONTENT="[Unit]
Description=Greenland Academy Security Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(which python3) $(pwd)/security_backend.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_CONTENT" | sudo tee /etc/systemd/system/greenland-security.service > /dev/null

# Create startup script
print_status "Creating startup script..."
cat > start-security.sh << 'EOF'
#!/bin/bash

# Greenland Academy Security Startup Script

echo "Starting Greenland Academy Security System..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start Python backend
echo "Starting Python security backend..."
python3 security_backend.py &
PYTHON_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if ps -p $PYTHON_PID > /dev/null; then
    echo "✅ Python security backend started (PID: $PYTHON_PID)"
else
    echo "❌ Failed to start Python security backend"
    exit 1
fi

echo "🚀 Greenland Academy Security System is now running!"
echo "📊 Security dashboard: https://localhost:5000/api/security/health"
echo "📝 Logs are being written to logs/security.log"

# Keep script running
wait $PYTHON_PID
EOF

chmod +x start-security.sh

# Create monitoring script
print_status "Creating monitoring script..."
cat > monitor-security.sh << 'EOF'
#!/bin/bash

# Greenland Academy Security Monitoring Script

echo "🔍 Greenland Academy Security Monitor"
echo "=================================="

# Check if security backend is running
if pgrep -f "security_backend.py" > /dev/null; then
    echo "✅ Python security backend is running"
else
    echo "❌ Python security backend is not running"
fi

# Check log file size
if [ -f "logs/security.log" ]; then
    LOG_SIZE=$(du -h logs/security.log | cut -f1)
    echo "📝 Security log size: $LOG_SIZE"
    
    # Show recent security events
    echo ""
    echo "📊 Recent Security Events:"
    tail -n 5 logs/security.log | while read line; do
        echo "  $line"
    done
else
    echo "❌ Security log file not found"
fi

# Check SSL certificates
if [ -f "ssl/cert.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -in ssl/cert.pem -noout -enddate | cut -d= -f2)
    echo "🔐 SSL certificate expires: $CERT_EXPIRY"
else
    echo "❌ SSL certificate not found"
fi

# Check database
if [ -f "security.db" ]; then
    DB_SIZE=$(du -h security.db | cut -f1)
    echo "💾 Database size: $DB_SIZE"
else
    echo "❌ Database not found"
fi

echo ""
echo "🚀 To start the security system, run: ./start-security.sh"
EOF

chmod +x monitor-security.sh

# Create backup script
print_status "Creating backup script..."
cat > backup-security.sh << 'EOF'
#!/bin/bash

# Greenland Academy Security Backup Script

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating security backup..."

# Backup database
if [ -f "security.db" ]; then
    cp security.db "$BACKUP_DIR/"
    echo "✅ Database backed up"
fi

# Backup configuration
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/"
    echo "✅ Configuration backed up"
fi

# Backup SSL certificates
if [ -d "ssl" ]; then
    cp -r ssl "$BACKUP_DIR/"
    echo "✅ SSL certificates backed up"
fi

# Backup logs
if [ -d "logs" ]; then
    cp -r logs "$BACKUP_DIR/"
    echo "✅ Logs backed up"
fi

# Create backup info
cat > "$BACKUP_DIR/backup_info.txt" << BACKUP_INFO
Backup created: $(date)
System: Greenland Academy Security
Python version: $(python3 --version)
Java version: $(java -version 2>&1 | head -n 1)
BACKUP_INFO

echo "🎉 Backup completed: $BACKUP_DIR"
echo "💡 To restore, copy files from backup directory to main directory"
EOF

chmod +x backup-security.sh

# Security hardening
print_status "Applying security hardening..."

# Set secure file permissions
chmod 600 .env 2>/dev/null || true
chmod 600 ssl/key.pem 2>/dev/null || true
chmod 644 ssl/cert.pem 2>/dev/null || true
chmod 755 *.sh

# Remove sensitive files from web root
find . -name "*.log" -exec chmod 600 {} \; 2>/dev/null || true
find . -name "*.db" -exec chmod 600 {} \; 2>/dev/null || true

# Create .htaccess for additional security
cat > .htaccess << 'EOF'
# Greenland Academy Security .htaccess

# Prevent directory listing
Options -Indexes

# Block access to sensitive files
<FilesMatch "\.(env|log|db|key|pem)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Block access to backup directories
<Directory "backups">
    Order allow,deny
    Deny from all
</Directory>

# Block access to SSL directory
<Directory "ssl">
    Order allow,deny
    Deny from all
</Directory>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Hide server signature
ServerTokens Prod
ServerSignature Off
EOF

# Final status
print_status "🎉 Security deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run ./start-security.sh to start the security system"
echo "3. Run ./monitor-security.sh to monitor system status"
echo "4. Run ./backup-security.sh to create backups"
echo ""
echo "🔗 Important URLs:"
echo "- Security Health: https://localhost:5000/api/security/health"
echo "- Contact Form: https://localhost:5000/api/contact"
echo ""
echo "📁 Important Files:"
echo "- Configuration: .env"
echo "- Logs: logs/security.log"
echo "- Database: security.db"
echo "- SSL Certificates: ssl/"
echo ""
echo "⚠️  Security Reminders:"
echo "- Change default passwords and secrets"
echo "- Keep SSL certificates valid"
echo "- Regularly check security logs"
echo "- Update dependencies regularly"
echo "- Monitor for suspicious activity"

# Enable and start systemd service if available
if command -v systemctl &> /dev/null; then
    print_status "Enabling systemd service..."
    sudo systemctl daemon-reload
    sudo systemctl enable greenland-security.service
    print_warning "To start the service: sudo systemctl start greenland-security"
    print_warning "To check status: sudo systemctl status greenland-security"
fi

echo ""
print_status "🚀 Greenland Academy Security System is ready!"
