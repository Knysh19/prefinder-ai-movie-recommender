import { genreMap } from "../utils/genreMap";
import { fetchJson } from "../utils/fetchJson";
import type { AIPreferences } from "./aiService";

const TMDB_API_KEY_RAW = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY_RAW) throw new Error("Missing TMDB_API_KEY");
const TMDB_API_KEY: string = TMDB_API_KEY_RAW;

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  poster_path: string | null;
  backdrop_path: string | null;
  rating: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

type TMDBMovie = {
  id: number;
  title?: string;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
};

type TMDBListResponse = { results?: TMDBMovie[] };

function tmdbUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function mapMovie(movie: TMDBMovie): Movie {
  const rating = Number(movie.vote_average) || 0;
  return {
    id: movie.id,
    title: movie.title || "Untitled",
    overview: movie.overview || "",
    release_date: movie.release_date || "",
    genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
    poster_path: movie.poster_path ?? null,
    backdrop_path: movie.backdrop_path ?? null,
    rating,
    vote_average: rating,
    vote_count: Number(movie.vote_count) || 0,
    popularity: Number(movie.popularity) || 0,
  };
}

function parseYearRange(value: string) {
  const currentYear = new Date().getFullYear();
  const match = /^(\d{4})-(\d{4})$/.exec(value);
  if (!match) return { start: 1970, end: currentYear };
  const start = Math.max(1900, Math.min(Number(match[1]), currentYear));
  const end = Math.max(start, Math.min(Number(match[2]), currentYear));
  return { start, end };
}

async function discoverMovies(preferences: AIPreferences): Promise<Movie[]> {
  const genreIds = preferences.genres
    .map((genre) => genreMap[genre.trim().toLowerCase()])
    .filter((id): id is number => typeof id === "number");
  const { start, end } = parseYearRange(preferences.yearRange);
  const sorts = ["popularity.desc", "vote_average.desc", "revenue.desc"];
  const pages = [1, 2];

  const requests = sorts.flatMap((sort) =>
    pages.map((page) =>
      fetchJson<TMDBListResponse>(
        tmdbUrl("/discover/movie", {
          sort_by: sort,
          page: String(page),
          include_adult: "false",
          "vote_count.gte": "100",
          "primary_release_date.gte": `${start}-01-01`,
          "primary_release_date.lte": `${end}-12-31`,
          ...(genreIds.length ? { with_genres: genreIds.join(",") } : {}),
        }),
      ),
    ),
  );

  const responses = await Promise.all(requests);
  const unique = new Map<number, Movie>();
  const pageSize = Math.max(...responses.map((response) => response.results?.length ?? 0));

  for (let index = 0; index < pageSize; index += 1) {
    for (const response of responses) {
      const rawMovie = response.results?.[index];
      if (rawMovie && !unique.has(rawMovie.id)) unique.set(rawMovie.id, mapMovie(rawMovie));
    }
  }

  return [...unique.values()].slice(0, 45);
}

async function searchMovies(preferences: AIPreferences): Promise<Movie[]> {
  const query = preferences.keywords[0]?.trim();
  if (!query) return [];

  try {
    const data = await fetchJson<TMDBListResponse>(
      tmdbUrl("/search/movie", {
        query,
        include_adult: "false",
        page: "1",
      }),
    );
    return (data.results ?? []).map(mapMovie);
  } catch {
    return [];
  }
}

export async function getMoviesFromTMDB(preferences: AIPreferences) {
  const [discovered, searched] = await Promise.all([
    discoverMovies(preferences),
    searchMovies(preferences),
  ]);
  const merged = new Map<number, Movie>();
  for (const movie of [...searched.slice(0, 5), ...discovered]) {
    if (!merged.has(movie.id)) merged.set(movie.id, movie);
  }
  return [...merged.values()].slice(0, 45);
}

export type FullMoviePayload = {
  movie: Record<string, unknown>;
  cast: Array<Record<string, unknown>>;
  trailer: { key: string; name: string } | null;
};

type FullMovieResponse = Record<string, unknown> & {
  credits?: { cast?: Array<Record<string, unknown>> };
  videos?: { results?: Array<{ key?: string; name?: string; type?: string; site?: string; official?: boolean }> };
};

export async function getFullMovie(id: number): Promise<FullMoviePayload> {
  const data = await fetchJson<FullMovieResponse>(
    tmdbUrl(`/movie/${id}`, { append_to_response: "credits,videos" }),
  );
  const trailers = data.videos?.results ?? [];
  const trailer =
    trailers.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
    trailers.find((video) => video.site === "YouTube" && video.type === "Trailer");
  const movie: Record<string, unknown> = { ...data };
  delete movie.credits;
  delete movie.videos;

  return {
    movie,
    cast: (data.credits?.cast ?? []).slice(0, 12),
    trailer:
      trailer?.key
        ? { key: trailer.key, name: trailer.name || "Official trailer" }
        : null,
  };
}

const ALLOWED_EXPLORE_ENDPOINTS = new Set([
  "/trending/movie/day",
  "/movie/top_rated",
  "/movie/popular",
  "/discover/movie",
]);

export async function getExploreMovies(endpoint: string, extraQuery?: string) {
  if (!ALLOWED_EXPLORE_ENDPOINTS.has(endpoint)) {
    throw new Error("Unsupported explore endpoint");
  }

  const params: Record<string, string> = { include_adult: "false", page: "1" };
  if (endpoint === "/discover/movie" && extraQuery) {
    const extra = new URLSearchParams(extraQuery);
    const genre = extra.get("with_genres");
    if (genre && /^\d{1,6}$/.test(genre)) params.with_genres = genre;
  }

  return fetchJson<TMDBListResponse>(tmdbUrl(endpoint, params));
}
