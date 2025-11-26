// Free song recognition using rule-based matching (no API key needed)

export function recognizeSongFromFeatures(audioFeatures) {
  const { tempo, keySignature, likelyChords, vibe, isFingerstyle, energy } = audioFeatures;

  // Rule-based song matching
  const matches = [];

  // Use dynamic iTunes search instead of hardcoded patterns
  const songPatterns = [];

  // Match songs based on patterns
  songPatterns.forEach(song => {
    let confidence = 0;

    // Check key (MOST IMPORTANT - increased weight)
    if (song.pattern.keys.includes(keySignature)) {
      confidence += 40;
    }

    // Check tempo
    if (tempo >= song.pattern.tempo[0] && tempo <= song.pattern.tempo[1]) {
      confidence += 25;
    } else if (Math.abs(tempo - song.pattern.tempo[0]) <= 10 ||
               Math.abs(tempo - song.pattern.tempo[1]) <= 10) {
      confidence += 12;
    }

    // Check chords (more strict)
    const chordMatches = likelyChords.filter(chord =>
      song.pattern.chords.some(sc => sc.includes(chord) || chord.includes(sc.replace('m', '')))
    ).length;
    if (chordMatches > 0) {
      confidence += (chordMatches / Math.max(likelyChords.length, 1)) * 20;
    }

    // Check vibe (increased weight for multiple matches)
    const vibeMatches = vibe.filter(v => song.pattern.vibe.includes(v)).length;
    confidence += vibeMatches * 10;

    if (confidence >= 40) {
      matches.push({
        title: song.title,
        artist: song.artist,
        confidence: Math.min(Math.round(confidence), 95),
        reasoning: generateReasoning(song, tempo, keySignature, chordMatches, vibeMatches)
      });
    }
  });

  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    recognizedSongs: matches.slice(0, 3),
    styleDescription: generateVibeDescription(audioFeatures),
    genre: audioFeatures.detectedGenre || 'acoustic',
    mood: audioFeatures.detectedMood || 'neutral'
  };
}

function generateReasoning(song, tempo, key, chordMatches, vibeMatches) {
  const reasons = [];

  if (tempo >= song.pattern.tempo[0] && tempo <= song.pattern.tempo[1]) {
    reasons.push("tempo matches perfectly");
  }

  if (song.pattern.keys.includes(key)) {
    reasons.push("same key signature");
  }

  if (chordMatches > 1) {
    reasons.push(`${chordMatches} matching chords`);
  }

  if (vibeMatches > 0) {
    reasons.push("similar musical feel");
  }

  return reasons.join(", ");
}

export function generateVibeDescription(audioFeatures) {
  const { tempo, keySignature, vibe, brightness, energy, mode } = audioFeatures;

  // Generate description based on features
  const tempoDesc = tempo < 80 ? "slow and contemplative" :
                   tempo > 120 ? "upbeat and energetic" :
                   "moderate paced";

  const energyDesc = energy > 0.15 ? "with strong, dynamic playing" :
                     energy < 0.05 ? "with gentle, delicate touches" :
                     "with balanced dynamics";

  const moodDesc = mode === "minor" ? "conveying a melancholic, introspective mood" :
                   brightness > 2000 ? "creating a bright, uplifting atmosphere" :
                   "setting a warm, inviting tone";

  return `This is a ${tempoDesc} acoustic guitar piece in ${keySignature}, ${energyDesc} and ${moodDesc}.`;
}
