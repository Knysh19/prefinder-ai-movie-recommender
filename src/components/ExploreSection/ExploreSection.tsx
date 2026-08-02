import { useCallback, useEffect, useRef, useState } from "react";
import { MovieCard } from "../MovieCard/MovieCard";
import type { Movie } from "../MovieCard/MovieCard";
import { API_BASE_URL } from "../../api/config";
import "./ExploreSection.scss";

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
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          endpoint,
        });

        if (extraQuery) {
          params.append("extraQuery", extraQuery);
        }

        const res = await fetch(
          `${API_BASE_URL}/movie/explore?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          throw new Error("Explore fetch failed");
        }

        const data = await res.json();
        setMovies(data.results || []);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("Explore fetch error:", e);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchMovies();

    return () => controller.abort();
  }, [endpoint, extraQuery]);

  const updateControls = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setCanScrollBack(container.scrollLeft > 1);
    setCanScrollForward(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(updateControls);
    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(container);
    container.addEventListener("scroll", updateControls, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("scroll", updateControls);
    };
  }, [movies.length, updateControls]);

  const scroll = (direction: -1 | 1) => {
    const container = containerRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(
      ".explore-slide, .movie-skeleton",
    );
    const track = container.querySelector<HTMLElement>(".explore-track");
    const gap = track ? Number.parseFloat(getComputedStyle(track).columnGap) : 32;
    const distance = firstCard
      ? firstCard.getBoundingClientRect().width + gap
      : container.clientWidth * 0.8;

    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";

    container.scrollBy({ left: direction * distance, behavior });
  };

  /* ================= RENDER ================= */
  return (
    <section className="explore-section">
      <div className="explore-container">
        <div className="explore-header">
          <h2 className="explore-section__title">{title}</h2>

          <div className="explore-controls">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollBack}
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollForward}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>

        <div className="explore-viewport" ref={containerRef}>
          <div className="explore-track">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
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
