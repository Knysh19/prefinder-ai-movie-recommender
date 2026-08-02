# PreFinder

PreFinder is a production-oriented AI movie discovery experience. Describe a mood,
plot, theme, decade, or a movie you already enjoy; the API turns that intent into
structured preferences, discovers candidates from TMDB, and reranks them for the
request.

## Highlights

- Natural-language movie recommendations powered by Groq and TMDB
- Trending, top-rated, popular, and genre collections
- Responsive movie details and local favorites
- Rate-limited API with CORS allowlisting, bounded TTL cache, input validation, and upstream timeouts

## Architecture

```text
Browser (React + Vite)
  |-- /api/recommendations --> intent analysis (Groq)
  |                            |-- candidate discovery (TMDB)
  |                            `-- semantic reranking (Groq)
  `-- /api/movie/* ----------> TMDB proxy with validation and caching headers
```

The backend keeps all provider credentials server-side. The frontend uses the
deployed PreFinder API by default. `VITE_API_BASE_URL` can override that endpoint.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm --prefix backend ci
```

The quickest frontend-only start uses the deployed API:

```bash
npm run dev
```

To run the complete stack locally, copy both example environment files, add your
provider keys, and set `VITE_API_BASE_URL=/api` in the root `.env`. Then run the
backend and frontend in separate terminals:

```bash
copy .env.example .env
copy backend\.env.example backend\.env
npm --prefix backend run dev
npm run dev
```

Frontend: `http://localhost:5173`
API health: `http://localhost:3001/health`

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm --prefix backend test
```

The same checks run in GitHub Actions.

## Deployment

### Frontend

Build command: `npm run build`
Output directory: `dist`
Set `VITE_API_BASE_URL` to the public backend URL ending in `/api`.

`vercel.json` includes the SPA rewrite required for direct route navigation.

### Backend

Root directory: `backend`
Build command: `npm ci && npm run build`
Start command: `npm start`

Required environment variables:

- `GROQ_API_KEY`
- `TMDB_API_KEY`
- `FRONTEND_URL` — comma-separated allowed origins
- `PORT` — supplied by most hosting platforms
- `RECOMMENDATION_RATE_LIMIT` — optional, defaults to 10 requests/minute/IP

## Privacy and data

PreFinder does not send the local profile email to a server. The profile label and
favorites live in localStorage. Recommendation results live in sessionStorage for
the current browser session. Movie data and images come from TMDB.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.
