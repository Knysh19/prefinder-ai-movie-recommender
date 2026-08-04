import "./SearchConstellation.scss";

type SearchConstellationProps = {
  isLoading: boolean;
};

const stars = [
  [64, 91, 2.2],
  [132, 45, 1.7],
  [194, 112, 2.6],
  [264, 66, 1.8],
  [326, 126, 2.2],
  [398, 78, 1.6],
  [470, 118, 2.7],
  [542, 55, 1.9],
  [616, 98, 2.3],
  [690, 48, 1.6],
  [742, 123, 2.5],
  [574, 169, 1.8],
  [414, 174, 2.1],
] as const;

export function SearchConstellation({ isLoading }: SearchConstellationProps) {
  return (
    <div
      className={`search-constellation${isLoading ? " search-constellation--active" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 800 210" preserveAspectRatio="xMidYMid meet">
        <g className="search-constellation__connections">
          <path d="M64 91 132 45 194 112 264 66 326 126 398 78 470 118 542 55 616 98 690 48 742 123" />
          <path d="M194 112 326 126 414 174 470 118 574 169 616 98" />
          <path d="M264 66 398 78 542 55 690 48" />
        </g>

        <g className="search-constellation__pulses">
          <path className="search-constellation__pulse search-constellation__pulse--one" pathLength="1" d="M64 91 132 45 194 112" />
          <path className="search-constellation__pulse search-constellation__pulse--two" pathLength="1" d="M194 112 326 126 414 174" />
          <path className="search-constellation__pulse search-constellation__pulse--three" pathLength="1" d="M414 174 470 118 542 55 616 98" />
          <path className="search-constellation__pulse search-constellation__pulse--four" pathLength="1" d="M616 98 690 48 742 123" />
        </g>

        <g className="search-constellation__stars">
          {stars.map(([cx, cy, radius], index) => (
            <circle
              key={`${cx}-${cy}`}
              className={`search-constellation__star search-constellation__star--${index + 1}`}
              cx={cx}
              cy={cy}
              r={radius}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
