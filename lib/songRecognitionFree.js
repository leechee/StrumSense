// Free song recognition using rule-based matching (no API key needed)

export function recognizeSongFromFeatures(audioFeatures) {
  const { tempo, keySignature, likelyChords, vibe, isFingerstyle, energy } = audioFeatures;

  // Rule-based song matching
  const matches = [];

  // Common song patterns
  const songPatterns = [
    {
      title: "Wonderwall",
      artist: "Oasis",
      pattern: {
        tempo: [80, 95],
        keys: ["G major", "Em"],
        chords: ["Em7", "G", "D", "A7sus4"],
        vibe: ["mellow", "moderate-tempo"]
      }
    },
    {
      title: "Thinking Out Loud",
      artist: "Ed Sheeran",
      pattern: {
        tempo: [75, 85],
        keys: ["D major"],
        chords: ["D", "G", "A", "Em"],
        vibe: ["romantic", "smooth"]
      }
    },
    {
      title: "Let Her Go",
      artist: "Passenger",
      pattern: {
        tempo: [70, 82],
        keys: ["C major", "G major"],
        chords: ["C", "D", "Em", "G"],
        vibe: ["mellow", "emotional"]
      }
    },
    {
      title: "Riptide",
      artist: "Vance Joy",
      pattern: {
        tempo: [98, 108],
        keys: ["A minor"],
        chords: ["Am", "G", "C"],
        vibe: ["bright", "upbeat"]
      }
    },
    {
      title: "Blackbird",
      artist: "The Beatles",
      pattern: {
        tempo: [90, 100],
        keys: ["G major"],
        chords: ["G", "Am", "C"],
        vibe: ["fingerstyle", "bright"]
      }
    }
  ];

  // Match songs based on patterns
  songPatterns.forEach(song => {
    let confidence = 0;

    // Check tempo
    if (tempo >= song.pattern.tempo[0] && tempo <= song.pattern.tempo[1]) {
      confidence += 30;
    } else if (Math.abs(tempo - song.pattern.tempo[0]) <= 15 ||
               Math.abs(tempo - song.pattern.tempo[1]) <= 15) {
      confidence += 15;
    }

    // Check key
    if (song.pattern.keys.includes(keySignature)) {
      confidence += 25;
    }

    // Check chords
    const chordMatches = likelyChords.filter(chord =>
      song.pattern.chords.some(sc => sc.includes(chord))
    ).length;
    confidence += (chordMatches / likelyChords.length) * 25;

    // Check vibe
    const vibeMatches = vibe.filter(v => song.pattern.vibe.includes(v)).length;
    confidence += vibeMatches * 5;

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
    styleDescription: generateStyleDescription(audioFeatures),
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
