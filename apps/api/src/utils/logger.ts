import { Request } from "express";

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
