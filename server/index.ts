import express from "express";

const app = express();

app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({ message: "API funcionando" });
});

if (process.env.NODE_ENV !== "production") {
  const port = 5000;
  app.listen(port, () => {
    console.log(`api server running on port ${port}`);
  });
}

export default app;
