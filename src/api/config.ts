const DEPLOYED_API_URL =
  "https://prefinder-ai-movie-recommender.onrender.com/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ||
  DEPLOYED_API_URL;
