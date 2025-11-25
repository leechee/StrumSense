export const sampleAudioFeatures = {
  slow_fingerstyle: {
    tempo: 75,
    key: 'G',
    mode: 'major',
    keySignature: 'G major',
    brightness: 1800,
    energy: 0.08,
    likelyChords: ['G', 'Em', 'C'],
    vibe: ['slow', 'mellow', 'gentle', 'smooth', 'happy', 'fingerstyle'],
    isFingerstyle: true,
    estimatedDifficulty: 'intermediate',
    detectedGenre: 'folk',
    detectedMood: 'chill'
  },

  upbeat_strumming: {
    tempo: 120,
    key: 'C',
    mode: 'major',
    keySignature: 'C major',
    brightness: 2200,
    energy: 0.18,
    likelyChords: ['C', 'Am', 'F'],
    vibe: ['upbeat', 'energetic', 'bright', 'percussive', 'happy'],
    isFingerstyle: false,
    estimatedDifficulty: 'beginner',
    detectedGenre: 'pop-rock',
    detectedMood: 'energetic'
  },

  melancholic_minor: {
    tempo: 68,
    key: 'Am',
    mode: 'minor',
    keySignature: 'A minor',
    brightness: 1400,
    energy: 0.06,
    likelyChords: ['Am', 'Em', 'Dm'],
    vibe: ['slow', 'mellow', 'dark', 'gentle', 'smooth', 'melancholic'],
    isFingerstyle: false,
    estimatedDifficulty: 'beginner',
    detectedGenre: 'blues',
    detectedMood: 'sad'
  }
};

export const sampleRecommendations = {
  example: {
    recognizedSong: {
      title: 'Wonderwall',
      artist: 'Oasis',
      confidence: 85,
      reasoning: 'Tempo and chord progression match classic Wonderwall acoustic cover'
    },
    vibeDescription: 'A mellow acoustic piece in G major at 85 BPM, with gentle fingerstyle patterns creating a nostalgic, contemplative atmosphere.',
    yourPlayingStyle: {
      tempo: 85,
      key: 'G major',
      estimatedDifficulty: 'intermediate',
      detectedGenre: 'folk',
      detectedMood: 'chill',
      isFingerstyle: true
    },
    recommendations: [
      {
        rank: 1,
        title: 'Blackbird',
        artist: 'The Beatles',
        difficulty: 'intermediate',
        chords: ['G', 'Am7', 'G/B', 'C', 'C#dim', 'D'],
        keySignature: 'G major',
        tempo: 95,
        capo: 0,
        techniques: ['fingerpicking', 'travis-picking'],
        matchScore: 92,
        matchReasons: [
          'Same key (G major)',
          'Similar tempo (95 BPM vs your 85 BPM)',
          'Great for fingerstyle playing',
          'Matches your skill level (intermediate)'
        ]
      }
    ],
    selectedMood: 'chill'
  }
};
