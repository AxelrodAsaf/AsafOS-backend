# AsafOS Backend

Backend for AsafOS.

This service is intended to run on Render and provide:

- Spotify recently played
- Spotify recent songs
- Spotify top artists
- N12 RSS proxy
- map config
- future resume PDF config

## Endpoints

- `GET /health`
- `GET /api/config`
- `GET /api/spotify/recently-played`
- `GET /api/spotify/recent-songs`
- `GET /api/spotify/top-artists`
- `GET /api/news/n12`

## Local Run

```bash
npm install
cp .env.example .env
npm run start
```

## Render

Recommended settings:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm run start`
- Health check path: `/health`

## Required Environment Variables

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

## Optional Environment Variables

- `CORS_ORIGIN`
- `SPOTIFY_RECENT_LIMIT`
- `SPOTIFY_TOP_ARTISTS_LIMIT`
- `SPOTIFY_TOP_ARTISTS_TIME_RANGE`
- `N12_RSS_URL`
- `STADIA_API_KEY`
- `STADIA_MAP_STYLE`
- `RESUME_PDF_URL`
