import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

// Suppress IPv6 validation warnings since we're using simple IP extraction
// This is safe for development; in production behind a proxy, trust proxy should be configured
const rateLimitConfig = {
  validate: { xForwardedForHeader: false }
};

// ============== REQUEST ID MIDDLEWARE ==============
// Adds a unique request ID to each request for log correlation
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"] as string || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

// ============== LOGGER WITH REQUEST ID ==============
export function createLogger(req: Request) {
  const requestId = (req as any).requestId || "no-id";
  return {
    info: (message: string, data?: any) => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        requestId,
        method: req.method,
        path: req.path,
        message,
        ...data
      }));
    },
    warn: (message: string, data?: any) => {
      console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        requestId,
        method: req.method,
        path: req.path,
        message,
        ...data
      }));
    },
    error: (message: string, error?: any, data?: any) => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        requestId,
        method: req.method,
        path: req.path,
        message,
        error: error?.message || error,
        stack: error?.stack,
        ...data
      }));
    }
  };
}

// ============== LOGGING MIDDLEWARE ==============
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = createLogger(req);
  const startTime = Date.now();

  // Log request
  logger.info("Request started", {
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"]
  });

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("Request completed", {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

// ============== HELMET CONFIG ==============
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://api.github.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for uploads
});

// ============== CORS CONFIG FROM ENV ==============
export function getCorsConfig() {
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;
  const isProd = process.env.NODE_ENV === "production";

  let origin: string | string[] | boolean;

  if (allowedOriginsEnv) {
    // Parse comma-separated origins from env
    origin = allowedOriginsEnv.split(",").map(o => o.trim());
  } else if (isProd) {
    // In production without explicit config, be restrictive
    origin = false;
    console.warn("[Security] CORS_ALLOWED_ORIGINS not set in production! CORS disabled.");
  } else {
    // In development, allow all origins
    origin = true;
  }

  console.log(`[CORS] Mode: ${isProd ? "production" : "development"}, Origin: ${origin}`);

  return {
    origin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86400, // 24 hours
  };
}

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

// ============== DOCUMENT UPLOAD CONFIG ==============
export const DOCUMENT_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB max for documents
  allowedMimeTypes: [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text
    "text/plain",
    "text/csv",
    // Images (common document scans)
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
  ],
  allowedExtensions: [
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv",
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".zip"
  ]
};

// File filter for documents
export function documentFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = "." + file.originalname.split(".").pop()?.toLowerCase();

  if (!DOCUMENT_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use PDF, Word, Excel, PowerPoint, imagens ou ZIP.`));
    return;
  }

  if (!DOCUMENT_UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
    cb(new Error(`Extensão de arquivo não permitida: ${ext}. Use: ${DOCUMENT_UPLOAD_CONFIG.allowedExtensions.join(", ")}`));
    return;
  }

  cb(null, true);
}

// ============== OPTIONAL CLAMAV SCAN ==============
// ClamAV integration for production (requires clamd running)
export async function scanFileWithClamAV(filePath: string): Promise<{ clean: boolean; message?: string }> {
  // Only scan in production if CLAMAV_HOST is configured
  if (process.env.NODE_ENV !== "production" || !process.env.CLAMAV_HOST) {
    return { clean: true };
  }

  try {
    const net = await import("net");
    const fs = await import("fs");

    return new Promise((resolve) => {
      const client = new net.Socket();
      const host = process.env.CLAMAV_HOST || "localhost";
      const port = parseInt(process.env.CLAMAV_PORT || "3310");

      const timeout = setTimeout(() => {
        client.destroy();
        console.warn("[ClamAV] Scan timeout, allowing file");
        resolve({ clean: true, message: "Scan timeout" });
      }, 30000);

      client.connect(port, host, () => {
        const fileBuffer = fs.readFileSync(filePath);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(fileBuffer.length, 0);

        client.write("zINSTREAM\0");
        client.write(size);
        client.write(fileBuffer);
        client.write(Buffer.alloc(4)); // End of stream
      });

      let response = "";
      client.on("data", (data) => {
        response += data.toString();
      });

      client.on("close", () => {
        clearTimeout(timeout);
        const isClean = response.includes("OK") && !response.includes("FOUND");
        resolve({
          clean: isClean,
          message: isClean ? undefined : response.trim()
        });
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        console.warn("[ClamAV] Connection error:", err.message);
        resolve({ clean: true, message: "Scan unavailable" });
      });
    });
  } catch (error) {
    console.warn("[ClamAV] Scan error:", error);
    return { clean: true, message: "Scan error" };
  }
}
