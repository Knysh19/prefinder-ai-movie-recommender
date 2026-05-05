import "dotenv/config";
import express from "express";
import cors from "cors";
import recommendationsRouter from "./routes/recommendations";
import movieRoutes from "./routes/movie";

if (!process.env.TMDB_API_KEY) {
  console.error("❌ TMDB_API_KEY is missing in environment variables");
  process.exit(1);
}

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in environment variables");
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/movie", movieRoutes);

app.use("/api/recommendations", recommendationsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
