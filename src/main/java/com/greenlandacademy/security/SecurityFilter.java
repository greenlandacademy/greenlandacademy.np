package com.greenlandacademy.security;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Comprehensive Java Security Filter for Greenland Academy
 * Provides XSS protection, SQL injection prevention, rate limiting, and input validation
 */

@WebFilter("/*")
public class SecurityFilter implements Filter {
    
    // Rate limiting storage
    private static final Map<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_REQUESTS_PER_HOUR = 1000;
    
    // Security patterns
    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile("<script.*?>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("on\\w+\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("eval\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("expression\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onload\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<iframe.*?>.*?</iframe>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("<object.*?>.*?</object>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
        Pattern.compile("<embed.*?>.*?</embed>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL)
    };
    
    private static final Pattern[] SQL_INJECTION_PATTERNS = {
        Pattern.compile("(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute)\\s"),
        Pattern.compile("(?i)(or|and)\\s+\\d+\\s*=\\s*\\d+"),
        Pattern.compile("(?i)(or|and)\\s+'[^']*'\\s*=\\s*'[^']*'"),
        Pattern.compile("(?i)(--|#|/\\*|\\*/|;|')"),
        Pattern.compile("(?i)(xp_|sp_)"),
        Pattern.compile("(?i)(waitfor\\s+delay|benchmark\\s*\\()"),
        Pattern.compile("(?i)(convert\\s*\\(|cast\\s*\\()")
    };
    
    private static final Pattern[] SUSPICIOUS_PATTERNS = {
        Pattern.compile("(?i)(viagra|cialis|lottery|winner|free\\s+money|click\\s+here|limited\\s+offer)"),
        Pattern.compile("(?i)(congratulations|you\\s+have\\s+won|claim\\s+now)"),
        Pattern.compile("(?i)(http[s]?://){3,}"),  // Too many URLs
        Pattern.compile("(?i)\\b[A-Z]{10,}\\b"),   // Excessive capitalization
        Pattern.compile("(?i)(.{2,})\\1{3,}")     // Repetitive content
    };
    
    // Allowed file extensions
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
        "jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt", "css", "js", "ico", "svg"
    ));
    
    // Trusted domains
    private static final Set<String> TRUSTED_DOMAINS = new HashSet<>(Arrays.asList(
        "greenlandacademy.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com"
    ));
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("SecurityFilter initialized - Greenland Academy Security System");
    }
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIP = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String requestURI = httpRequest.getRequestURI();
        
