const API_BASE_URL = "https://prefinder-ai-movie-recommender.onrender.com/api";

export async function getMovieFull(id: string) {
  const res = await fetch(`${API_BASE_URL}/movie/${id}/full`);
  if (!res.ok) {
    throw new Error("Failed to load movie");
  }
  return res.json();
}
