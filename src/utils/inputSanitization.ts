import DOMPurify from 'dompurify';

/**
 * Comprehensive input sanitization utilities for security
 */

export const sanitizeInput = {
  /**
   * Sanitize HTML content to prevent XSS attacks with enhanced security
   */
  html: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'link'],
      FORBID_ATTR: ['onclick', 'onload', 'onmouseover', 'onerror', 'javascript:', 'vbscript:', 'data:']
    });
  },

  /**
   * Sanitize plain text input with enhanced security
   */
  text: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    // Remove HTML tags, control characters, and suspicious patterns
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/javascript:/gi, '')     // Remove javascript: protocol
      .replace(/vbscript:/gi, '')      // Remove vbscript: protocol
      .replace(/data:/gi, '')          // Remove data: protocol
      .trim()
      .slice(0, 10000); // Limit length to prevent DoS
  },

  /**
   * Sanitize and validate email input with enhanced security
   */
  email: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    const cleaned = input.toLowerCase().trim();
    // Enhanced email validation to prevent injection
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(cleaned) && cleaned.length <= 254 ? cleaned : '';
  },

  /**
   * Sanitize phone number with enhanced validation
   */
  phone: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    // Only allow digits, spaces, and common phone symbols
    const cleaned = input.replace(/[^0-9\s\-\(\)\+]/g, '').trim();
    // Limit length and ensure it's not empty after cleaning
    return cleaned.length >= 10 && cleaned.length <= 20 ? cleaned : '';
  },

  /**
   * Sanitize URL input with enhanced security checks
   */
  url: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    try {
      const url = new URL(input.trim());
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:'];
      if (!allowedProtocols.includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * Sanitize numeric input with range validation
   */
  number: (input: string | number): number | null => {
    if (input === null || input === undefined || input === '') return null;
    const num = typeof input === 'string' ? parseFloat(input) : input;
    // Validate range to prevent overflow attacks
    if (isNaN(num) || !isFinite(num) || num < -1000000 || num > 1000000) {
      return null;
    }
    return num;
  },

  /**
   * Sanitize campaign data with enhanced security validation
   */
  campaignData: (data: any) => {
    if (!data || typeof data !== 'object') return {};
    
    // Enhanced sanitization with security checks
    const sanitized = {
      name: sanitizeInput.text(data.name || ''),
      objective: sanitizeInput.text(data.objective || ''),
      ad_title: sanitizeInput.text(data.ad_title || ''),
      ad_text: sanitizeInput.html(data.ad_text || ''),
      destination_url: sanitizeInput.url(data.destination_url || ''),
      whatsapp_number: sanitizeInput.phone(data.whatsapp_number || ''),
      location_country: sanitizeInput.text(data.location_country || ''),
      location_state: sanitizeInput.text(data.location_state || ''),
      location_city: sanitizeInput.text(data.location_city || ''),
      budget_daily: null,
      budget_total: null,
      age_min: null,
      age_max: null
    };

    // Validate financial data with reasonable limits
    if (data.budget_daily !== undefined) {
      const budget = sanitizeInput.number(data.budget_daily);
      if (budget !== null && budget > 0 && budget <= 50000) {
        sanitized.budget_daily = budget;
      }
    }

    if (data.budget_total !== undefined) {
      const total = sanitizeInput.number(data.budget_total);
      if (total !== null && total > 0 && total <= 1000000) {
        sanitized.budget_total = total;
      }
    }

    // Validate age ranges
    if (data.age_min !== undefined) {
      const ageMin = sanitizeInput.number(data.age_min);
      if (ageMin !== null && ageMin >= 13 && ageMin <= 65) {
        sanitized.age_min = ageMin;
      }
    }

    if (data.age_max !== undefined) {
      const ageMax = sanitizeInput.number(data.age_max);
      if (ageMax !== null && ageMax >= 18 && ageMax <= 65) {
        sanitized.age_max = ageMax;
      }
    }

    return sanitized;
  }
};

/**
 * Input validation with length limits
 */
export const validateInput = {
  required: (value: string, fieldName: string): string | null => {
    if (!value || value.trim().length === 0) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (value && value.length > max) {
      return `${fieldName} must be less than ${max} characters`;
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email format';
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(value) ? null : 'Invalid phone number format';
  },

  url: (value: string): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  }
};

/**
 * Rate limiting utility for preventing abuse
 */
export const rateLimiting = {
  requests: new Map<string, { count: number; resetTime: number }>(),

  checkLimit: (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const record = rateLimiting.requests.get(key);

    if (!record || now > record.resetTime) {
      rateLimiting.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }
};