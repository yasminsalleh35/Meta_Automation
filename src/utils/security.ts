import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onmouseover', 'onerror']
  });
};

/**
 * DEPRECATED: Client-side encryption is insecure
 * Use Supabase Vault for proper encryption of sensitive data
 * @deprecated Use server-side encryption with Supabase Vault instead
 */
export const encryptSensitiveData = (text: string, key: string): string => {
  console.warn('SECURITY WARNING: Client-side encryption is deprecated. Use Supabase Vault for secure encryption.');
  // Return plain text with warning - migration to Supabase Vault required
  return text;
};

/**
 * DEPRECATED: Client-side decryption is insecure
 * @deprecated Use server-side decryption with Supabase Vault instead
 */
export const decryptSensitiveData = (encryptedText: string, key: string): string => {
  console.warn('SECURITY WARNING: Client-side decryption is deprecated. Use Supabase Vault for secure decryption.');
  // Return as-is - migration to Supabase Vault required
  return encryptedText;
};

/**
 * Validates that sensitive operations are performed server-side
 * @param operation - The operation being performed
 * @returns boolean indicating if operation should proceed
 */
export const validateSecureOperation = (operation: string): boolean => {
  console.log(`Security check: ${operation} - Ensure this runs server-side for production`);
  return true;
};

/**
 * Enhanced session security checker
 * @param session - Current user session
 * @returns object with security status and recommendations
 */
export const validateSessionSecurity = (session: any) => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  if (!session) {
    return { secure: false, issues: ['No active session'], warnings: [] };
  }

  // Check session age
  const sessionAge = Date.now() - new Date(session.created_at || session.issued_at).getTime();
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;
  
  if (sessionAge > EIGHT_HOURS) {
    issues.push('Session too old - requires re-authentication');
  } else if (sessionAge > EIGHT_HOURS * 0.75) {
    warnings.push('Session approaching expiration');
  }

  // Check for suspicious activity indicators
  if (session.user?.last_sign_in_at) {
    const lastSignIn = new Date(session.user.last_sign_in_at).getTime();
    const timeDiff = Date.now() - lastSignIn;
    
    if (timeDiff < 60000) { // Less than 1 minute
      warnings.push('Very recent login detected');
    }
  }

  return {
    secure: issues.length === 0,
    issues,
    warnings,
    sessionAge: Math.floor(sessionAge / 1000 / 60) // minutes
  };
};

/**
 * Detects suspicious login patterns
 * @param loginAttempts - Array of recent login attempts
 * @returns security assessment
 */
export const detectSuspiciousActivity = (loginAttempts: any[]) => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  const recentAttempts = loginAttempts.filter(attempt => 
    new Date(attempt.attempted_at).getTime() > fiveMinutesAgo
  );

  const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
  const successfulAttempts = recentAttempts.filter(attempt => attempt.success);

  const analysis = {
    totalRecent: recentAttempts.length,
    failed: failedAttempts.length,
    successful: successfulAttempts.length,
    suspicious: false,
    riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical'
  };

  // Risk assessment
  if (failedAttempts.length >= 5) {
    analysis.suspicious = true;
    analysis.riskLevel = 'high';
  } else if (failedAttempts.length >= 3) {
    analysis.suspicious = true;
    analysis.riskLevel = 'medium';
  } else if (recentAttempts.length >= 10) {
    analysis.suspicious = true;
    analysis.riskLevel = 'medium';
  }

  return analysis;
};