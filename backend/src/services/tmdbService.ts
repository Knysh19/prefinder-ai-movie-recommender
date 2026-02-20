import axios from "axios";
import fetch from "node-fetch";
import { genreMap } from "../utils/genreMap";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

async function getMoviesFromDiscover(preferences: any) {
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
  const results: any[] = [];

  for (const sort of sortVariants) {
    for (const page of pages) {
      const res = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: genreIds.length ? genreIds.join(",") : undefined,
          sort_by: sort,
          vote_count_gte: 100,
          language: "en-US",
          page,
          "primary_release_date.gte": `${startYear}-01-01`,
          "primary_release_date.lte": `${endYear}-12-31`,
        },
      });

      results.push(
        ...res.data.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          overview: m.overview,
          release_date: m.release_date,
          genre_ids: m.genre_ids,
        }))
      );
    }
  }

  const unique = new Map<number, any>();
  for (const movie of results) {
    unique.set(movie.id, movie);
  }

  return Array.from(unique.values()).slice(0, 40);
}

/* =========================
   SEARCH (нове — для легенд типу "It")
========================= */

async function searchMoviesFromTMDB(keywords: string[]) {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];

  const query = keywords.slice(0, 3).join(" ");

  try {
    const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        include_adult: false,
        language: "en-US",
        page: 1,
      },
    });

    return res.data.results.map((m: any) => ({
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

export async function getMoviesFromTMDB(preferences: any) {
  const discoverResults = await getMoviesFromDiscover(preferences);

  const searchResults = Array.isArray(preferences.keywords)
    ? await searchMoviesFromTMDB(preferences.keywords)
    : [];

  const merged = new Map<number, any>();

  for (const movie of [...searchResults, ...discoverResults]) {
    merged.set(movie.id, movie);
  }

  return Array.from(merged.values()).slice(0, 50);
}

/* =========================
   ENRICH IMAGES
========================= */

export async function enrichMoviesWithImages(movies: any[]) {
  return Promise.all(
    movies.map(async (movie: any) => {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US`
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
    })
  );
}
