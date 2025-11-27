/**
 * Audio Fingerprint Matching Service
 * Uses Shazam-style constellation hashing to match songs
 */

const { searchSong, getAudioFeatures, formatTrack } = require('./spotifyService');

/**
 * Match fingerprint hashes between uploaded song and potential matches
 */
function matchFingerprints(uploadedHashes, candidateHashes, timeWindow = 5) {
  let matchCount = 0;
  const totalHashes = Math.min(uploadedHashes.length, 100);

  // For each hash in the uploaded song
  for (const uploadHash of uploadedHashes.slice(0, totalHashes)) {
    // Look for matching hashes in candidate
    for (const candidateHash of candidateHashes) {
      // Check if frequency pairs match
      const freqMatch = (
        Math.abs(uploadHash.freq1 - candidateHash.freq1) <= 2 &&
        Math.abs(uploadHash.freq2 - candidateHash.freq2) <= 2
      );

      // Check if time delta matches (within tolerance)
      const timeDeltaMatch = Math.abs(uploadHash.time_delta - candidateHash.time_delta) <= timeWindow;

      if (freqMatch && timeDeltaMatch) {
        matchCount++;
        break; // Found a match for this hash, move to next
      }
    }
  }

  // Calculate match percentage
  const matchPercentage = (matchCount / totalHashes) * 100;
  return {
    matchCount,
    totalHashes,
    matchPercentage
  };
}

/**
 * Calculate confidence score for a potential match
 */
function calculateConfidence(fingerprintMatch, featureSimilarity) {
  // Fingerprint matching is weighted more heavily (70%)
  const fingerprintScore = fingerprintMatch.matchPercentage * 0.7;

  // Feature similarity contributes 30%
  const featureScore = featureSimilarity * 0.3;

  return Math.round(fingerprintScore + featureScore);
}

/**
 * Attempt to identify the uploaded song using audio fingerprinting
 */
async function identifySong(fingerprint, features) {
  try {
    // Strategy 1: Use Spotify's search with audio features to get candidate songs
    const { searchByFeatures } = require('./spotifyService');

    const candidates = await searchByFeatures(features, 50);

    if (candidates.length === 0) {
      return null;
    }

    // For now, we'll return the top result based on feature similarity
    // In a production system, we would:
    // 1. Build a fingerprint database of known songs
    // 2. Compare uploaded fingerprint against database
    // 3. Use Spotify to get metadata for matched songs

    // Get audio features for top candidates
    const candidateIds = candidates.slice(0, 20).map(t => t.id);
    const audioFeatures = await getAudioFeatures(candidateIds);

    // Score candidates based on feature similarity
    const { calculateFeatureSimilarity } = require('./spotifyService');

    const scoredCandidates = candidates.slice(0, 20).map((track, idx) => {
      const trackFeatures = audioFeatures[idx];
      if (!trackFeatures) return null;

      const similarity = calculateFeatureSimilarity(features, trackFeatures);

      return {
        track,
        audioFeatures: trackFeatures,
        similarity
      };
    }).filter(c => c !== null);

    // Sort by similarity
    scoredCandidates.sort((a, b) => b.similarity - a.similarity);

    if (scoredCandidates.length === 0) {
      return null;
    }

    const topMatch = scoredCandidates[0];

    return {
      identified: true,
      confidence: topMatch.similarity,
      track: formatTrack(topMatch.track, topMatch.audioFeatures, topMatch.similarity),
      message: topMatch.similarity > 70 ? 'High confidence match' : 'Possible match'
    };

  } catch (error) {
    console.error('Error identifying song:', error);
    return null;
  }
}

/**
 * Get song recommendations based on fingerprint and features
 */
async function getRecommendationsFromFingerprint(fingerprint, features, mood = '') {
  try {
    const { getRecommendations, searchByFeatures, getAudioFeatures } = require('./spotifyService');

    // First, try to identify the song
    const identification = await identifySong(fingerprint, features);

    let recommendations = [];

    if (identification && identification.identified) {
      // Use the identified song as a seed for recommendations
      const seedTracks = [identification.track.trackId];

      // Adjust target features based on mood
      const targetFeatures = adjustFeaturesForMood(features, mood);

      recommendations = await getRecommendations(seedTracks, targetFeatures, 20);

    } else {
      // Fall back to feature-based search
      recommendations = await searchByFeatures(features, 20);
    }

    // Get audio features for all recommendations
    const recIds = recommendations.map(t => t.id);
    const audioFeatures = await getAudioFeatures(recIds);

    // Format and score recommendations
    const { calculateFeatureSimilarity, formatTrack } = require('./spotifyService');

    const formattedRecs = recommendations.map((track, idx) => {
      const trackFeatures = audioFeatures[idx];
      const similarity = trackFeatures ? calculateFeatureSimilarity(features, trackFeatures) : 50;

      return formatTrack(track, trackFeatures, similarity);
    });

    // Sort by match score
    formattedRecs.sort((a, b) => b.matchScore - a.matchScore);

    return {
      identification,
      recommendations: formattedRecs.slice(0, 10)
    };

  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Adjust target features based on mood selection
 */
function adjustFeaturesForMood(baseFeatures, mood) {
  const adjusted = { ...baseFeatures };

  switch (mood.toLowerCase()) {
    case 'happy':
      adjusted.valence = 0.8;
      adjusted.energy = Math.max(adjusted.energy, 0.6);
      break;
    case 'sad':
      adjusted.valence = 0.2;
      adjusted.energy = Math.min(adjusted.energy, 0.4);
      break;
    case 'energetic':
      adjusted.energy = 0.9;
      adjusted.tempo = Math.max(adjusted.tempo, 120);
      break;
    case 'calm':
      adjusted.energy = 0.3;
      adjusted.tempo = Math.min(adjusted.tempo, 100);
      break;
    case 'melancholic':
      adjusted.valence = 0.3;
      adjusted.energy = 0.4;
      break;
    case 'upbeat':
      adjusted.valence = 0.7;
      adjusted.energy = 0.7;
      adjusted.tempo = Math.max(adjusted.tempo, 110);
      break;
  }

  return adjusted;
}

module.exports = {
  matchFingerprints,
  calculateConfidence,
  identifySong,
  getRecommendationsFromFingerprint
};
