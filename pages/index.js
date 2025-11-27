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
      if (file.size > 12 * 1024 * 1024) {
        setError('File size must be less than 12MB');
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
        <div className={styles.uploadSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Top section: StrumSense branding */}
            <div className={styles.brandingSection}>
              <h2 className={styles.ampLogo}>StrumSense</h2>
              <p className={styles.tagline}>Find your next cover</p>
            </div>

            {/* Middle section: File upload area */}
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
                      <p className={styles.uploadText}>Click to upload or drag and drop</p>
                      <p className={styles.fileHint}>MP3, WAV, M4A (max 12MB)</p>
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

            {/* Bottom section: Gold lustrous controls */}
            <div className={styles.controlsSection}>
              <div className={styles.moodSelector}>
                <div className={styles.moodGrid}>
                  {moods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(mood === m ? '' : m)}
                      className={`${styles.moodButton} ${mood === m ? styles.moodButtonActive : ''}`}
                    >
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!audioFile || isAnalyzing}
                className={styles.submitButton}
              >
                {isAnalyzing ? 'Analyzing...' : 'Get Recommendations'}
              </button>
            </div>
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
              <h2>Audio Analysis</h2>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Tempo</span>
                  <span className={styles.statValue}>
                    {Math.round(results.features.tempo)} BPM
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Key</span>
                  <span className={styles.statValue}>
                    {results.features.key}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Energy</span>
                  <span className={styles.statValue}>
                    {(results.features.energy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Fingerprint</span>
                  <span className={styles.statValue}>
                    {results.fingerprint.totalPeaks} peaks
                  </span>
                </div>
              </div>

              {results.identification && results.identification.identified && (
                <div className={styles.recognizedSong}>
                  <h3>Song Identification</h3>
                  <div className={styles.songCard}>
                    {results.identification.track.albumCover && (
                      <img
                        src={results.identification.track.albumCover}
                        alt={`${results.identification.track.title} album cover`}
                        className={styles.identifiedAlbumCover}
                      />
                    )}
                    <div className={styles.songInfo}>
                      <span className={styles.songTitle}>
                        {results.identification.track.title}
                      </span>
                      <span className={styles.songArtist}>
                        {results.identification.track.artist}
                      </span>
                      {results.identification.track.album && (
                        <span className={styles.albumName}>
                          {results.identification.track.album}
                        </span>
                      )}
                    </div>
                    <div className={styles.confidence}>
                      {results.identification.confidence}% confidence
                      <p className={styles.confidenceMessage}>{results.identification.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.recommendationsSection}>
              <h2>Recommended Songs to Cover</h2>
              <p className={styles.recDescription}>
                Based on audio fingerprint analysis{mood && ` and ${mood} mood`}
              </p>

              <div className={styles.songsList}>
                {results.recommendations.map((song, index) => (
                  <div key={`${song.trackId}-${index}`} className={styles.songRecommendation}>
                    <div className={styles.songHeader}>
                      <div className={styles.rankBadge}>{index + 1}</div>
                      {song.albumCover && (
                        <img
                          src={song.albumCover}
                          alt={`${song.title} album cover`}
                          className={styles.albumCover}
                        />
                      )}
                      <div className={styles.songMainInfo}>
                        <h3 className={styles.songTitle}>{song.title}</h3>
                        <p className={styles.songArtist}>{song.artist}</p>
                        {song.album && <p className={styles.albumName}>{song.album}</p>}
                      </div>
                      <div className={styles.matchScore}>
                        {song.matchScore}% match
                      </div>
                    </div>

                    <div className={styles.songDetails}>
                      {song.keySignature && (
                        <div className={styles.detailsRow}>
                          <span className={styles.detailLabel}>Key:</span>
                          <span>{song.keySignature}</span>
                        </div>
                      )}
                      {song.tempo && (
                        <div className={styles.detailsRow}>
                          <span className={styles.detailLabel}>Tempo:</span>
                          <span>{Math.round(song.tempo)} BPM</span>
                        </div>
                      )}
                      {song.energy && (
                        <div className={styles.detailsRow}>
                          <span className={styles.detailLabel}>Energy:</span>
                          <span>{(song.energy * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {song.acousticness && (
                        <div className={styles.detailsRow}>
                          <span className={styles.detailLabel}>Acoustic:</span>
                          <span>{(song.acousticness * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    {song.previewUrl && (
                      <div className={styles.audioPreview}>
                        <audio controls src={song.previewUrl} className={styles.audioPlayer}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {song.trackViewUrl && (
                      <div className={styles.songLinks}>
                        <a
                          href={song.trackViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.spotifyLink}
                        >
                          Listen on Spotify
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>Made for Music © 2025 Jason Lee</p>
          <div className={styles.socialLinks}>
            <a
              href="https://github.com/leechee"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/jason-lee-ut"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="mailto:jasomslee@gmail.com"
              className={styles.socialLink}
              aria-label="Email"
            >
              <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
