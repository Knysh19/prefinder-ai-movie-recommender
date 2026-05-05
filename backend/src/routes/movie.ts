import { Router } from "express";

const router = Router();
const TMDB_API_KEY = process.env.TMDB_API_KEY as string;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function tmdb(path: string) {
  const res = await fetch(
    `${TMDB_BASE_URL}${path}?api_key=${TMDB_API_KEY}&language=en-US`,
  );
  if (!res.ok) throw new Error("TMDB error");
  return res.json();
}

router.get("/:id/full", async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid movie ID" });
  }

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
          (v: any) => v.type === "Trailer" && v.site === "YouTube",
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

router.get("/explore", async (req, res) => {
  try {
    const { endpoint, extraQuery } = req.query;

    if (!endpoint || typeof endpoint !== "string") {
      return res.status(400).json({ error: "Missing endpoint parameter" });
    }

    const params = new URLSearchParams({
      api_key: process.env.TMDB_API_KEY as string,
      language: "en-US",
    });

    if (extraQuery && typeof extraQuery === "string") {
      const extraParams = new URLSearchParams(extraQuery);
      extraParams.forEach((value, key) => {
        params.append(key, value);
      });
    }

    const url = `https://api.themoviedb.org/3${endpoint}?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: "TMDB error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Explore fetch failed" });
  }
});

export default router;
