import "./ResultsSection.scss";
import { MovieCard } from "../MovieCard/MovieCard";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string;
};

type Props = {
  loading: boolean;
  error: string | null;
  movies: Movie[] | null;
};

export function ResultsSection({ loading, error, movies }: Props) {
  if (loading) {
    return (
      <section className="results">
        <p className="results__status">Searching movies… ⏳</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results">
        <p className="results__status results__status--error">{error}</p>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="results">
      <h2 className="results__title">Recommended for you 🎬</h2>

      <div className="results__grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
