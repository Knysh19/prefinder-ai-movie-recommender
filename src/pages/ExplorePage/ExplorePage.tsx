import { ExploreSection } from "../../components/ExploreSection/ExploreSection";
import "./ExplorePage.scss";

export function ExplorePage() {
  return (
    <div className="explore-page">
      <ExploreSection
        title="🔥 Trending Today"
        endpoint="/trending/movie/day"
      />

      <ExploreSection title="⭐ Top Rated" endpoint="/movie/top_rated" />

      <ExploreSection title="🎥 Popular Now" endpoint="/movie/popular" />

      <ExploreSection
        title="🎭 Action Movies"
        endpoint="/discover/movie"
        extraQuery="with_genres=28"
      />
    </div>
  );
}
