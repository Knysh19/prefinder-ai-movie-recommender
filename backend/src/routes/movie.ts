import { Router } from "express";
import { getExploreMovies, getFullMovie } from "../services/tmdbService";

const router = Router();

router.get("/explore", async (req, res) => {
  const { endpoint, extraQuery } = req.query;
  if (typeof endpoint !== "string") {
    return res.status(400).json({ error: "Missing endpoint parameter." });
  }

  try {
    const data = await getExploreMovies(
      endpoint,
      typeof extraQuery === "string" ? extraQuery : undefined,
    );
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    return res.json(data);
  } catch (error) {
    const isUnsupported =
      error instanceof Error && error.message === "Unsupported explore endpoint";
    return res.status(isUnsupported ? 400 : 502).json({
      error: isUnsupported ? error.message : "Failed to load this movie collection.",
    });
  }
});

router.get("/:id/full", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid movie ID." });
  }

  try {
    const payload = await getFullMovie(id);
    res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
    return res.json(payload);
  } catch {
    return res.status(502).json({ error: "Failed to load movie details." });
  }
});

export default router;
