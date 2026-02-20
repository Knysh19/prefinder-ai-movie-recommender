import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

type MovieForRanking = {
  id: number;
  title: string;
  overview: string;
};

type RankedMovie = MovieForRanking & {
  score: number;
};

export async function rerankMoviesByQuery(
  query: string,
  movies: MovieForRanking[]
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
Overview: ${m.overview}`
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

    const parsed: unknown = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid rerank response");
    }

    const scoreMap = new Map<number, number>();

    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "score" in item &&
        typeof (item as any).id === "number" &&
        typeof (item as any).score === "number"
      ) {
        scoreMap.set((item as any).id, (item as any).score);
      }
    }

    const ranked: RankedMovie[] = shortlist.map((movie) => ({
      ...movie,
      score: scoreMap.get(movie.id) ?? 0,
    }));

    return ranked.sort((a, b) => b.score - a.score);
  } catch {
    // fallback — без rerank, але стабільно
    return movies.slice(0, 25).map((m) => ({
      ...m,
      score: 0,
    }));
  }
}
