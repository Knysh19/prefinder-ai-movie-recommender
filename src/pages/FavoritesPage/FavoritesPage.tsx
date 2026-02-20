import { MovieCard } from "../../components/MovieCard/MovieCard";
import { useFavorites } from "../../context/FavoritesContext";
import "./FavoritesPage.scss";

export function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className="favorites-page">
      <h1 className="favorites-title">Your favorites ❤️</h1>

      {favorites.length === 0 ? (
        <p className="favorites-empty">You haven’t added any movies yet.</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
