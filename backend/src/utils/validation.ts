export type QueryValidation =
  | { ok: true; query: string }
  | { ok: false; error: string };

export function validateRecommendationQuery(body: unknown): QueryValidation {
  if (typeof body !== "object" || body === null || !("query" in body)) {
    return { ok: false, error: "A query is required." };
  }

  const query = (body as { query?: unknown }).query;
  if (typeof query !== "string") {
    return { ok: false, error: "Query must be a string." };
  }

  const normalized = query.trim().replace(/\s+/g, " ");
  if (normalized.length < 3) {
    return { ok: false, error: "Query must contain at least 3 characters." };
  }
  if (normalized.length > 500) {
    return { ok: false, error: "Query cannot exceed 500 characters." };
  }

  return { ok: true, query: normalized };
}
