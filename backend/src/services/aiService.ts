import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export type AIPreferences = {
  genres: string[];
  moods: string[];
  themes: string[];
  keywords: string[]; // ⬅️ ТЕПЕР ОБОВʼЯЗКОВО
  pacing: "slow" | "medium" | "fast";
  yearRange: string; // ⬅️ ЗАВЖДИ YYYY-YYYY
};

export async function analyzeUserQuery(
  userText: string
): Promise<AIPreferences> {
  const prompt = `
You are an AI that analyzes user movie search intent.

Your task:
- Understand what kind of movie the user wants
- Expand vague or abstract requests into concrete movie attributes
- Think like a recommendation system, not a chatbot

IMPORTANT RULES:
- Return ONLY valid JSON
- NO markdown
- NO explanations
- NO extra text

The JSON MUST contain EXACTLY these fields:
- genres: array of movie genres (lowercase, e.g. "sci-fi", "drama")
- moods: emotional tone (e.g. "dark", "hopeful", "tense")
- themes: narrative themes (e.g. "isolation", "survival", "artificial intelligence")
- keywords: concrete searchable concepts (e.g. "space station", "alien", "time loop")
- pacing: one of "slow", "medium", "fast"
- yearRange: string in format "YYYY-YYYY"

STRICT REQUIREMENTS:
- keywords MUST contain at least 5 items
- yearRange MUST be a valid range between 1950 and 2025
- If the user input is vague, infer reasonable details instead of staying generic
- Prefer specificity over popularity

User input:
"${userText}"
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.3, // ⬅️ трохи більше різноманіття
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned empty response");
  }

  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}
