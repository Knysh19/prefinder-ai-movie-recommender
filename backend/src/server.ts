import "dotenv/config";
import express from "express";
import cors from "cors";
import recommendationsRouter from "./routes/recommendations";
import movieRoutes from "./routes/movie";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/movie", movieRoutes);

app.use("/api/recommendations", recommendationsRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
