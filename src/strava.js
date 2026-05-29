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

const toActivityUrl = (id) => `https://www.strava.com/activities/${id}`;

const toLatestRunSummary = (activity) => ({
  id: activity.id,
  name: activity.name ?? "Latest Run",
  url: toActivityUrl(activity.id),
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

const sampleStream = (stream, maxPoints = 72) => {
  if (!Array.isArray(stream) || stream.length <= maxPoints) {
    return stream ?? [];
  }

  const step = (stream.length - 1) / (maxPoints - 1);
  const sampled = [];

  for (let index = 0; index < maxPoints; index += 1) {
    sampled.push(stream[Math.round(index * step)]);
  }

  return sampled;
};

const buildChartPoints = (timeData, heartRateData) => {
  if (!Array.isArray(timeData) || !Array.isArray(heartRateData)) {
    return [];
  }

  const length = Math.min(timeData.length, heartRateData.length);
  const points = [];

  for (let index = 0; index < length; index += 1) {
    const time = Number(timeData[index]);
    const heartRate = Number(heartRateData[index]);

    if (!Number.isFinite(time) || !Number.isFinite(heartRate)) {
      continue;
    }

    points.push({
      timeSeconds: time,
      heartRate
    });
  }

  return sampleStream(points);
};

const getLatestActivity = async (accessToken, matcher) => {
  const response = await axios.get(`${stravaApiBaseUrl}/athlete/activities`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      per_page: 30,
      page: 1
    }
  });

  return (response.data ?? []).find(matcher) ?? null;
};

const fetchActivityStreams = async (accessToken, activityId) => {
  const response = await axios.get(
    `${stravaApiBaseUrl}/activities/${activityId}/streams`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: {
        keys: "time,heartrate",
        key_by_type: true
      }
    }
  );

  return response.data ?? {};
};

const toLatestNonRunSummary = (activity, streams) => {
  const timeData = streams.time?.data ?? [];
  const heartRateData = streams.heartrate?.data ?? [];
  const chartPoints = buildChartPoints(timeData, heartRateData);
  const averageHeartRate = Number(
    activity.average_heartrate ??
      (heartRateData.length > 0
        ? heartRateData.reduce((sum, value) => sum + value, 0) /
          heartRateData.length
        : 0)
  );
  const maxHeartRate = Number(
    activity.max_heartrate ??
      (heartRateData.length > 0 ? Math.max(...heartRateData) : 0)
  );

  return {
    id: activity.id,
    name: activity.name ?? "Latest Activity",
    url: toActivityUrl(activity.id),
    sportType: activity.sport_type ?? activity.type ?? "Activity",
    movingTimeSeconds: activity.moving_time ?? 0,
    movingTimeLabel: formatSeconds(activity.moving_time ?? 0),
    averageHeartRate: Number.isFinite(averageHeartRate)
      ? Math.round(averageHeartRate)
      : null,
    maxHeartRate: Number.isFinite(maxHeartRate) ? Math.round(maxHeartRate) : null,
    chartPoints
  };
};

export const fetchLatestRun = async (config) => {
  const accessToken = await getStravaAccessToken(config);

  const latestRun = await getLatestActivity(accessToken, (activity) => {
    const sportType = activity.sport_type ?? activity.type;
    return sportType === "Run";
  });

  if (!latestRun) {
    throw new Error("No recent Strava run activity was found.");
  }

  return toLatestRunSummary(latestRun);
};

export const fetchLatestNonRunActivity = async (config) => {
  const accessToken = await getStravaAccessToken(config);

  const latestActivity = await getLatestActivity(accessToken, (activity) => {
    const sportType = activity.sport_type ?? activity.type;
    return sportType !== "Run" && Boolean(activity.has_heartrate);
  });

  if (!latestActivity) {
    throw new Error("No recent non-run Strava activity with heart-rate data was found.");
  }

  const streams = await fetchActivityStreams(accessToken, latestActivity.id);
  const summary = toLatestNonRunSummary(latestActivity, streams);

  if (summary.chartPoints.length === 0) {
    throw new Error("No usable heart-rate stream data was found for the latest non-run activity.");
  }

  return summary;
};
