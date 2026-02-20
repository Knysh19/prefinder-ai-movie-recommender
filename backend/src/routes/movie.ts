import { Router } from "express";
import fetch from "node-fetch";

const router = Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function tmdb(path: string) {
  const res = await fetch(
    `${TMDB_BASE_URL}${path}?api_key=${TMDB_API_KEY}&language=en-US`
  );
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

router.get("/:id/full", async (req, res) => {
  const { id } = req.params;

  try {
    const [movie, credits, videos, images] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/videos`),
      tmdb(`/movie/${id}/images`),
    ]);

    res.json({
      movie,
      cast: credits.cast.slice(0, 12),
      crew: credits.crew,
      trailer:
        videos.results.find(
          (v: any) => v.type === "Trailer" && v.site === "YouTube"
        ) || null,
      images: {
        backdrops: images.backdrops.slice(0, 6),
        posters: images.posters.slice(0, 6),
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to load movie full data" });
  }
});

export default router;
