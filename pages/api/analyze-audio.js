import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { analyzeAudioFeatures } from '../../lib/audioAnalyzer';
import { getRecommendationsFromFingerprint } from '../../lib/fingerprintMatcher';

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
      maxFileSize: 4 * 1024 * 1024, // 4 MB limit for Vercel
    });

    if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
      fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const mood = Array.isArray(fields.mood) ? fields.mood[0] : fields.mood || '';
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'anonymous';

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioPath = audioFile.filepath;

    // Analyze audio using Shazam-style fingerprinting
    const analysisResult = await analyzeAudioFeatures(audioPath);

    if (!analysisResult.success) {
      fs.unlinkSync(audioPath);
      return res.status(500).json({
        error: 'Failed to analyze audio',
        details: analysisResult.error
      });
    }

    const { fingerprint, features } = analysisResult;

    // Get recommendations using fingerprint matching and AcoustID/MusicBrainz API
    const result = await getRecommendationsFromFingerprint(fingerprint, features, mood);

    // Clean up uploaded file
    fs.unlinkSync(audioPath);

    return res.status(200).json({
      success: true,
      fingerprint: {
        totalHashes: fingerprint.total_hashes,
        totalPeaks: fingerprint.total_peaks
      },
      features: features,
      identification: result.identification,
      recommendations: result.recommendations,
    });

  } catch (error) {
    console.error('Error analyzing audio:', error);
    return res.status(500).json({
      error: 'Failed to analyze audio',
      details: error.message
    });
  }
}
