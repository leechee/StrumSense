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
    // Use /tmp for Vercel (read-only filesystem), uploads for local dev
    const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads');

    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 4 * 1024 * 1024, // 4 MB limit for Vercel
    });

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
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

    const { fingerprint, features, identification, lyrics, lyricSentiment, similarSongs } = analysisResult;

    // Use OpenL3-based recommendations if available, otherwise fall back to Last.fm
    let recommendations = [];

    if (similarSongs && similarSongs.length > 0) {
      // Filter top 20 OpenL3 songs down to best 10 using Librosa feature matching
      console.log(`Filtering top ${similarSongs.length} OpenL3 songs using Librosa features`);

      // Extract input song's Librosa features for matching
      const inputTempo = features.tempo;
      const inputEnergy = features.energy;
      const inputValence = features.valence;
      const inputMood = features.audioMood || '';

      // Fetch Last.fm data for all 20 songs to get their features
      const songsWithMetadata = await Promise.all(
        similarSongs.map(async (song) => {
          try {
            const lastfmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${process.env.LASTFM_API_KEY}&artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.title)}&format=json`;
            const response = await fetch(lastfmUrl);
            const data = await response.json();

            if (data.track) {
              const track = data.track;
              const genre = track.toptags?.tag?.[0]?.name || '';

              // Calculate feature similarity score
              let featureScore = 0;

              // Mood matching (based on genre and tags)
              const moodKeywords = ['happy', 'sad', 'energetic', 'chill', 'melancholic', 'upbeat'];
              const trackTags = track.toptags?.tag?.map(t => t.name.toLowerCase()) || [];
              const moodMatch = moodKeywords.some(keyword =>
                inputMood.toLowerCase().includes(keyword) &&
                trackTags.some(tag => tag.includes(keyword))
              );
              if (moodMatch) featureScore += 0.3;

              // Popularity score (normalized)
              const popularityScore = Math.min(Math.log10(track.playcount || 1) / 8, 0.3);
              featureScore += popularityScore;

              // Combine OpenL3 similarity (primary) with Librosa-based feature score
              const combinedScore = (song.similarity_score * 0.7) + (featureScore * 0.3);

              return {
                song,
                track,
                combinedScore
              };
            }
            return { song, track: null, combinedScore: song.similarity_score * 0.7 };
          } catch (error) {
            console.error(`Failed to fetch Last.fm data for ${song.artist} - ${song.title}:`, error);
            return { song, track: null, combinedScore: song.similarity_score * 0.7 };
          }
        })
      );

      // Sort by combined score and take top 10
      songsWithMetadata.sort((a, b) => b.combinedScore - a.combinedScore);
      const topSongs = songsWithMetadata.slice(0, 10);

      console.log(`Selected top 10 songs based on OpenL3 + Librosa feature matching`);

      // Map the top 10 filtered songs to recommendation format (metadata already fetched)
      const enrichedSongs = topSongs.map(({ song, track, combinedScore }) => {
        if (track) {
          const albumImage = track.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || null;

          // Calculate difficulty based on genre and tags
          const genre = track.toptags?.tag?.[0]?.name?.toLowerCase() || '';
          const allTags = track.toptags?.tag?.map(t => t.name.toLowerCase()).join(' ') || '';

          let difficulty = 50; // Default medium difficulty

          // Genre-based difficulty
          if (genre.includes('classical') || genre.includes('jazz') || genre.includes('progressive')) {
            difficulty += 20;
          } else if (genre.includes('metal') || genre.includes('punk') || genre.includes('technical')) {
            difficulty += 15;
          } else if (genre.includes('pop') || genre.includes('folk') || allTags.includes('easy listening')) {
            difficulty -= 15;
          } else if (genre.includes('indie') || genre.includes('alternative')) {
            difficulty -= 5;
          }

          // Tag-based adjustments
          if (allTags.includes('instrumental') || allTags.includes('acoustic')) {
            difficulty -= 10;
          }
          if (allTags.includes('fast') || allTags.includes('energetic') || allTags.includes('upbeat')) {
            difficulty += 10;
          }
          if (allTags.includes('slow') || allTags.includes('ballad')) {
            difficulty -= 10;
          }

          // Clamp between 10-100
          difficulty = Math.max(10, Math.min(100, difficulty));

          return {
            title: song.title,
            artist: song.artist,
            album: track.album?.title || 'Unknown Album',
            albumCover: albumImage,
            matchScore: Math.round(combinedScore * 100),
            tempo: song.tempo || null,  // From pre-computed Librosa features in database
            key: song.key || null,      // From pre-computed Librosa features in database
            mode: song.mode || null,    // From pre-computed Librosa features in database
            genre: track.toptags?.tag?.[0]?.name || 'Unknown',
            difficulty: difficulty,
            duration: track.duration ? parseInt(track.duration) / 1000 : fingerprint.duration,
            popularity: parseInt(track.playcount || 0),
            url: track.url || `https://www.last.fm/music/${encodeURIComponent(song.artist)}/_/${encodeURIComponent(song.title)}`,
            playcount: parseInt(track.playcount || 0),
            rank: song.rank,
            similarityScore: song.similarity_score,
            combinedScore: combinedScore
          };
        } else {
          // Fallback if Last.fm doesn't have the track
          return {
            title: song.title,
            artist: song.artist,
            album: 'Unknown Album',
            albumCover: null,
            matchScore: Math.round(combinedScore * 100),
            tempo: null,
            key: null,
            mode: null,
            genre: 'Unknown',
            difficulty: 50,
            duration: fingerprint.duration,
            popularity: song.playcount,
            url: `https://www.last.fm/music/${encodeURIComponent(song.artist)}/_/${encodeURIComponent(song.title)}`,
            playcount: song.playcount,
            rank: song.rank,
            similarityScore: song.similarity_score,
            combinedScore: combinedScore
          };
        }
      });

      recommendations = enrichedSongs;
      console.log(`Enriched ${recommendations.length} OpenL3 recommendations with Last.fm metadata`);
    } else {
      // Fall back to Last.fm genre-based recommendations
      console.log('OpenL3 recommendations not available, using Last.fm fallback');
      const fingerprintWithId = {
        ...fingerprint,
        identification: identification
      };
      const result = await getRecommendationsFromFingerprint(fingerprintWithId, features, mood);
      recommendations = result.recommendations;
    }

    // Clean up uploaded file
    fs.unlinkSync(audioPath);

    return res.status(200).json({
      success: true,
      fingerprint: {
        chromaprint: fingerprint.chromaprint,
        duration: fingerprint.duration
      },
      features: features,
      identification: identification,
      lyrics: lyrics,
      lyricSentiment: lyricSentiment,
      recommendations: recommendations,
      recommendationType: similarSongs && similarSongs.length > 0 ? 'openl3' : 'lastfm'
    });

  } catch (error) {
    console.error('Error analyzing audio:', error);
    return res.status(500).json({
      error: 'Failed to analyze audio',
      details: error.message
    });
  }
}
