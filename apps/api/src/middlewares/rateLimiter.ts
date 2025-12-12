import rateLimit from "express-rate-limit";

const rateLimitConfig = {
  validate: { xForwardedForHeader: false }
};

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  ...rateLimitConfig,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  skipSuccessfulRequests: false,
  ...rateLimitConfig,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de uploads atingido. Tente novamente mais tarde." },
  ...rateLimitConfig,
});