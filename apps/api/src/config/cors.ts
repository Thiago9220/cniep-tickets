export function getCorsConfig() {
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS;
  const isProd = process.env.NODE_ENV === "production";

  let origin: string | string[] | boolean;

  if (allowedOriginsEnv) {
    origin = allowedOriginsEnv.split(",").map(o => o.trim());
  } else if (isProd) {
    origin = false;
    console.warn("[Security] CORS_ALLOWED_ORIGINS not set in production! CORS disabled.");
  } else {
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