import axios from "axios";

const stravaTokenUrl = "https://www.strava.com/oauth/token";
const stravaApiBaseUrl = "https://www.strava.com/api/v3";

const assertStravaConfig = (config) => {
  const requiredValues = [
    ["STRAVA_CLIENT_ID", config.clientId],
    ["STRAVA_CLIENT_SECRET", config.clientSecret],
    ["STRAVA_REFRESH_TOKEN", config.refreshToken]
  ];

  const missing = requiredValues
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Strava configuration: ${missing.join(", ")}`);
  }
};

const getStravaAccessToken = async (config) => {
  assertStravaConfig(config);

  const response = await axios.post(stravaTokenUrl, {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: config.refreshToken
  });

  return response.data.access_token;
};

const formatSeconds = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatPace = (distanceMeters, movingTimeSeconds) => {
  if (!distanceMeters || !movingTimeSeconds) {
    return "";
  }

  const secondsPerKilometer = movingTimeSeconds / (distanceMeters / 1000);
  const paceMinutes = Math.floor(secondsPerKilometer / 60);
  const paceSeconds = Math.round(secondsPerKilometer % 60);

  return `${paceMinutes}:${String(paceSeconds).padStart(2, "0")}/km`;
};

const toLatestRunSummary = (activity) => ({
  id: activity.id,
  name: activity.name ?? "Latest Run",
  url: `https://www.strava.com/activities/${activity.id}`,
  distanceMeters: activity.distance ?? 0,
  distanceKilometers: Number(((activity.distance ?? 0) / 1000).toFixed(2)),
  movingTimeSeconds: activity.moving_time ?? 0,
  movingTimeLabel: formatSeconds(activity.moving_time ?? 0),
  paceLabel: formatPace(activity.distance ?? 0, activity.moving_time ?? 0),
  startDate: activity.start_date ?? null,
  startDateLocal: activity.start_date_local ?? null,
  startLatLng: activity.start_latlng ?? null,
  polyline: activity.map?.summary_polyline ?? "",
  sportType: activity.sport_type ?? activity.type ?? "Run"
});

export const fetchLatestRun = async (config) => {
  const accessToken = await getStravaAccessToken(config);

  const response = await axios.get(`${stravaApiBaseUrl}/athlete/activities`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      per_page: 20,
      page: 1
    }
  });

  const latestRun = (response.data ?? []).find((activity) => {
    const sportType = activity.sport_type ?? activity.type;
    return sportType === "Run";
  });

  if (!latestRun) {
    throw new Error("No recent Strava run activity was found.");
  }

  return toLatestRunSummary(latestRun);
};
