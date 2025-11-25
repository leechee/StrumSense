import { generateSongRecommendations } from '../../lib/recommendationEngine';
import { sampleAudioFeatures } from '../../lib/testData';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { style = 'slow_fingerstyle', mood } = req.query;

    const audioFeatures = sampleAudioFeatures[style] || sampleAudioFeatures.slow_fingerstyle;

    const recommendations = await generateSongRecommendations({
      audioFeatures,
      mood,
      userId: 'demo-user',
    });

    return res.status(200).json({
      success: true,
      demoMode: true,
      style,
      analysis: audioFeatures,
      recommendations,
    });

  } catch (error) {
    console.error('Error in demo mode:', error);
    return res.status(500).json({
      error: 'Demo mode failed',
      details: error.message
    });
  }
}
