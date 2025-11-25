import { acousticSongsDatabase, moodCategories } from './acousticSongsDatabase.js';
import { recognizeSongFromFeatures, generateVibeDescription } from './songRecognitionFree.js';
import { extractMusicMetadata } from './audioAnalyzer.js';
import fs from 'fs';
import path from 'path';

export async function generateSongRecommendations({ audioFeatures, mood, userId }) {
  const enrichedFeatures = extractMusicMetadata(audioFeatures);

  const songRecognition = recognizeSongFromFeatures(enrichedFeatures);
  const vibeDescription = generateVibeDescription(enrichedFeatures);

  const userProfile = getUserProfile(userId);

  const scoredSongs = acousticSongsDatabase.map(song => {
    let score = 0;

    score += calculateTempoSimilarity(enrichedFeatures.tempo, song.tempo);

    score += calculateKeySimilarity(enrichedFeatures.key, song.keySignature);

    score += calculateChordSimilarity(enrichedFeatures.likelyChords, song.chords);

    score += calculateVibeSimilarity(enrichedFeatures.vibe, song.vibe);

    if (mood) {
      score += calculateMoodMatch(mood, song.mood);
    }

    if (userProfile) {
      score += calculateUserPreferenceScore(song, userProfile);
    }

    score += calculateDifficultyBonus(song.difficulty, enrichedFeatures.estimatedDifficulty);

    return {
      ...song,
      matchScore: score,
    };
  });

  scoredSongs.sort((a, b) => b.matchScore - a.matchScore);

  const topRecommendations = scoredSongs.slice(0, 10).map((song, index) => ({
    rank: index + 1,
    title: song.title,
    artist: song.artist,
    difficulty: song.difficulty,
    chords: song.chords,
    keySignature: song.keySignature,
    tempo: song.tempo,
    capo: song.capo,
    techniques: song.techniques,
    matchScore: Math.round(song.matchScore),
    matchReasons: generateMatchReasons(song, enrichedFeatures, mood),
  }));

  return {
    recognizedSong: songRecognition.recognizedSongs?.[0] || null,
    allRecognizedMatches: songRecognition.recognizedSongs || [],
    vibeDescription,
    yourPlayingStyle: {
      tempo: Math.round(enrichedFeatures.tempo),
      key: enrichedFeatures.keySignature,
      estimatedDifficulty: enrichedFeatures.estimatedDifficulty,
      detectedGenre: enrichedFeatures.detectedGenre,
      detectedMood: enrichedFeatures.detectedMood,
      isFingerstyle: enrichedFeatures.isFingerstyle,
    },
    recommendations: topRecommendations,
    selectedMood: mood,
  };
}

function calculateTempoSimilarity(uploadTempo, songTempo) {
  const difference = Math.abs(uploadTempo - songTempo);

  if (difference <= 10) return 25;
  if (difference <= 20) return 15;
  if (difference <= 30) return 10;
  if (difference <= 50) return 5;
  return 0;
}

