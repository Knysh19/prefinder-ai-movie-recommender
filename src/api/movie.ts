import { API_BASE_URL } from "./config";

export async function getMovieFull(id: string) {
  const res = await fetch(`${API_BASE_URL}/movie/${id}/full`);
  if (!res.ok) {
    throw new Error("Failed to load movie");
  }
  return res.json();
}
