import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { fetchN12News } from "./news.js";
import {
  fetchRecentSongs,
  fetchRecentlyPlayed,
  fetchTopArtists
} from "./spotify.js";
import { fetchLatestRun } from "./strava.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

const parseAllowedOrigins = (value) => {
  const configuredOrigins = (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultDevOrigins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  ];

  return [...new Set([...configuredOrigins, ...defaultDevOrigins])];
};

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

app.use(
  cors(
    allowedOrigins.length > 0
      ? {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
              return;
            }

            callback(new Error(`Origin ${origin} is not allowed by CORS.`));
          }
        }
      : undefined
  )
);
app.use(express.json());

const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN
};

const stravaConfig = {
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  refreshToken: process.env.STRAVA_REFRESH_TOKEN
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/config", (_req, res) => {
  const stadiaKey = process.env.STADIA_API_KEY?.trim();
  const stadiaStyle = process.env.STADIA_MAP_STYLE?.trim() || "alidade_smooth";

  const map = stadiaKey
    ? {
        provider: "stadia",
        style: stadiaStyle,
        tileUrlTemplate: `https://tiles.stadiamaps.com/tiles/${stadiaStyle}/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`,
        attribution:
          '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    : {
        provider: "openstreetmap",
        style: "standard",
        tileUrlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      };

  res.json({
    map,
    resumePdfUrl: process.env.RESUME_PDF_URL?.trim() || null
  });
});

app.get("/api/spotify/recently-played", async (_req, res) => {
  try {
    const data = await fetchRecentlyPlayed(spotifyConfig);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown Spotify error."
    });
  }
});

app.get("/api/spotify/recent-songs", async (req, res) => {
  try {
    const limit = parsePositiveInt(
      req.query.limit,
      parsePositiveInt(process.env.SPOTIFY_RECENT_LIMIT, 10)
    );

    const data = await fetchRecentSongs(spotifyConfig, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown Spotify error."
    });
  }
});

app.get("/api/spotify/top-artists", async (req, res) => {
  try {
    const limit = parsePositiveInt(
      req.query.limit,
      parsePositiveInt(process.env.SPOTIFY_TOP_ARTISTS_LIMIT, 10)
    );

    const timeRange =
      req.query.timeRange?.toString() ||
      process.env.SPOTIFY_TOP_ARTISTS_TIME_RANGE ||
      "medium_term";

    const data = await fetchTopArtists(spotifyConfig, limit, timeRange);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown Spotify error."
    });
  }
});

app.get("/api/news/n12", async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 10);
    const data = await fetchN12News(process.env.N12_RSS_URL, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown RSS error."
    });
  }
});

app.get("/api/strava/latest-run", async (_req, res) => {
  try {
    const data = await fetchLatestRun(stravaConfig);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown Strava error."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AsafOS backend listening on port ${port}`);
});
