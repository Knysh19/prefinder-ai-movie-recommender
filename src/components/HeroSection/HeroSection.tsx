import { useState, useRef } from "react";
import "./HeroSection.scss";
import { useNavigate } from "react-router-dom";

import { MicroStars } from "../MicroStars/MicroStars";
import { SearchConstellation } from "../SearchConstellation/SearchConstellation";
import { getRecommendations } from "../../api/recommendations";

import imgHorror from "../../../public/images/horror.jpg";
import imgSciFi from "../../../public/images/sci-fi.jpg";
import imgComedy from "../../../public/images/komedia.jpg";
import imgDrama from "../../../public/images/drama.jpg";
import imgIllustration from "../../../public/images/heroPagelogo.png";

export function HeroSection() {
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const presets = [
    {
      id: "p_horror",
      title: "Horror",
      prompt: "Popular horror movies with a dark and tense atmosphere",
      image: imgHorror,
    },
    {
      id: "p_scifi",
      title: "Sci-fi",
      prompt:
        "Science fiction movies about future technology and space exploration",
      image: imgSciFi,
    },
    {
      id: "p_Comedy",
      title: "Comedy",
      prompt: "Light and funny comedy movies about friendship",
      image: imgComedy,
    },
    {
      id: "p_drama",
      title: "Drama",
      prompt: "Emotional drama movies about family and relationships",
      image: imgDrama,
    },
  ];

  const suggestions = [
    "Dark science fiction movies",
    "Psychological horror movies",
    "Feel-good comedy about friendship",
  ];

  async function handleSearch() {
    if (!query.trim()) return;

    const searchStartedAt = Date.now();
    let searchSucceeded = false;
    setLoading(true);

    try {
      const data = await getRecommendations(query);

      sessionStorage.setItem(
        "prefinder:lastResults",
        JSON.stringify(data.results),
      );

      searchSucceeded = true;
    } catch (error) {
      console.error("Recommendation search failed", error);
    } finally {
      const remainingTime = 2500 - (Date.now() - searchStartedAt);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setLoading(false);
    }

    if (searchSucceeded) {
      navigate(`/results?query=${encodeURIComponent(query)}`);
    }
  }

  function applyPreset(presetPrompt: string) {
    setQuery(presetPrompt);

    if (inputRef.current) {
      inputRef.current.focus();
      const len = presetPrompt.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }

  function handleSuggestionClick(text: string) {
    setQuery(text);
    if (inputRef.current) inputRef.current.focus();
  }

  return (
    <>
      <section className="hero" aria-label="Movie recommendation search">
        <MicroStars bottomMargin={200} />
        <div className="hero__content">
          <div className="hero__left">
            <div className="hero__title">
              <img
                src={imgIllustration}
                alt="PreFinder logo"
                className="image-illustration"
              />
            </div>

            {/* <p className="hero__subtitle">
              Smart. Fast. Personal. Your AI Finder.
            </p> */}

            {/* NEW: short how-it-works */}
            <div className="hero__howit">
              <span className="howit__icon" aria-hidden="true">
                🤖
              </span>
              <p className="howit__text">
                Describe the mood or plot you want — our AI returns personalized
                picks in seconds.
              </p>
            </div>

            {/* NEW: CTA row */}

            <form
              className="hero__search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="hero__search-input"
                type="text"
                placeholder="Ask me something..."
                aria-label="Search by prompt"
              />
              <button
                type="submit"
                className="hero__search-btn"
                aria-label="Search"
                disabled={loading || !query.trim()}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </form>

            <div className="hero__suggestions">
              <div className="suggestions__label">Try searching:</div>
              <ul className="suggestions__list">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero__presets">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className="preset-card"
                  onClick={() => applyPreset(p.prompt)}
                  aria-pressed={query === p.prompt}
                >
                  <div className="preset-card__img">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="preset-card__image"
                    />
                  </div>
                  <div className="preset-card__meta">
                    <div className="preset-card__title">{p.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* <div className="hero__scroll" role="presentation" aria-hidden="true">
          <span className="chev" />
        </div> */}

        <div
          className={`hero__loading-overlay${loading ? " hero__loading-overlay--active" : ""}`}
          aria-hidden="true"
        >
          <div className="hero__loading-backdrop" />
          <div className="hero__loading-animation">
            <SearchConstellation isLoading={loading} />
          </div>
        </div>
      </section>
    </>
  );
}

// <div className="hero__cta-row">
//   <button
//     className="btn btn-ghost"
//     onClick={() => {
//       /* open modal or scroll */
//     }}
//   >
//     How it works
//   </button>
//   <button
//     className="btn btn-outline"
//     onClick={() => {
//       /* set popular preset */
//     }}
//   >
//     Popular picks
//   </button>
//   <button
//     className="btn btn-primary"
//     onClick={() => {
//       /* run demo search */
//     }}
//   >
//     Try demo
//   </button>
//   <ResultsSection loading={loading} error={error} movies={result?.results} />
// </div>;
