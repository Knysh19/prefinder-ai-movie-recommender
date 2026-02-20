export async function getMovieFull(id: string) {
  const res = await fetch(`/api/movie/${id}/full`);
  if (!res.ok) {
    throw new Error("Failed to load movie");
  }
  return res.json();
}
