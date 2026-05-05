// src/api/recommendations.ts

export type AiPreferences = {
  genres: string[];
  moods: string[];
  themes: string[];
  pacing: string;
  yearRange: string;
};

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string;
  rating?: number;
};

export type RecommendationsResponse = {
  preferences: AiPreferences;
  results: Movie[];
};

const API_BASE_URL = "/api";

export async function getRecommendations(
  userPrompt: string,
): Promise<RecommendationsResponse> {
  const response = await fetch(`${API_BASE_URL}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: userPrompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
}
