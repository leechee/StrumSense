import fs from 'fs';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'user-history.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readHistory() {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

function writeHistory(data) {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, audioFeatures, recognizedSong, timestamp } = req.body;

    if (!userId || !audioFeatures) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const history = readHistory();

    if (!history[userId]) {
      history[userId] = {
        uploads: [],
        preferences: {
          averageTempo: 0,
          favoriteKeys: {},
          commonChords: {},
          difficultyRange: { min: 0, max: 10 },
          genres: {},
          moods: {}
        }
      };
    }

    history[userId].uploads.push({
      timestamp: timestamp || new Date().toISOString(),
      audioFeatures,
      recognizedSong,
    });

    updateUserPreferences(history[userId], audioFeatures);

    writeHistory(history);

    return res.status(200).json({
      success: true,
      userProfile: history[userId].preferences
    });

  } catch (error) {
    console.error('Error saving upload:', error);
    return res.status(500).json({
      error: 'Failed to save upload history',
      details: error.message
    });
  }
}

function updateUserPreferences(userProfile, audioFeatures) {
  const { tempo, key, chords, detectedGenre, detectedMood } = audioFeatures;

  const uploads = userProfile.uploads;
  const prefs = userProfile.preferences;

  if (tempo) {
    const tempos = uploads.map(u => u.audioFeatures.tempo).filter(Boolean);
    tempos.push(tempo);
    prefs.averageTempo = tempos.reduce((a, b) => a + b, 0) / tempos.length;
  }

  if (key) {
    prefs.favoriteKeys[key] = (prefs.favoriteKeys[key] || 0) + 1;
  }

  if (chords && Array.isArray(chords)) {
    chords.forEach(chord => {
      prefs.commonChords[chord] = (prefs.commonChords[chord] || 0) + 1;
    });
  }

  if (detectedGenre) {
    prefs.genres[detectedGenre] = (prefs.genres[detectedGenre] || 0) + 1;
  }

  if (detectedMood) {
    prefs.moods[detectedMood] = (prefs.moods[detectedMood] || 0) + 1;
  }
}
