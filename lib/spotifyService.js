/**
 * Spotify API Service
 * Handles authentication and song matching using Spotify's API
 */

// Spotify uses Client Credentials flow for searching (no user auth needed)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiry = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  console.log('Getting new Spotify access token...');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify auth error:', {
      status: response.status,
      body: errorText,
      hasClientId: !!SPOTIFY_CLIENT_ID,
      hasClientSecret: !!SPOTIFY_CLIENT_SECRET
    });
    throw new Error(`Failed to get Spotify access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early

  console.log('Successfully obtained Spotify access token');
  return accessToken;
}

/**
 * Search Spotify for songs matching audio features
 */
async function searchByFeatures(features, limit = 50) {
  const token = await getAccessToken();

  // Search for acoustic guitar songs that match the key and tempo
  const query = `genre:acoustic key:${getKeyNumber(features.key)} tempo:${Math.round(features.tempo)}`;

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.tracks.items;
}

/**
 * Get audio features for multiple tracks
 */
async function getAudioFeatures(trackIds) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Spotify API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      trackIds: trackIds.length,
      token: token ? 'present' : 'missing'
    });
    throw new Error(`Failed to get audio features: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.audio_features;
}

/**
 * Get recommendations based on seed tracks and audio features
 */
async function getRecommendations(seedTracks, targetFeatures, limit = 20) {
  const token = await getAccessToken();

  // Build query parameters
  const params = new URLSearchParams({
    limit: limit.toString(),
    seed_tracks: seedTracks.slice(0, 5).join(','), // Spotify allows max 5 seeds
    target_tempo: Math.round(targetFeatures.tempo).toString(),
    target_energy: targetFeatures.energy.toFixed(2),
    target_acousticness: '0.7', // Prefer acoustic songs
    min_acousticness: '0.3'
  });

  // Add key if available
  if (targetFeatures.key) {
    params.append('target_key', getKeyNumber(targetFeatures.key).toString());
  }

  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get recommendations: ${response.status}`);
  }

  const data = await response.json();
  return data.tracks;
}

/**
 * Search for a specific song by artist and title
 */
async function searchSong(artist, title) {
  const token = await getAccessToken();

  const query = `artist:${artist} track:${title}`;

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.tracks.items;
}

/**
 * Convert key letter to Spotify key number
 * C=0, C#=1, D=2, etc.
 */
function getKeyNumber(keyLetter) {
  const keyMap = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  return keyMap[keyLetter] || 0;
}

/**
 * Calculate similarity score between two sets of audio features
 */
function calculateFeatureSimilarity(features1, features2) {
  let score = 100;

  // Tempo similarity (max 20 points)
  const tempoDiff = Math.abs(features1.tempo - features2.tempo);
  score -= Math.min(tempoDiff / 5, 20);

  // Energy similarity (max 20 points)
  const energyDiff = Math.abs(features1.energy - features2.energy);
  score -= energyDiff * 20;

  // Key match (20 points for exact match)
  if (features1.key && features2.key) {
    if (getKeyNumber(features1.key) !== features2.key) {
      score -= 20;
    }
  }

  // Acousticness (prefer higher values, max 20 points)
  if (features2.acousticness) {
    score += features2.acousticness * 10;
  }

  // Valence/mood similarity (max 10 points)
  if (features1.valence && features2.valence) {
    const valenceDiff = Math.abs(features1.valence - features2.valence);
    score -= valenceDiff * 10;
  }

  // Duration similarity (max 10 points)
  if (features1.duration && features2.duration_ms) {
    const durationDiff = Math.abs(features1.duration - (features2.duration_ms / 1000));
    score -= Math.min(durationDiff / 10, 10);
  }

  return Math.max(0, Math.round(score));
}

/**
 * Format Spotify track for display
 */
function formatTrack(track, audioFeatures = null, matchScore = 0) {
  return {
    title: track.name,
    artist: track.artists[0]?.name || 'Unknown',
    album: track.album.name,
    albumCover: track.album.images[0]?.url || null,
    albumCoverSmall: track.album.images[2]?.url || track.album.images[0]?.url,
    albumCoverLarge: track.album.images[0]?.url,
    previewUrl: track.preview_url,
    trackViewUrl: track.external_urls.spotify,
    trackId: track.id,
    spotifyUri: track.uri,
    releaseDate: track.album.release_date,
    duration: track.duration_ms / 1000,

    // Audio features if available
    tempo: audioFeatures?.tempo || null,
    keySignature: audioFeatures?.key !== null ? getKeyLetter(audioFeatures.key) : null,
    energy: audioFeatures?.energy || null,
    acousticness: audioFeatures?.acousticness || null,
    valence: audioFeatures?.valence || null,
    danceability: audioFeatures?.danceability || null,

    matchScore: matchScore,
    popularity: track.popularity || 0
  };
}

/**
 * Convert Spotify key number to letter
 */
function getKeyLetter(keyNumber) {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return keys[keyNumber] || 'Unknown';
}

module.exports = {
  getAccessToken,
  searchByFeatures,
  getAudioFeatures,
  getRecommendations,
  searchSong,
  calculateFeatureSimilarity,
  formatTrack
};
