import { genreMap } from "../utils/genreMap";
import type { AIPreferences } from "./aiService";
const TMDB_API_KEY_RAW = process.env.TMDB_API_KEY;

if (!TMDB_API_KEY_RAW) {
  throw new Error("Missing TMDB_API_KEY in environment variables");
}

const TMDB_API_KEY: string = TMDB_API_KEY_RAW;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
};

/* =========================
   HELPERS
========================= */

function normalizeGenre(g: unknown): string | null {
  if (typeof g !== "string") return null;
  return g.trim().toLowerCase();
}

/* =========================
   DISCOVER (твоя стара логіка)
========================= */

async function getMoviesFromDiscover(
  preferences: AIPreferences,
): Promise<Movie[]> {
  const rawGenres: unknown[] = Array.isArray(preferences.genres)
    ? preferences.genres
    : [];

  const genres: string[] = rawGenres
    .map((g: unknown): string | null => normalizeGenre(g))
    .filter((g): g is string => typeof g === "string");

  const genreIds: number[] = genres
    .map((genre: string): number | undefined => genreMap[genre])
    .filter((id): id is number => typeof id === "number");

  let [startYear, endYear] = ["1990", new Date().getFullYear().toString()];
  if (
    typeof preferences.yearRange === "string" &&
    preferences.yearRange.includes("-")
  ) {
    const parts = preferences.yearRange.split("-");
    if (parts.length === 2) {
      startYear = parts[0];
      endYear = parts[1];
    }
  }

  const sortVariants: string[] = [
    "popularity.desc",
    "vote_average.desc",
    "revenue.desc",
  ];

  const pages: number[] = [1, 2, 3];
  const results: Movie[] = [];

  for (const sort of sortVariants) {
    const pagePromises = pages.map(async (page) => {
      const url = new URL(`${TMDB_BASE_URL}/discover/movie`);

      url.searchParams.append("api_key", TMDB_API_KEY);
      url.searchParams.append("sort_by", sort);
      url.searchParams.append("vote_count_gte", "100");
      url.searchParams.append("language", "en-US");
      url.searchParams.append("page", page.toString());
      url.searchParams.append("primary_release_date.gte", `${startYear}-01-01`);
      url.searchParams.append("primary_release_date.lte", `${endYear}-12-31`);

      if (genreIds.length) {
        url.searchParams.append("with_genres", genreIds.join(","));
      }

      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new Error(`TMDB discover error: ${res.status}`);
      }

      const data = await res.json();

      return data.results.map(
        (m: any): Movie => ({
          id: m.id,
          title: m.title,
          overview: m.overview,
          release_date: m.release_date,
          genre_ids: m.genre_ids,
        }),
      );
    });

    const pageResults = await Promise.all(pagePromises);

    for (const moviesFromPage of pageResults) {
      results.push(...moviesFromPage);
    }
  }

  const unique = new Map<number, Movie>();
  for (const movie of results) {
    unique.set(movie.id, movie);
  }

  return Array.from(unique.values()).slice(0, 40);
}

/* =========================
   SEARCH (нове — для легенд типу "It")
========================= */

async function searchMoviesFromTMDB(keywords: string[]): Promise<Movie[]> {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];

  const query = keywords.slice(0, 3).join(" ");

  try {
    const url = new URL(`${TMDB_BASE_URL}/search/movie`);

    url.searchParams.append("api_key", TMDB_API_KEY);
    url.searchParams.append("query", query);
    url.searchParams.append("include_adult", "false");
    url.searchParams.append("language", "en-US");
    url.searchParams.append("page", "1");

    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error(`TMDB search error: ${res.status}`);
    }

    const data = await res.json();

    return data.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      release_date: m.release_date,
      genre_ids: m.genre_ids,
    }));
  } catch {
    return [];
  }
}

/* =========================
   PUBLIC API
========================= */

export async function getMoviesFromTMDB(
  preferences: AIPreferences,
): Promise<Movie[]> {
  const discoverResults = await getMoviesFromDiscover(preferences);

  const searchResults = Array.isArray(preferences.keywords)
    ? await searchMoviesFromTMDB(preferences.keywords)
    : [];

  const merged = new Map<number, Movie>();

  for (const movie of [...searchResults, ...discoverResults]) {
    merged.set(movie.id, movie);
  }

  return Array.from(merged.values()).slice(0, 50);
}

/* =========================
   ENRICH IMAGES
========================= */

export async function enrichMoviesWithImages(movies: Movie[]): Promise<
  (Movie & {
    rating?: number;
    poster_path?: string | null;
    backdrop_path?: string | null;
  })[]
> {
  return Promise.all(
    movies.map(async (movie: Movie) => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`,
        );
        const details = await res.json();

        return {
          ...movie,
          rating: details.vote_average,
          poster_path: details.poster_path ?? null,
          backdrop_path: details.backdrop_path ?? null,
        };
      } catch {
        return movie;
      }
    }),
  );
}
