import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { analyzeAudioFeatures } from '../../lib/audioAnalyzer';
import { generateSongRecommendations } from '../../lib/recommendationEngine';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads'),
      keepExtensions: true,
      maxFileSize: 12 * 1024 * 1024,
    });

    if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
      fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const mood = Array.isArray(fields.mood) ? fields.mood[0] : fields.mood;
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'anonymous';

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioPath = audioFile.filepath;

    const audioFeatures = await analyzeAudioFeatures(audioPath);

    const recommendations = await generateSongRecommendations({
      audioFeatures,
      mood,
      userId,
    });

    fs.unlinkSync(audioPath);

    return res.status(200).json({
      success: true,
      analysis: audioFeatures,
      recommendations,
    });

  } catch (error) {
    console.error('Error analyzing audio:', error);
    return res.status(500).json({
      error: 'Failed to analyze audio',
      details: error.message
    });
  }
}
