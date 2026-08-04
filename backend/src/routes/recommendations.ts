import { Router } from "express";
import { analyzeUserQuery } from "../services/aiService";
import type { AIPreferences } from "../services/aiService";
import { getMoviesFromTMDB } from "../services/tmdbService";
import type { Movie } from "../services/tmdbService";
import { rerankMoviesByQuery } from "../services/aiRerankService";
import { TTLCache } from "../utils/ttlCache";
import { validateRecommendationQuery } from "../utils/validation";

type RecommendationPayload = {
  preferences: AIPreferences;
  results: Movie[];
};

const router = Router();
const RECOMMENDATION_LIMIT = 20;
const cache = new TTLCache<RecommendationPayload>(200, 6 * 60 * 60 * 1000);
const inFlight = new Map<string, Promise<RecommendationPayload>>();

async function buildRecommendations(query: string): Promise<RecommendationPayload> {
  const preferences = await analyzeUserQuery(query);
  const candidates = await getMoviesFromTMDB(preferences);
  if (!candidates.length) return { preferences, results: [] };
  const ranked = await rerankMoviesByQuery(query, candidates);
  return { preferences, results: ranked.slice(0, RECOMMENDATION_LIMIT) };
}

router.post("/", async (req, res) => {
  const validation = validateRecommendationQuery(req.body);
  if (!validation.ok) return res.status(400).json({ error: validation.error, results: [] });

  const cacheKey = validation.query.toLocaleLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });

  let request = inFlight.get(cacheKey);
  if (!request) {
    request = buildRecommendations(validation.query);
    inFlight.set(cacheKey, request);
  }

  try {
    const payload = await request;
    cache.set(cacheKey, payload);
    return res.json({ ...payload, cached: false });
  } catch (error) {
    console.error(
      "Recommendation pipeline failed",
      error instanceof Error ? error.message : error,
    );
    return res.status(503).json({
      error: "The recommendation service is temporarily unavailable.",
      results: [],
    });
  } finally {
    if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
  }
});

export default router;