function calculateKeySimilarity(uploadKey, songKeySignature) {
  const uploadKeyBase = uploadKey.replace(/[#b]/g, '');
  const songKeyBase = songKeySignature.split(' ')[0].replace(/[#b]/g, '');

  if (uploadKey === songKeySignature.split(' ')[0]) return 20;

  if (uploadKeyBase === songKeyBase) return 15;

  const relatedKeys = {
    'C': ['Am', 'F', 'G'],
    'G': ['Em', 'C', 'D'],
    'D': ['Bm', 'G', 'A'],
    'A': ['F#m', 'D', 'E'],
    'E': ['C#m', 'A', 'B'],
  };

  const songKeyOnly = songKeySignature.split(' ')[0];
  if (relatedKeys[uploadKey]?.includes(songKeyOnly)) return 10;

  return 5;
}

function calculateChordSimilarity(uploadChords, songChords) {
  const uploadChordsBase = uploadChords.map(c => c.replace(/[#b7m]/g, ''));
  const songChordsBase = songChords.map(c => c.toString().replace(/[#b7m]/g, ''));

  let matches = 0;
  uploadChordsBase.forEach(uploadChord => {
    if (songChordsBase.includes(uploadChord)) {
      matches++;
    }
  });

  const matchRatio = matches / Math.max(uploadChords.length, 1);
  return matchRatio * 30;
}

function calculateVibeSimilarity(uploadVibe, songVibe) {
  let matches = 0;
  uploadVibe.forEach(v => {
    if (songVibe.includes(v)) {
      matches++;
    }
  });

  return matches * 5;
}

function calculateMoodMatch(requestedMood, songMoods) {
  if (!requestedMood || !Array.isArray(songMoods)) return 0;

  const moodLower = requestedMood.toLowerCase();

  if (songMoods.includes(moodLower)) return 30;

  const moodRelatedTags = moodCategories[moodLower] || [];
  for (const tag of moodRelatedTags) {
    if (songMoods.includes(tag)) {
      return 20;
    }
  }

  return 0;
}

function calculateUserPreferenceScore(song, userProfile) {
  let score = 0;

  if (!userProfile || !userProfile.preferences) return 0;

  const prefs = userProfile.preferences;

  if (prefs.genres && prefs.genres[song.genre?.[0]]) {
    score += 10;
  }

  if (prefs.moods) {
    song.mood.forEach(mood => {
      if (prefs.moods[mood]) {
        score += 5;
      }
    });
  }

  if (prefs.averageTempo) {
    const tempoDiff = Math.abs(song.tempo - prefs.averageTempo);
    if (tempoDiff <= 15) score += 10;
  }

  if (prefs.favoriteKeys) {
    const songKey = song.keySignature.split(' ')[0];
    if (prefs.favoriteKeys[songKey]) {
      score += 8;
    }
  }

  return score;
}

function calculateDifficultyBonus(songDifficulty, estimatedUserDifficulty) {
  if (songDifficulty === estimatedUserDifficulty) return 15;

  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
  const userLevel = difficultyLevels.indexOf(estimatedUserDifficulty);
  const songLevel = difficultyLevels.indexOf(songDifficulty);

  const diff = Math.abs(userLevel - songLevel);
  if (diff === 1) return 8;
  if (diff === 2) return 2;

  return 0;
}

function generateMatchReasons(song, features, mood) {
  const reasons = [];

  const tempoDiff = Math.abs(song.tempo - features.tempo);
  if (tempoDiff <= 10) {
    reasons.push(`Very similar tempo (${song.tempo} BPM vs your ${Math.round(features.tempo)} BPM)`);
  } else if (tempoDiff <= 20) {
    reasons.push(`Similar tempo (${song.tempo} BPM)`);
  }

  const uploadKey = features.key;
  const songKey = song.keySignature.split(' ')[0];
  if (uploadKey === songKey) {
    reasons.push(`Same key (${song.keySignature})`);
  }

  const vibeMatches = features.vibe.filter(v => song.vibe.includes(v));
  if (vibeMatches.length > 0) {
    reasons.push(`Similar vibe: ${vibeMatches.slice(0, 2).join(', ')}`);
  }

  if (mood && song.mood.includes(mood.toLowerCase())) {
    reasons.push(`Matches your ${mood} mood`);
  }

  if (song.difficulty === features.estimatedDifficulty) {
    reasons.push(`Matches your skill level (${song.difficulty})`);
  }

  if (features.isFingerstyle && song.techniques.includes('fingerpicking')) {
    reasons.push('Great for fingerstyle playing');
  }

  return reasons;
}

function getUserProfile(userId) {
  try {
    const historyFile = path.join(process.cwd(), 'data', 'user-history.json');
    if (!fs.existsSync(historyFile)) {
      return null;
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    return history[userId] || null;
  } catch (error) {
    console.error('Error reading user profile:', error);
    return null;
  }
}
