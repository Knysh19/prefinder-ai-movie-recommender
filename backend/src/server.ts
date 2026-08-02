import "dotenv/config";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import movieRoutes from "./routes/movie";
import recommendationsRouter from "./routes/recommendations";

if (!process.env.TMDB_API_KEY || !process.env.GROQ_API_KEY) {
  console.error("TMDB_API_KEY and GROQ_API_KEY are required");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        callback(null, true);
      } else {
        callback(new Error("Origin is not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
    maxAge: 86_400,
  }),
);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "16kb" }));

type RateRecord = { count: number; resetAt: number };
const rateRecords = new Map<string, RateRecord>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = Number(process.env.RECOMMENDATION_RATE_LIMIT) || 10;

function recommendationRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = rateRecords.get(key);
  const record =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + RATE_WINDOW_MS }
      : current;

  record.count += 1;
  rateRecords.set(key, record);
  res.setHeader("RateLimit-Limit", String(RATE_LIMIT));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, RATE_LIMIT - record.count)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));

  if (record.count > RATE_LIMIT) {
    res.setHeader("Retry-After", String(Math.ceil((record.resetAt - now) / 1000)));
    return res.status(429).json({ error: "Too many recommendation requests." });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateRecords) {
    if (record.resetAt <= now) rateRecords.delete(key);
  }
}, RATE_WINDOW_MS).unref();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});
app.use("/api/movie", movieRoutes);
app.use("/api/recommendations", recommendationRateLimit, recommendationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((error: Error, _req: Request, res: Response, next: NextFunction) => {
  void next;
  if (error.message.includes("CORS")) {
    return res.status(403).json({ error: "Origin is not allowed." });
  }
  console.error("Unhandled server error", error.message);
  return res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`PreFinder API listening on port ${port}`));
