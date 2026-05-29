import cors from "cors";
import express from "express";
import { fetchGoodreadsData } from "./goodreads.js";
import { fetchN12News } from "./news.js";
import {
  allowedOrigins,
  configResponse,
  env,
  helpers,
  spotifyConfig,
  stravaConfig
} from "./config.js";
import {
  fetchRecentSongs,
  fetchRecentlyPlayed,
  fetchTopArtists
} from "./spotify.js";
import { fetchLatestRun } from "./strava.js";

const createCorsOptions = () => {
  if (allowedOrigins.length === 0) {
    return undefined;
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    }
  };
};

const respondWithError = (res, error, fallbackMessage) => {
  res.status(500).json({
    error: error instanceof Error ? error.message : fallbackMessage
  });
};

export const createApp = () => {
  const app = express();

  app.use(cors(createCorsOptions()));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/config", (_req, res) => {
    res.json(configResponse());
  });

  app.get("/api/spotify/recently-played", async (_req, res) => {
    try {
      const data = await fetchRecentlyPlayed(spotifyConfig);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown Spotify error.");
    }
  });

  app.get("/api/spotify/recent-songs", async (req, res) => {
    try {
      const limit = helpers.parsePositiveInt(
        req.query.limit,
        helpers.parsePositiveInt(env.SPOTIFY_RECENT_LIMIT, 10)
      );

      const data = await fetchRecentSongs(spotifyConfig, limit);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown Spotify error.");
    }
  });

  app.get("/api/spotify/top-artists", async (req, res) => {
    try {
      const limit = helpers.parsePositiveInt(
        req.query.limit,
        helpers.parsePositiveInt(env.SPOTIFY_TOP_ARTISTS_LIMIT, 10)
      );

      const timeRange =
        req.query.timeRange?.toString() ||
        env.SPOTIFY_TOP_ARTISTS_TIME_RANGE ||
        "medium_term";

      const data = await fetchTopArtists(spotifyConfig, limit, timeRange);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown Spotify error.");
    }
  });

  app.get("/api/news/n12", async (req, res) => {
    try {
      const limit = helpers.parsePositiveInt(req.query.limit, 10);
      const data = await fetchN12News(env.N12_RSS_URL, limit);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown RSS error.");
    }
  });

  app.get("/api/goodreads", async (req, res) => {
    try {
      const limit = helpers.parsePositiveInt(req.query.limit, 25);
      const data = await fetchGoodreadsData(env.GOODREADS_USER_ID, limit);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown Goodreads error.");
    }
  });

  app.get("/api/strava/latest-run", async (_req, res) => {
    try {
      const data = await fetchLatestRun(stravaConfig);
      res.json(data);
    } catch (error) {
      respondWithError(res, error, "Unknown Strava error.");
    }
  });

  return app;
};
