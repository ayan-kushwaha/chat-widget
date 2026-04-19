import rateLimit from 'express-rate-limit';

// ⚡ RATE LIMITERS (Prevent Abuse)

/**
 * Rating Endpoint Limiter
 * Prevents spam ratings: Max 10 ratings per hour per IP
 */
export const ratingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Max 10 requests per hour
    message: {
        success: false,
        message: 'Too many rating submissions. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false
});

/**
 * Install Endpoint Limiter
 * Prevents rapid install spam: Max 20 installs per hour per IP
 */
export const installLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 installs per hour
    message: {
        success: false,
        message: 'Too many install requests. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * General API Limiter
 * Prevents general API abuse: Max 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15 min
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Search Limiter (More lenient for UI)
 * Max 50 searches per minute for real-time search bar
 */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    message: {
        success: false,
        message: 'Too many search requests. Please wait a moment.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});
