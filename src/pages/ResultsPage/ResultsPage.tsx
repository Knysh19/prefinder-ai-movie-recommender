import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRecommendations } from "../../api/recommendations";
import { ResultsSection } from "../../components/ResultsSection/ResultsSection";
import type { Movie } from "../../components/MovieCard/MovieCard";
import "./ResultsPage.scss";

const STORAGE_KEY = "prefinder:lastResults";

export function ResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const query = params.get("query");

  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      navigate("/");
      return;
    }
    const searchQuery = query;

    // ✅ 1. ПРОБУЄМО ВІДНОВИТИ З SESSION STORAGE
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setMovies(parsed);
          setLoading(false);
          return;
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getRecommendations(searchQuery);

        if (!cancelled) {
          setMovies(data.results);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.results));
        }
      } catch {
        if (!cancelled) {
          setError("No good matches found. Try rephrasing your request 🙂");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [query, navigate]);

  return (
    <div className="results-page">
      <div className="results-page__container">
        <button
          className="results-page__back"
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            navigate("/");
          }}
        >
          ← Back to search
        </button>

        <ResultsSection loading={loading} error={error} movies={movies} />
      </div>
    </div>
  );
}
