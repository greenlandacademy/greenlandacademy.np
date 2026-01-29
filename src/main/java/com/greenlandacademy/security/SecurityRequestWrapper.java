package com.greenlandacademy.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.util.HashMap;
import java.util.Map;

/**
 * Secure Request Wrapper for additional input sanitization
 * Wraps HttpServletRequest to provide clean, sanitized input
 */

public class SecurityRequestWrapper extends HttpServletRequestWrapper {
    
    private Map<String, String[]> sanitizedParameters = new HashMap<>();
    
    public SecurityRequestWrapper(HttpServletRequest request) {
        super(request);
        sanitizeAllParameters();
    }
    
    private void sanitizeAllParameters() {
        java.util.Enumeration<String> parameterNames = super.getParameterNames();
        
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String[] originalValues = super.getParameterValues(paramName);
            String[] sanitizedValues = new String[originalValues.length];
            
            for (int i = 0; i < originalValues.length; i++) {
                sanitizedValues[i] = sanitizeInput(originalValues[i]);
            }
            
            sanitizedParameters.put(paramName, sanitizedValues);
        }
    }
    
    private String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        
        // Remove null bytes
        String sanitized = input.replace("\0", "");
        
        // Remove potential script content
        sanitized = sanitized.replaceAll("(?i)<script.*?</script>", "");
        sanitized = sanitized.replaceAll("(?i)javascript:", "");
        sanitized = sanitized.replaceAll("(?i)on\\w+\\s*=", "");
        
        // Remove SQL injection patterns
        sanitized = sanitized.replaceAll("(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute)\\s", "");
        sanitized = sanitized.replaceAll("(?i)(--|#|/\\*|\\*/|;|')", "");
        
        // Remove excessive whitespace
        sanitized = sanitized.replaceAll("\\s+", " ").trim();
        
        // Limit length
        if (sanitized.length() > 10000) {
            sanitized = sanitized.substring(0, 10000);
        }
        
        return sanitized;
    }
    
    @Override
    public String getParameter(String name) {
        String[] values = sanitizedParameters.get(name);
        return (values != null && values.length > 0) ? values[0] : null;
    }
    
    @Override
    public String[] getParameterValues(String name) {
        return sanitizedParameters.get(name);
    }
    
    @Override
    public java.util.Map<String, String[]> getParameterMap() {
        return new HashMap<>(sanitizedParameters);
    }
    
    @Override
    public java.util.Enumeration<String> getParameterNames() {
        return java.util.Collections.enumeration(sanitizedParameters.keySet());
    }
}
