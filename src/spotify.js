import axios from "axios";

let cachedAccessToken;
let cachedAccessTokenExpiresAt = 0;

const getAccessToken = async ({ clientId, clientSecret, refreshToken }) => {
  const now = Date.now();

  if (cachedAccessToken && now < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Spotify credentials are missing. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN."
    );
  }

  const encodedCredentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8"
  ).toString("base64");

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  if (!response.data?.access_token) {
    throw new Error("Spotify token response did not include an access token.");
  }

  cachedAccessToken = response.data.access_token;
  cachedAccessTokenExpiresAt =
    Date.now() + Math.max((response.data.expires_in ?? 3600) - 60, 60) * 1000;

  return cachedAccessToken;
};

const getSpotify = async (config, path, params = {}) => {
  const accessToken = await getAccessToken(config);

  return axios.get(`https://api.spotify.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params
  });
};

const normalizeTrack = (track, playedAt = null) => ({
  name: track?.name ?? "Unknown track",
  trackName: track?.name ?? "Unknown track",
  artistName:
    track?.artists?.[0]?.name ?? track?.album?.artists?.[0]?.name ?? "Unknown artist",
  imageUrl: track?.album?.images?.[0]?.url ?? "",
  albumImage: track?.album?.images?.[0]?.url ?? "",
  url: track?.external_urls?.spotify ?? "https://open.spotify.com/",
  spotifyUrl: track?.external_urls?.spotify ?? "https://open.spotify.com/",
  previewUrl: track?.preview_url ?? null,
  playedAt
});

export const fetchRecentlyPlayed = async (config) => {
  const response = await getSpotify(config, "/me/player/recently-played", {
    limit: 1
  });

  const item = response.data?.items?.[0];
  const track = item?.track;

  if (!track) {
    throw new Error("Spotify recently played response did not include a track.");
  }

  return normalizeTrack(track, item.played_at ?? null);
};

export const fetchRecentSongs = async (config, limit = 10) => {
  const response = await getSpotify(config, "/me/player/recently-played", {
    limit
  });

  return (response.data?.items ?? [])
    .map((item) => normalizeTrack(item.track, item.played_at ?? null))
    .filter((track) => track.name && track.artistName);
};

export const fetchTopArtists = async (
  config,
  limit = 10,
  timeRange = "medium_term"
) => {
  const response = await getSpotify(config, "/me/top/artists", {
    limit,
    time_range: timeRange
  });

  return (response.data?.items ?? []).map((artist) => ({
    name: artist?.name ?? "Unknown artist",
    artistName: artist?.name ?? "Unknown artist",
    url: artist?.external_urls?.spotify ?? "https://open.spotify.com/",
    artistUrl: artist?.external_urls?.spotify ?? "https://open.spotify.com/",
    imageUrl: artist?.images?.[0]?.url ?? "",
    artistImage: artist?.images?.[0]?.url ?? ""
  }));
};