        try {
            // 1. Rate limiting check
            if (!checkRateLimit(clientIP, requestURI)) {
                httpResponse.setStatus(429);
                httpResponse.getWriter().write("{\"error\":\"Rate limit exceeded\"}");
                logSecurityEvent(clientIP, "RATE_LIMIT_EXCEEDED", requestURI, "WARNING");
                return;
            }
            
            // 2. Basic request validation
            if (!isValidRequest(httpRequest)) {
                httpResponse.setStatus(400);
                httpResponse.getWriter().write("{\"error\":\"Invalid request\"}");
                logSecurityEvent(clientIP, "INVALID_REQUEST", requestURI, "WARNING");
                return;
            }
            
            // 3. Add security headers
            addSecurityHeaders(httpResponse);
            
            // 4. Validate and sanitize parameters
            if (!validateAndSanitizeParameters(httpRequest)) {
                httpResponse.setStatus(400);
                httpResponse.getWriter().write("{\"error\":\"Invalid input detected\"}");
                logSecurityEvent(clientIP, "INVALID_INPUT", requestURI, "WARNING");
                return;
            }
            
            // 5. Check for suspicious patterns
            if (containsSuspiciousContent(httpRequest)) {
                httpResponse.setStatus(400);
                httpResponse.getWriter().write("{\"error\":\"Suspicious content detected\"}");
                logSecurityEvent(clientIP, "SUSPICIOUS_CONTENT", requestURI, "WARNING");
                return;
            }
            
            // 6. Validate file uploads if any
            if (!validateFileUploads(httpRequest)) {
                httpResponse.setStatus(400);
                httpResponse.getWriter().write("{\"error\":\"Invalid file upload\"}");
                logSecurityEvent(clientIP, "INVALID_FILE_UPLOAD", requestURI, "WARNING");
                return;
            }
            
            // Log legitimate requests
            logSecurityEvent(clientIP, "REQUEST_ALLOWED", requestURI, "INFO");
            
            // Continue with the request
            chain.doFilter(new SecurityRequestWrapper(httpRequest), response);
            
        } catch (Exception e) {
            System.err.println("Security filter error: " + e.getMessage());
            httpResponse.setStatus(500);
            httpResponse.getWriter().write("{\"error\":\"Internal security error\"}");
            logSecurityEvent(clientIP, "SECURITY_ERROR", requestURI + " - " + e.getMessage(), "ERROR");
        }
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }
    
    private boolean checkRateLimit(String clientIP, String requestURI) {
        LocalDateTime now = LocalDateTime.now();
        RateLimitInfo rateLimitInfo = rateLimitMap.computeIfAbsent(clientIP, k -> new RateLimitInfo());
        
        // Clean old entries
        rateLimitInfo.cleanup(now);
        
        // Check minute limit
        if (rateLimitInfo.getMinuteCount() >= MAX_REQUESTS_PER_MINUTE) {
            return false;
        }
        
        // Check hour limit
        if (rateLimitInfo.getHourCount() >= MAX_REQUESTS_PER_HOUR) {
            return false;
        }
        
        // Increment counters
        rateLimitInfo.addRequest(now);
        return true;
    }
    
    private boolean isValidRequest(HttpServletRequest request) {
        String method = request.getMethod();
        String requestURI = request.getRequestURI();
        
        // Check HTTP method
        if (!Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD").contains(method)) {
            return false;
        }
        
        // Check request URI length
        if (requestURI.length() > 2048) {
            return false;
        }
        
        // Check for null bytes
        if (requestURI.contains("\0") || request.getQueryString() != null && request.getQueryString().contains("\0")) {
            return false;
        }
        
        // Check for path traversal
        if (requestURI.contains("../") || requestURI.contains("..\\")) {
            return false;
        }
        
        return true;
    }
    
    private void addSecurityHeaders(HttpServletResponse response) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' https://cdnjs.cloudflare.com; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'"
        );
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", 
            "geolocation=(), microphone=(), camera=(), payment=(), usb=(), " +
            "magnetometer=(), gyroscope=(), accelerometer=()"
        );
    }
    
    private boolean validateAndSanitizeParameters(HttpServletRequest request) {
        Enumeration<String> parameterNames = request.getParameterNames();
        
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String[] paramValues = request.getParameterValues(paramName);
            
            for (String paramValue : paramValues) {
                if (paramValue == null) continue;
                
                // Check for XSS
                for (Pattern pattern : XSS_PATTERNS) {
                    if (pattern.matcher(paramValue).find()) {
                        return false;
                    }
                }
                
                // Check for SQL injection
                for (Pattern pattern : SQL_INJECTION_PATTERNS) {
                    if (pattern.matcher(paramValue).find()) {
                        return false;
                    }
                }
                
                // Check parameter length
                if (paramValue.length() > 10000) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    private boolean containsSuspiciousContent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String referer = request.getHeader("Referer");
        
        // Check User-Agent
        if (userAgent != null) {
            for (Pattern pattern : SUSPICIOUS_PATTERNS) {
                if (pattern.matcher(userAgent).find()) {
                    return true;
                }
            }
        }
        
        // Check Referer
        if (referer != null && !isValidReferer(referer)) {
            return true;
        }
        
        // Check parameters for spam patterns
        Enumeration<String> parameterNames = request.getParameterNames();
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String[] paramValues = request.getParameterValues(paramName);
            
            for (String paramValue : paramValues) {
                if (paramValue == null) continue;
                
                for (Pattern pattern : SUSPICIOUS_PATTERNS) {
                    if (pattern.matcher(paramValue).find()) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    private boolean isValidReferer(String referer) {
        try {
            java.net.URL url = new java.net.URL(referer);
            String domain = url.getHost();
            
            // Allow same domain and trusted domains
            return domain.endsWith("greenlandacademy.com") || TRUSTED_DOMAINS.contains(domain);
        } catch (Exception e) {
            return false;
        }
    }
    
    private boolean validateFileUploads(HttpServletRequest request) {
        String contentType = request.getContentType();
        
        if (contentType != null && contentType.startsWith("multipart/form-data")) {
            // This is a simplified check - in a real implementation, you'd need to
            // parse the multipart request and check each file
            return true; // For now, allow multipart requests
        }
        
        return true;
    }
    
    private void logSecurityEvent(String clientIP, String event, String details, String severity) {
        String logEntry = String.format("[%s] %s - %s - %s - %s%n",
            LocalDateTime.now(), severity, clientIP, event, details);
        
        try {
            java.io.FileWriter writer = new java.io.FileWriter("security.log", true);
            writer.write(logEntry);
            writer.close();
        } catch (IOException e) {
            System.err.println("Failed to write security log: " + e.getMessage());
        }
        
        // Also print to console for immediate visibility
        System.out.print(logEntry);
    }
    
    @Override
    public void destroy() {
        System.out.println("SecurityFilter destroyed");
    }
    
    // Helper class for rate limiting
    private static class RateLimitInfo {
        private Queue<LocalDateTime> minuteRequests = new LinkedList<>();
        private Queue<LocalDateTime> hourRequests = new LinkedList<>();
        
        public void addRequest(LocalDateTime now) {
            minuteRequests.add(now);
            hourRequests.add(now);
        }
        
        public void cleanup(LocalDateTime now) {
            // Remove requests older than 1 minute
            while (!minuteRequests.isEmpty() && 
                   ChronoUnit.MINUTES.between(minuteRequests.peek(), now) > 1) {
                minuteRequests.poll();
            }
            
            // Remove requests older than 1 hour
            while (!hourRequests.isEmpty() && 
                   ChronoUnit.HOURS.between(hourRequests.peek(), now) > 1) {
                hourRequests.poll();
            }
        }
        
        public int getMinuteCount() {
            return minuteRequests.size();
        }
        
        public int getHourCount() {
            return hourRequests.size();
        }
    }
}
