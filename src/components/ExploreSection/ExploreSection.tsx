import { useEffect, useRef, useState, useCallback } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import "./ExploreSection.scss";

const API_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const GAP = 32;
const CARD_WIDTH = 260;

type ExploreSectionProps = {
  title: string;
  endpoint: string;
  extraQuery?: string;
};

export function ExploreSection({
  title,
  endpoint,
  extraQuery,
}: ExploreSectionProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const startIndexRef = useRef(0);

  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [translatePx, setTranslatePx] = useState(0);

  /* ================= FETCH ================= */
  useEffect(() => {
    async function fetchMovies() {
      try {
        setIsLoading(true);

        let url = `${API_URL}${endpoint}?api_key=${API_KEY}`;
        if (extraQuery) url += `&${extraQuery}`;

        const res = await fetch(url);
        const data = await res.json();

        setMovies(data.results || []);
      } catch (e) {
        console.error("Explore fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
  }, [endpoint, extraQuery]);

  /* ============ RESPONSIVE LOGIC ============ */
  const computeVisible = useCallback((width: number) => {
    if (width >= 1400) return 6;
    if (width >= 1200) return 5;
    if (width >= 900) return 4;
    if (width >= 600) return 3;
    return 2;
  }, []);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const newVisible = computeVisible(width);

    setVisibleCount(newVisible);

    const maxStart = Math.max(0, movies.length - newVisible);
    const curStart = startIndexRef.current;
    const newStart = Math.min(curStart, maxStart);

    if (newStart !== curStart) {
      setStartIndex(newStart);
      startIndexRef.current = newStart;
    }

    setTranslatePx(newStart * (CARD_WIDTH + GAP));
  }, [computeVisible, movies.length]);

  useEffect(() => {
    startIndexRef.current = startIndex;
    setTranslatePx(startIndex * (CARD_WIDTH + GAP));
  }, [startIndex]);

  useEffect(() => {
    recompute();

    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  /* =============== CONTROLS =============== */
  const maxStart = Math.max(0, movies.length - visibleCount);

  const prev = () => setStartIndex((i) => Math.max(0, i - 1));

  const next = () => setStartIndex((i) => Math.min(maxStart, i + 1));

  /* ================= RENDER ================= */
  return (
    <section className="explore-section">
      <div className="explore-container">
        <div className="explore-header">
          <h2 className="explore-section__title">{title}</h2>

          <div className="explore-controls">
            <button
              onClick={prev}
              disabled={startIndex === 0}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={startIndex >= maxStart}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>

        <div className="explore-viewport" ref={containerRef}>
          <div
            className="explore-track"
            style={{
              transform: `translateX(-${translatePx}px)`,
            }}
          >
            {isLoading &&
              Array.from({ length: visibleCount }).map((_, i) => (
                <div key={i} className="movie-skeleton" />
              ))}

            {!isLoading &&
              movies.map((movie) => (
                <div key={movie.id} className="explore-slide">
                  <MovieCard movie={movie} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
