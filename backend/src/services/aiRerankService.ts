import Groq from "groq-sdk";
import type { Movie } from "./tmdbService";

type MovieForRanking = Movie;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in environment variables");
}

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});


type RankedMovie = MovieForRanking & {
  score: number;
};

export async function rerankMoviesByQuery(
  query: string,
  movies: MovieForRanking[],
): Promise<RankedMovie[]> {
  if (movies.length === 0) return [];

  const shortlist: MovieForRanking[] = movies.slice(0, 25);

  const prompt = `
You are a movie ranking AI.

User query:
"${query}"

Rate each movie from 0 to 100.

Return ONLY valid JSON in this format:
[
  { "id": number, "score": number }
]

Movies:
${shortlist
  .map(
    (m) => `ID: ${m.id}
Title: ${m.title}
Overview: ${m.overview}`,
  )
  .join("\n\n")}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed: unknown;

    try {
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");

      if (firstBracket === -1 || lastBracket === -1) {
        throw new Error("No JSON array found in AI response");
      }

      const jsonSubstring = cleaned.slice(firstBracket, lastBracket + 1);

      parsed = JSON.parse(jsonSubstring);
    } catch (error) {
      console.error("Invalid JSON from AI rerank:", cleaned);
      throw error;
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid rerank response");
    }

    const scoreMap = new Map<number, number>();

    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "score" in item
      ) {
        const id = Number((item as any).id);
        const rawScore = Number((item as any).score);

        if (!Number.isNaN(id) && !Number.isNaN(rawScore)) {
          const normalizedScore = Math.max(0, Math.min(100, rawScore));
          scoreMap.set(id, normalizedScore);
        }
      }
    }

    const ranked: RankedMovie[] = shortlist.map((movie) => ({
      ...movie,
      score: scoreMap.get(movie.id) ?? 0,
    }));

    return ranked.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("AI rerank failed:", error);

    return movies.slice(0, 25).map((m) => ({
      ...m,
      score: 0,
    }));
  }
}
