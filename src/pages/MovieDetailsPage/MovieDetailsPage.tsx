import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getMovieFull } from "../../api/movie";
import { useFavorites } from "../../context/FavoritesContext";
import "./MovieDetailsPage.scss";

type Genre = { id: number; name: string };
type Actor = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};
type MovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  tagline: string;
  genres: Genre[];
  runtime: number;
  production_countries?: Array<{ name: string }>;
  original_language?: string;
};
type MovieFullResponse = {
  movie: MovieDetails;
  cast: Actor[];
  trailer: { key: string } | null;
};

export function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { isFavorite, toggleFavorite } = useFavorites();

  const [data, setData] = useState<MovieFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    getMovieFull(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="movie-details__status">Loading…</p>;
  if (!data) return null;

  const { movie, cast, trailer } = data;
  const favorite = isFavorite(movie.id);

  return (
    <div className="movie-details">
      <button className="md-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* HERO */}
      <section
        className="md-hero"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
        }}
      >
        <div className="md-hero__overlay">
          <img
            className="md-poster"
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
          />

          <div className="md-hero__info">
            <h1>
              {movie.title} ({movie.release_date?.slice(0, 4)})
            </h1>

            {/* ❤️ FAVORITES — ПРАВИЛЬНО */}
            <button
              className={`md-favorite ${favorite ? "active" : ""}`}
              onClick={() => toggleFavorite(movie)}
            >
              {favorite ? "❤️ Added to favorites" : "🤍 Add to favorites"}
            </button>

            <p className="md-rating">
              ⭐ {movie.vote_average.toFixed(1)} / 10 ({movie.vote_count} votes)
            </p>

            <p className="md-tagline">{movie.tagline}</p>

            <div className="md-genres">
              {movie.genres.map((g) => (
                <span key={g.id} className="md-genre">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW + TRAILER */}
      <section className="md-main page-container">
        <div className="md-overview">
          <h2>Overview</h2>
          <p>{movie.overview}</p>

          <div className="md-meta">
            <span>⏱ {movie.runtime} min</span>
            <span>📅 {movie.release_date}</span>
            <span>🌍 {movie.production_countries?.[0]?.name}</span>
            <span>🗣 {movie.original_language?.toUpperCase()}</span>
          </div>
        </div>

        {trailer && (
          <div className="md-trailer">
            <h2>Trailer</h2>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={`${movie.title} trailer`}
              loading="lazy"
              allowFullScreen
            />
          </div>
        )}
      </section>

      {/* CAST */}
      <section className="md-cast">
        <h2>Cast</h2>
        <div className="md-cast__list" ref={listRef}>
          {cast.slice(0, 10).map((actor) => (
            <div key={actor.id} className="md-cast__card">
              {actor.profile_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                  alt={actor.name}
                />
              )}
              <p>{actor.name}</p>
              <span>{actor.character}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
