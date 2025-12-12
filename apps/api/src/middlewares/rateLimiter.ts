import rateLimit from "express-rate-limit";

// Suppress IPv6 validation warnings since we're using simple IP extraction
// This is safe for development; in production behind a proxy, trust proxy should be configured
const rateLimitConfig = {
  validate: { xForwardedForHeader: false }
};

// ============== RATE LIMITERS ==============

// General rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  ...rateLimitConfig,
});

// Strict rate limiter for login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  skipSuccessfulRequests: false, // Count all requests
  ...rateLimitConfig,
});

// Rate limiter for upload
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de uploads atingido. Tente novamente mais tarde." },
  ...rateLimitConfig,
});
