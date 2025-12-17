import { checkJobStatus } from '../../lib/audioAnalyzer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const jobStatus = await checkJobStatus(jobId);

    // If job is still processing, return 202 Accepted
    if (jobStatus.status === 'processing') {
      return res.status(202).json(jobStatus);
    }

    // If job failed, return error
    if (jobStatus.status === 'failed') {
      return res.status(500).json({
        error: 'Analysis failed',
        details: jobStatus.error
      });
    }

    // Job completed - enrich with Last.fm metadata
    if (jobStatus.status === 'completed' && jobStatus.result) {
      const { features, similarSongs } = jobStatus.result;

      let recommendations = [];

      if (similarSongs && similarSongs.length > 0) {
        console.log(`Processing ${similarSongs.length} recommendations with hybrid scoring`);

        const songsWithMetadata = await Promise.all(
          similarSongs.map(async (song) => {
            try {
              const lastfmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${process.env.LASTFM_API_KEY}&artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.title)}&format=json`;
              const response = await fetch(lastfmUrl);
              const data = await response.json();

              if (data.track) {
                const track = data.track;
                const albumImage = track.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || null;

                const allTags = track.toptags?.tag || [];
                const actualGenres = allTags.filter(tag => {
                  const name = tag.name.toLowerCase();
                  return !name.includes('spotify') &&
                         !name.includes('playlist') &&
                         !name.includes('top 100') &&
                         !name.includes('charts') &&
                         !name.match(/\d{4}/) &&
                         !name.includes('billboard');
                });

                const genreName = actualGenres[0]?.name || 'Unknown';
                const genre = genreName.toLowerCase();
                const allTagsStr = allTags.map(t => t.name.toLowerCase()).join(' ');

                const tempo = song.tempo || 120;
                const keyComplexity = getKeyComplexity(song.key, song.mode);
                const genreComplexity = getGenreComplexity(genre, allTagsStr);

                const tempoDifficulty = Math.abs(tempo - 120) / 2;
                const difficulty = Math.max(10, Math.min(100, Math.round(
                  30 +
                  (tempoDifficulty * 0.3) +
                  (keyComplexity * 0.3) +
                  (genreComplexity * 0.4)
                )));

                const keySignature = song.key && song.mode ? `${song.key} ${song.mode}` : null;

                return {
                  title: song.title,
                  artist: song.artist,
                  album: track.album?.title || 'Unknown Album',
                  albumCover: albumImage,
                  matchScore: Math.round(song.similarity_score * 100),
                  tempo: song.tempo || null,
                  keySignature: keySignature,
                  energy: song.energy || null,
                  brightness: song.brightness || null,
                  genre: genreName,
                  difficulty: difficulty,
                  duration: track.duration ? parseInt(track.duration) / 1000 : jobStatus.result.duration,
                  popularity: parseInt(track.playcount || 0),
                  url: track.url || `https://www.last.fm/music/${encodeURIComponent(song.artist)}/_/${encodeURIComponent(song.title)}`,
                  openl3Score: Math.round(song.openl3_score * 100),
                  librosaScore: Math.round(song.librosa_score * 100)
                };
              }
              return null;
            } catch (error) {
              console.error(`Failed to fetch Last.fm data for ${song.artist} - ${song.title}:`, error);
              return null;
            }
          })
        );

        recommendations = songsWithMetadata.filter(r => r !== null);
        console.log(`Enriched ${recommendations.length} recommendations with Last.fm metadata`);
      }

      return res.status(200).json({
        success: true,
        duration: jobStatus.result.duration,
        features: features,
        recommendations: recommendations
      });
    }

    // Unknown status
    return res.status(200).json(jobStatus);

  } catch (error) {
    console.error('Error checking job status:', error);
    return res.status(500).json({
      error: 'Failed to check job status',
      details: error.message
    });
  }
}

function getKeyComplexity(key, mode) {
  if (!key || !mode) return 25;

  const sharpFlatKeys = ['C#', 'D#', 'F#', 'G#', 'A#', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];
  const isSharpFlat = sharpFlatKeys.includes(key);

  let complexity = 25;
  if (isSharpFlat) complexity += 15;
  if (mode === 'Minor') complexity += 10;

  return complexity;
}

function getGenreComplexity(genre, allTags) {
  if (genre.includes('classical') || genre.includes('jazz')) return 70;
  if (genre.includes('progressive') || genre.includes('experimental')) return 65;
  if (genre.includes('metal') || genre.includes('technical death metal')) return 60;
  if (genre.includes('funk') || genre.includes('fusion')) return 55;
  if (genre.includes('blues') || genre.includes('soul')) return 45;
  if (genre.includes('rock') || genre.includes('alternative')) return 40;
  if (genre.includes('indie') || genre.includes('folk')) return 35;
  if (genre.includes('pop') || genre.includes('dance')) return 25;
  if (genre.includes('hip hop') || genre.includes('rap')) return 30;
  if (allTags.includes('acoustic') || allTags.includes('easy listening')) return 20;

  return 35;
}
