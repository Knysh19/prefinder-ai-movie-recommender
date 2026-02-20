import "./MovieCard.scss";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string;
};

type Props = {
  movie: Movie;
};

export function MovieCard({ movie }: Props) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const imagePath = movie.poster_path || movie.backdrop_path;
  const favorite = isFavorite(movie.id);

  return (
    <div className="movie-card">
      <div
        className="movie-card__image-wrapper"
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        {imagePath ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${imagePath}`}
            alt={movie.title}
            className="movie-card__poster"
            loading="lazy"
          />
        ) : (
          <div className="movie-card__placeholder">No poster</div>
        )}

        {/* ❤️ FAVORITE BUTTON */}
        <button
          className={`movie-card__favorite ${favorite ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation(); // 🔥 КРИТИЧНО
            toggleFavorite(movie);
          }}
        >
          {favorite ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="movie-card__meta">
        <h3 className="movie-card__title">{movie.title}</h3>
        <span className="movie-card__year">
          {movie.release_date?.slice(0, 4)}
        </span>
      </div>
    </div>
  );
}
