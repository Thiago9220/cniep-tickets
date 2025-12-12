import express from "express";
import cors from "cors";
import apiRouter from "./routes";
import { UPLOADS_DIR } from "./config/paths";
import { getCorsConfig } from "./config/cors";
import { helmetMiddleware } from "./middlewares/securityMiddleware";
import { requestIdMiddleware } from "./middlewares/requestIdMiddleware";
import { loggingMiddleware } from "./middlewares/loggingMiddleware";
import { generalRateLimiter } from "./middlewares/rateLimiter";

const app = express();

app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(cors(getCorsConfig()));
app.use(express.json());
app.use(generalRateLimiter);
app.use(loggingMiddleware);

app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo: 5MB" });
    }
    const message = typeof err.message === "string" ? err.message : "Erro no upload";
    if (message.includes("Tipo de arquivo") || message.toLowerCase().includes("tipo de arquivo")) {
      return res.status(415).json({ error: message });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({ error: message || "Erro interno do servidor" });
  }
  return res.status(500).json({ error: "Erro interno do servidor" });
});

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;