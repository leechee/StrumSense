import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [audioFile, setAudioFile] = useState(null);
  const [mood, setMood] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const moods = ['happy', 'sad', 'chill', 'romantic', 'energetic', 'nostalgic', 'inspiring'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setAudioFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('mood', mood);
      formData.append('userId', localStorage.getItem('userId') || `user_${Date.now()}`);

      if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', `user_${Date.now()}`);
      }

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze audio');
      }

      const data = await response.json();
      setResults(data);

      await fetch('/api/save-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          audioFeatures: data.analysis,
          recognizedSong: data.recommendations.recognizedSong,
          timestamp: new Date().toISOString(),
        }),
      });

    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>StrumSense - AI Acoustic Cover Recommendations</title>
        <meta name="description" content="Upload your acoustic cover and get personalized song recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>StrumSense</h1>
          <p className={styles.subtitle}>
            Your AI-powered acoustic cover companion
          </p>
        </div>

        <div className={styles.uploadSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fileUpload}>
              <label htmlFor="audio" className={styles.fileLabel}>
                <div className={styles.uploadBox}>
                  {audioFile ? (
                    <>
                      <span className={styles.fileName}>{audioFile.name}</span>
                      <span className={styles.fileSize}>
                        ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className={styles.uploadIcon}>🎸</div>
                      <p>Click to upload or drag and drop</p>
                      <p className={styles.fileHint}>MP3, WAV, M4A (max 10MB)</p>
                    </>
                  )}
                </div>
              </label>
              <input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>

            <div className={styles.moodSelector}>
              <label className={styles.moodLabel}>Select your mood (optional)</label>
              <div className={styles.moodGrid}>
                {moods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(mood === m ? '' : m)}
                    className={`${styles.moodButton} ${mood === m ? styles.moodButtonActive : ''}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!audioFile || isAnalyzing}
              className={styles.submitButton}
            >
              {isAnalyzing ? 'Analyzing your playing...' : 'Get Recommendations'}
            </button>
          </form>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Analyzing your acoustic performance...</p>
            <p className={styles.loadingHint}>
              Detecting tempo, chords, and musical characteristics
            </p>
          </div>
        )}

        {results && (
          <div className={styles.results}>
            <div className={styles.analysisSection}>
              <h2>Your Playing Style</h2>
              <div className={styles.vibeDescription}>
                <p>{results.recommendations.vibeDescription}</p>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Tempo</span>
                  <span className={styles.statValue}>
                    {results.recommendations.yourPlayingStyle.tempo} BPM
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Key</span>
                  <span className={styles.statValue}>
                    {results.recommendations.yourPlayingStyle.key}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Style</span>
                  <span className={styles.statValue}>
                    {results.recommendations.yourPlayingStyle.isFingerstyle ? 'Fingerstyle' : 'Strumming'}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Difficulty</span>
                  <span className={styles.statValue}>
                    {results.recommendations.yourPlayingStyle.estimatedDifficulty}
                  </span>
                </div>
              </div>

              {results.recommendations.recognizedSong && (
                <div className={styles.recognizedSong}>
                  <h3>Possible Match</h3>
                  <div className={styles.songCard}>
                    <div className={styles.songInfo}>
                      <span className={styles.songTitle}>
                        {results.recommendations.recognizedSong.title}
                      </span>
                      <span className={styles.songArtist}>
                        {results.recommendations.recognizedSong.artist}
                      </span>
                    </div>
                    <div className={styles.confidence}>
                      {results.recommendations.recognizedSong.confidence}% match
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.recommendationsSection}>
              <h2>Recommended Songs to Cover</h2>
              <p className={styles.recDescription}>
                Based on your playing style{mood && ` and ${mood} mood`}
              </p>

              <div className={styles.songsList}>
                {results.recommendations.recommendations.map((song) => (
                  <div key={`${song.artist}-${song.title}`} className={styles.songRecommendation}>
                    <div className={styles.songHeader}>
                      <div className={styles.rankBadge}>{song.rank}</div>
                      <div className={styles.songMainInfo}>
                        <h3 className={styles.songTitle}>{song.title}</h3>
                        <p className={styles.songArtist}>{song.artist}</p>
                      </div>
                      <div className={styles.matchScore}>
                        {song.matchScore}% match
                      </div>
                    </div>

                    <div className={styles.songDetails}>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailLabel}>Key:</span>
                        <span>{song.keySignature}</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailLabel}>Tempo:</span>
                        <span>{song.tempo} BPM</span>
                      </div>
                      <div className={styles.detailsRow}>
                        <span className={styles.detailLabel}>Difficulty:</span>
                        <span className={styles.difficultyBadge}>
                          {song.difficulty}
                        </span>
                      </div>
                      {song.capo > 0 && (
                        <div className={styles.detailsRow}>
                          <span className={styles.detailLabel}>Capo:</span>
                          <span>Fret {song.capo}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.chords}>
                      <span className={styles.detailLabel}>Chords:</span>
                      <div className={styles.chordList}>
                        {song.chords.slice(0, 6).map((chord, i) => (
                          <span key={i} className={styles.chord}>{chord}</span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.matchReasons}>
                      <span className={styles.detailLabel}>Why this matches:</span>
                      <ul className={styles.reasonsList}>
                        {song.matchReasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.techniques}>
                      {song.techniques.map((tech, i) => (
                        <span key={i} className={styles.techniqueBadge}>{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Built with AI to help you discover your next acoustic cover</p>
      </footer>
    </div>
  );
}
