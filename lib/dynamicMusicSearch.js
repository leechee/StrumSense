// Dynamic music search using iTunes API - searches millions of songs
// Based on detected audio features (genre, mood, tempo, key)

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

export async function searchSongsByFeatures(audioFeatures) {
  const { tempo, keySignature, vibe, detectedGenre, detectedMood, mode } = audioFeatures;

  // Build smart search queries based on audio features
  const searchQueries = buildSearchQueries(audioFeatures);

  // Search iTunes for matching songs
  const allResults = await Promise.all(
    searchQueries.map(query => searchItunes(query))
  );

  // Flatten and deduplicate results
  const uniqueSongs = deduplicateSongs(allResults.flat());

  // Score each song based on how well it matches the audio features
  const scoredSongs = uniqueSongs.map(song => ({
    ...song,
    matchScore: calculateFeatureMatchScore(song, audioFeatures)
  }));

  // Sort by match score
  scoredSongs.sort((a, b) => b.matchScore - a.matchScore);

  return scoredSongs.slice(0, 30); // Return top 30 matches
}

function buildSearchQueries(audioFeatures) {
  const { vibe, detectedMood, mode, tempo } = audioFeatures;

  const queries = [];

  // Genre-based searches
  const genres = ['acoustic', 'folk', 'singer-songwriter', 'indie folk'];

  // Mood-based terms
  if (mode === 'minor' || vibe.includes('dark') || vibe.includes('melancholic')) {
    queries.push('acoustic sad');
    queries.push('acoustic melancholic');
    queries.push('folk emotional');
  }

  if (vibe.includes('bright') || vibe.includes('upbeat')) {
    queries.push('acoustic happy');
    queries.push('folk upbeat');
    queries.push('indie acoustic bright');
  }

  if (vibe.includes('fingerstyle')) {
    queries.push('fingerstyle guitar');
    queries.push('acoustic fingerpicking');
  }

  // Tempo-based searches
  if (tempo < 80) {
    queries.push('acoustic ballad');
    queries.push('slow acoustic');
  } else if (tempo > 120) {
    queries.push('upbeat acoustic');
    queries.push('fast folk');
  } else {
    queries.push('acoustic guitar');
    queries.push('folk music');
  }

  // Mood-specific
  if (detectedMood) {
    queries.push(`acoustic ${detectedMood}`);
  }

  // Default broad searches
  queries.push('acoustic cover');
  queries.push('guitar acoustic');

  return [...new Set(queries)]; // Remove duplicates
}

async function searchItunes(query) {
  try {
    const encodedQuery = encodeURIComponent(query + ' acoustic guitar');
    const url = `${ITUNES_SEARCH_URL}?term=${encodedQuery}&entity=song&limit=25&attribute=songTerm`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('iTunes search failed:', response.status);
      return [];
    }

    const data = await response.json();

    return (data.results || []).map(song => ({
      title: song.trackName,
      artist: song.artistName,
      album: song.collectionName,
      albumCover: song.artworkUrl100?.replace('100x100', '600x600') || song.artworkUrl100,
      albumCoverSmall: song.artworkUrl60,
      albumCoverLarge: song.artworkUrl100?.replace('100x100', '600x600'),
      previewUrl: song.previewUrl,
      genre: song.primaryGenreName,
      releaseDate: song.releaseDate,
      trackViewUrl: song.trackViewUrl,
      trackId: song.trackId,
      // Note: iTunes API doesn't provide tempo or key data
      // We only estimate mood for internal matching
      estimatedMood: estimateMoodFromGenre(song.primaryGenreName),
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

function deduplicateSongs(songs) {
  const seen = new Set();
  return songs.filter(song => {
    const key = `${song.artist}-${song.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateFeatureMatchScore(song, audioFeatures) {
  let score = 0;
  const { tempo, mode, vibe, detectedGenre, detectedMood } = audioFeatures;

  // Genre matching (most important for iTunes results)
  const songGenreLower = (song.genre || '').toLowerCase();
  if (songGenreLower.includes('acoustic') ||
      songGenreLower.includes('folk') ||
      songGenreLower.includes('singer')) {
    score += 30;
  }

  // Note: iTunes doesn't provide tempo data, so we skip tempo matching
  // Give a small neutral score for all songs
  score += 10;

  // Mood matching
  if (song.estimatedMood && detectedMood) {
    if (song.estimatedMood === detectedMood) {
      score += 20;
    }
  }

  // Vibe keywords in song title/artist
  const songText = `${song.title} ${song.artist} ${song.album}`.toLowerCase();
  vibe.forEach(v => {
    if (songText.includes(v)) {
      score += 5;
    }
  });

  // Boost popular/well-known songs slightly
  if (song.albumCover && song.previewUrl) {
    score += 5;
  }

  return score;
}

function estimateTempoFromGenre(genre) {
  const genreLower = (genre || '').toLowerCase();

  if (genreLower.includes('ballad') || genreLower.includes('blues')) {
    return 75;
  }
  if (genreLower.includes('folk')) {
    return 95;
  }
  if (genreLower.includes('pop') || genreLower.includes('rock')) {
    return 110;
  }

  return 90; // Default moderate tempo
}

function estimateMoodFromGenre(genre) {
  const genreLower = (genre || '').toLowerCase();

  if (genreLower.includes('blues') || genreLower.includes('soul')) {
    return 'sad';
  }
  if (genreLower.includes('pop') || genreLower.includes('dance')) {
    return 'happy';
  }
  if (genreLower.includes('folk') || genreLower.includes('acoustic')) {
    return 'chill';
  }

  return 'neutral';
}
