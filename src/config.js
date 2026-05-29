import dotenv from "dotenv";

dotenv.config();

export const port = Number(process.env.PORT || 3000);

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

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const helpers = {
  parseAllowedOrigins,
  parsePositiveInt
};

export const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

export const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN
};

export const stravaConfig = {
  clientId: process.env.STRAVA_CLIENT_ID,
  clientSecret: process.env.STRAVA_CLIENT_SECRET,
  refreshToken: process.env.STRAVA_REFRESH_TOKEN
};

export const configResponse = () => {
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

  return {
    map,
    resumePdfUrl: process.env.RESUME_PDF_URL?.trim() || null
  };
};

export const env = process.env;
