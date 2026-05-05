import { Router } from "express";
import { analyzeUserQuery } from "../services/aiService";
import {
  getMoviesFromTMDB,
  enrichMoviesWithImages,
} from "../services/tmdbService";
import { rerankMoviesByQuery } from "../services/aiRerankService";

const router = Router();
const cache = new Map<string, any>();

/* =========================
   VARIATION LAYER
========================= */

function pickWithVariation<T>(items: T[], total: number): T[] {
  if (items.length <= total) return items;

  const result: T[] = [];

  const top = items.slice(0, 15);
  const middle = items.slice(15, 30);

  result.push(...top.slice(0, 6));

  if (middle.length > 0) {
    result.push(...middle.slice(0, 5));
  }

  const remaining = items.filter((m) => !result.includes(m));

  while (result.length < total && remaining.length > 0) {
    const index = Math.floor(Math.random() * remaining.length);
    result.push(remaining.splice(index, 1)[0]);
  }

  return result;
}

/* =========================
   ROUTE
========================= */

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ results: [] });
    }

    const cacheKey = query.trim().toLowerCase();
    if (cache.has(cacheKey)) {
      return res.json({
        preferences: null,
        results: cache.get(cacheKey),
        cached: true,
      });
    }

    //  2. AI ANALYSIS
    const preferences = await analyzeUserQuery(query);

    //  3. TMDB
    const rawMovies = await getMoviesFromTMDB(preferences);
    if (!rawMovies.length) {
      return res.json({ preferences, results: [] });
    }

    //  4. RERANK
    const ranked = await rerankMoviesByQuery(query, rawMovies);

    const finalList =
      ranked.length > 0
        ? pickWithVariation(ranked, 15)
        : rawMovies.slice(0, 15).map((m) => ({ ...m, score: 0 }));

    //  6. IMAGES
    const withImages = await enrichMoviesWithImages(finalList);

    // 8. RESPONSE
    cache.set(cacheKey, withImages);
    res.json({
      preferences,
      results: withImages,
      cached: false,
    });
  } catch (e) {
    console.error("❌ Recommendation error:", e);
    res.status(500).json({ results: [] });
  }
});

export default router;
