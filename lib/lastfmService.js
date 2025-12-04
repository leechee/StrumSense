/**
 * Last.fm API Service
 * Provides popularity data, album artwork, and recommendations
 * Works alongside AcoustID/MusicBrainz for enhanced metadata
 */

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

/**
 * Search Last.fm for a track by artist and title
 */
async function searchTrack(artist, title) {
  const params = new URLSearchParams({
    method: 'track.search',
    track: title,
    artist: artist,
    api_key: LASTFM_API_KEY,
    format: 'json',
    limit: '1',
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Last.fm search failed: ${response.status}`);
  }

  const data = await response.json();
  const results = data.results?.trackmatches?.track;

  if (!results || results.length === 0) {
    return null;
  }

  // Return first match (can be array or single object)
  return Array.isArray(results) ? results[0] : results;
}

/**
 * Get detailed track info from Last.fm
 */
async function getTrackInfo(artist, title) {
  const params = new URLSearchParams({
    method: 'track.getInfo',
    artist: artist,
    track: title,
    api_key: LASTFM_API_KEY,
    format: 'json',
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Last.fm track info failed: ${response.status}`);
  }

  const data = await response.json();
  return data.track || null;
}

/**
 * Get similar tracks from Last.fm
 */
async function getSimilarTracks(artist, title, limit = 20) {
  const params = new URLSearchParams({
    method: 'track.getSimilar',
    artist: artist,
    track: title,
    api_key: LASTFM_API_KEY,
    format: 'json',
    limit: limit.toString(),
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Last.fm similar tracks failed: ${response.status}`);
  }

  const data = await response.json();
  const tracks = data.similartracks?.track || [];

  // Filter for popular tracks (those with listener counts)
  return tracks.filter(t => t.playcount && parseInt(t.playcount) > 100000);
}

/**
 * Get top tracks by tag/genre
 */
async function getTopTracksByTag(tag, limit = 50) {
  const params = new URLSearchParams({
    method: 'tag.getTopTracks',
    tag: tag,
    api_key: LASTFM_API_KEY,
    format: 'json',
    limit: limit.toString(),
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params}`);

  if (!response.ok) {
    throw new Error(`Last.fm top tracks failed: ${response.status}`);
  }

  const data = await response.json();
  return data.tracks?.track || [];
}

/**
 * Enhance MusicBrainz track with Last.fm data
 */
async function enhanceWithLastFm(mbTrack) {
  try {
    const artist = mbTrack.artist || mbTrack['artist-credit']?.[0]?.name;
    const title = mbTrack.title;

    if (!artist || !title) {
      return mbTrack;
    }

    // Get Last.fm track info
    const lfmTrack = await getTrackInfo(artist, title);

    if (!lfmTrack) {
      return mbTrack;
    }

    // Enhance with Last.fm data
    return {
      ...mbTrack,
      listeners: parseInt(lfmTrack.listeners) || 0,
      playcount: parseInt(lfmTrack.playcount) || 0,
      lastfm_url: lfmTrack.url,
      // Use Last.fm album art if available and larger
      album_image: lfmTrack.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || null,
    };
  } catch (error) {
    console.log('Failed to enhance with Last.fm:', error.message);
    return mbTrack;
  }
}

/**
 * Get popular tracks for recommendations
 */
async function getPopularTracks(genre = 'pop', limit = 50) {
  try {
    console.log(`Fetching top tracks for genre: ${genre}`);
    const tracks = await getTopTracksByTag(genre, limit);
    console.log(`Got ${tracks.length} tracks from Last.fm for genre ${genre}`);

    // Debug: check what data we're getting
    if (tracks.length > 0) {
      console.log('Sample track data:', JSON.stringify(tracks[0], null, 2));
    }

    // tag.getTopTracks returns tracks ranked by tag weight, not playcount
    // So we don't need to filter by playcount - just return the top tracks
    // They're already sorted by popularity/relevance to the tag
    console.log(`Returning ${tracks.length} top tracks for ${genre}`);
    return tracks.slice(0, limit);
  } catch (error) {
    console.error('Error getting popular tracks:', error);
    return [];
  }
}

module.exports = {
  searchTrack,
  getTrackInfo,
  getSimilarTracks,
  getTopTracksByTag,
  enhanceWithLastFm,
  getPopularTracks,
};
