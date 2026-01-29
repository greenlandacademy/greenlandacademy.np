/**
 * Greenland Academy Security Client
 * Client-side security validation, CSRF protection, and secure form handling
 */

class SecurityClient {
    constructor() {
        this.csrfToken = null;
        this.rateLimitData = new Map();
        this.init();
    }

    async init() {
        await this.fetchCSRFToken();
        this.setupSecurityHeaders();
        this.setupFormValidation();
        this.setupRateLimiting();
        this.setupSecurityMonitoring();
    }

    async fetchCSRFToken() {
        try {
            const response = await fetch('/api/csrf-token');
            const data = await response.json();
            this.csrfToken = data.csrf_token;
            
            // Add CSRF token to all forms
            document.querySelectorAll('form').forEach(form => {
                if (!form.querySelector('input[name="csrf_token"]')) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = 'csrf_token';
                    csrfInput.value = this.csrfToken;
                    form.appendChild(csrfInput);
                }
            });
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
    }

    setupSecurityHeaders() {
        // Add security headers to all fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            
            options.headers = {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': this.csrfToken,
                'Content-Security-Policy': "default-src 'self'"
            };
            
            return originalFetch(url, options);
        };
    }

    setupFormValidation() {
        // Enhanced form validation
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => this.validateForm(e));
        });

        // Real-time input validation
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', (e) => this.validateInput(e.target));
            input.addEventListener('blur', (e) => this.validateInput(e.target));
        });
    }

    validateForm(event) {
        const form = event.target;
        let isValid = true;
        const errors = [];

        // Validate each field
        form.querySelectorAll('input, textarea, select').forEach(field => {
            const fieldErrors = this.validateField(field);
            if (fieldErrors.length > 0) {
                isValid = false;
                errors.push(...fieldErrors);
                this.showFieldError(field, fieldErrors[0]);
            } else {
                this.clearFieldError(field);
            }
        });

        // Check for suspicious patterns
        const suspiciousContent = this.detectSuspiciousContent(form);
        if (suspiciousContent.length > 0) {
            isValid = false;
            errors.push('Suspicious content detected');
            this.showFormError(form, 'Suspicious content detected. Please remove any potentially harmful content.');
        }

        // Check rate limiting
        if (!this.checkFormRateLimit(form)) {
            isValid = false;
            errors.push('Rate limit exceeded');
            this.showFormError(form, 'Please wait before submitting this form again.');
        }

        if (!isValid) {
            event.preventDefault();
            this.logSecurityEvent('FORM_VALIDATION_FAILED', errors.join(', '));
        }

        return isValid;
    }

    validateField(field) {
        const errors = [];
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        // Required field validation
        if (field.required && !value) {
            errors.push(`${this.getFieldLabel(name)} is required`);
            return errors;
        }

        // Type-specific validation
        switch (type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    errors.push('Invalid email format');
                }
                break;
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    errors.push('Invalid phone number format');
                }
                break;
            case 'text':
                if (value) {
                    if (value.length < 2) {
                        errors.push(`${this.getFieldLabel(name)} must be at least 2 characters`);
                    }
                    if (value.length > 100) {
                        errors.push(`${this.getFieldLabel(name)} must be less than 100 characters`);
                    }
                    if (this.containsXSS(value)) {
                        errors.push('Invalid characters detected');
                    }
                }
                break;
            case 'textarea':
                if (value) {
                    if (value.length < 10) {
                        errors.push('Message must be at least 10 characters');
                    }
                    if (value.length > 2000) {
                        errors.push('Message must be less than 2000 characters');
                    }
                    if (this.calculateSpamScore(value) > 0.7) {
                        errors.push('Content appears to be spam');
                    }
                }
                break;
        }

        return errors;
    }

    validateInput(input) {
        const errors = this.validateField(input);
        if (errors.length > 0) {
            this.showFieldError(input, errors[0]);
        } else {
            this.clearFieldError(input);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        // Additional security checks
        const suspiciousPatterns = [
            /\.ru$/, /\.cn$/, /\.tk$/,  // Suspicious TLDs
            /\d{5,}/,  // Too many numbers
            /[<>"']/,  // HTML characters
        ];
        
        return !suspiciousPatterns.some(pattern => pattern.test(email.toLowerCase()));
    }

    isValidPhone(phone) {
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 15;
    }

    containsXSS(content) {
        const xssPatterns = [
            /<script.*?>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\(/gi,
            /expression\(/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /<iframe.*?>.*?<\/iframe>/gi
        ];
        
        return xssPatterns.some(pattern => pattern.test(content));
    }

    calculateSpamScore(content) {
        let score = 0;
        const contentLower = content.toLowerCase();
        
        // Spam keywords
        const spamKeywords = [
            'viagra', 'cialis', 'lottery', 'winner', 'free money',
            'click here', 'limited offer', 'act now', 'congratulations'
        ];
        
        spamKeywords.forEach(keyword => {
            if (contentLower.includes(keyword)) score += 0.2;
        });
        
        // Excessive links
        const urlCount = (contentLower.match(/https?:\/\//g) || []).length;
        score += Math.min(urlCount * 0.1, 0.3);
        
        // Excessive capitalization
        const upperCount = (content.match(/[A-Z]/g) || []).length;
        if (upperCount > content.length * 0.5) score += 0.2;
        
        // Repetitive content
        const words = contentLower.split(/\s+/);
        const uniqueWords = new Set(words);
        if (uniqueWords.size < words.length * 0.3) score += 0.2;
        
        return Math.min(score, 1.0);
    }

    detectSuspiciousContent(form) {
        const suspicious = [];
        const formData = new FormData(form);
        
        for (let [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                if (this.containsXSS(value)) {
                    suspicious.push(`XSS detected in ${key}`);
                }
                if (this.calculateSpamScore(value) > 0.7) {
                    suspicious.push(`Spam detected in ${key}`);
                }
            }
        }
        
        return suspicious;
    }

    setupRateLimiting() {
        // Form submission rate limiting
        setInterval(() => {
            this.cleanupRateLimitData();
        }, 60000); // Clean up every minute
    }

    checkFormRateLimit(form) {
        const formId = form.id || 'unknown';
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window
        
        if (!this.rateLimitData.has(formId)) {
            this.rateLimitData.set(formId, []);
        }
        
        const submissions = this.rateLimitData.get(formId);
        
        // Remove old submissions
        const recentSubmissions = submissions.filter(timestamp => timestamp > windowStart);
        
        // Check limit (max 5 submissions per minute)
        if (recentSubmissions.length >= 5) {
            return false;
        }
        
        // Add current submission
        recentSubmissions.push(now);
        this.rateLimitData.set(formId, recentSubmissions);
        
        return true;
    }

    cleanupRateLimitData() {
        const now = Date.now();
        const windowStart = now - 60000;
        
        for (let [formId, submissions] of this.rateLimitData.entries()) {
            const recentSubmissions = submissions.filter(timestamp => timestamp > windowStart);
            if (recentSubmissions.length === 0) {
                this.rateLimitData.delete(formId);
            } else {
                this.rateLimitData.set(formId, recentSubmissions);
            }
        }
    }

    setupSecurityMonitoring() {
        // Monitor for suspicious activity
        document.addEventListener('keydown', (e) => {
            // Detect potential keyboard shortcuts for developer tools
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                this.logSecurityEvent('DEV_TOOLS_ATTEMPT', 'Developer tools shortcut detected');
            }
        });

        // Monitor for copy/paste in sensitive fields
        document.querySelectorAll('input[type="password"], input[type="email"]').forEach(field => {
            field.addEventListener('paste', (e) => {
                this.logSecurityEvent('SENSITIVE_FIELD_PASTE', `Paste detected in ${field.name}`);
            });
        });

        // Monitor for right-click attempts
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG') {
                this.logSecurityEvent('IMAGE_RIGHT_CLICK', 'Right-click on image detected');
            }
        });
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('border-red-500', 'focus:ring-red-500');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1 field-error';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('border-red-500', 'focus:ring-red-500');
        
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    showFormError(form, message) {
        this.clearFormError(form);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 form-error';
        errorDiv.textContent = message;
        
        form.insertBefore(errorDiv, form.firstChild);
    }

    clearFormError(form) {
        const errorDiv = form.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    getFieldLabel(fieldName) {
        const labels = {
            'name': 'Name',
            'email': 'Email',
            'phone': 'Phone',
            'subject': 'Subject',
            'message': 'Message'
        };
        
        return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }

    logSecurityEvent(event, details) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Send to server for logging
        fetch('/api/security/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.csrfToken
            },
            body: JSON.stringify(logData)
        }).catch(error => {
            console.error('Failed to log security event:', error);
        });
        
        // Also log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('Security Event:', logData);
        }
    }

    // Public method for external form validation
    validateAndSubmitForm(event) {
        return this.validateForm(event);
    }
}

// Initialize security client when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.securityClient = new SecurityClient();
});

// Global function for form validation (accessible from HTML)
function validateAndSubmitForm(event) {
    if (window.securityClient) {
        return window.securityClient.validateAndSubmitForm(event);
    }
    return true;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityClient;
}
