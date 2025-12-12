import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger";

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const logger = createLogger(req);
  const startTime = Date.now();

  logger.info("Request started", {
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"]
  });

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info("Request completed", {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}