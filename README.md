# AsafOS Backend

This backend powers the live data behind [AsafOS](https://asafos.netlify.app/frontend/), a portfolio/resume site presented as an interactive tile-based interface.

The backend exists to keep the frontend simple while still allowing the site to show live personal data such as Spotify listening, Strava activity, Goodreads reading, RSS news, and map/resume configuration.

## What It Does

The service acts as a thin integration layer between the frontend and external APIs.

It currently provides:

- Spotify:
  - latest played track
  - recent songs
  - top artists
- Strava:
  - latest run summary
  - latest non-run activity with heart-rate stream data
- Goodreads:
  - currently reading
  - recent rated books
- N12 RSS proxy
- map/config data for the frontend
- optional resume PDF URL configuration

## Live Frontend

- Website: [https://asafos.netlify.app/frontend/](https://asafos.netlify.app/frontend/)

## API Surface

- `GET /health`
- `GET /api/config`
- `GET /api/spotify/recently-played`
- `GET /api/spotify/recent-songs`
- `GET /api/spotify/top-artists`
- `GET /api/strava/latest-run`
- `GET /api/strava/latest-non-run`
- `GET /api/goodreads`
- `GET /api/news/n12`

## Structure

- `src/server.js`
  - startup only
- `src/app.js`
  - express app creation and route wiring
- `src/config.js`
  - environment parsing and shared configuration
- `src/spotify.js`
- `src/strava.js`
- `src/goodreads.js`
- `src/news.js`

## Running Locally

```bash
cd "/Users/asafaxelrod/Desktop/AsafOS - Codex/backend"
npm install
cp .env.example .env
npm run start
```

## Deployment

This service is intended to run on Render as the live backend for the site.

Typical settings:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm run start`
- Health check path: `/health`

## Notes

- The backend is not meant to be a standalone product. It is an application-specific service for AsafOS.
- Its main purpose is to proxy or normalize data that the frontend should not fetch directly from third-party sources.
- Keeping these integrations here avoids exposing secrets in the frontend and makes tile behavior easier to evolve over time.
