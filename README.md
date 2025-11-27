# StrumSense

AI-powered acoustic guitar cover recommendation app that analyzes your playing using Shazam-style audio fingerprinting and suggests personalized songs to learn from Spotify.

## Features

- **Shazam-Style Audio Fingerprinting**: Advanced constellation-based audio fingerprinting for accurate song identification
- **Song Recognition**: Identifies songs using acoustic fingerprint matching with high confidence scores
- **Smart Recommendations**: Get personalized song suggestions from Spotify based on audio features and mood
- **Spotify Integration**: Access millions of acoustic songs with album artwork, preview audio, and Spotify links
- **Audio Feature Analysis**: Deep audio analysis including tempo, key, energy, acousticness, and timbre

## Tech Stack

- **Frontend**: Next.js 14, React
- **Backend**: Node.js API routes
- **Audio Analysis**: Python 3.11 with librosa and scipy (Shazam-style fingerprinting)
- **Music Database**: Spotify API (Client Credentials flow)
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- Python 3.11 (via Anaconda/Miniconda)
- Conda package manager
- Spotify API credentials (free)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/StrumSense.git
cd StrumSense
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Create conda environment with Python 3.11:
```bash
conda create -n strumsense python=3.11 -y
```

4. Install Python dependencies:
```bash
conda run -n strumsense pip install librosa numpy scipy
```

5. Set up Spotify API credentials:
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Copy your Client ID and Client Secret
   - Create a `.env.local` file in the project root:
```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload your acoustic guitar cover (MP3, WAV, M4A - max 12MB)
2. Optionally select a mood (happy, sad, chill, romantic, etc.)
3. Click "Get Recommendations" to analyze your playing
4. View your playing style analysis and personalized song recommendations with album artwork

## How It Works

### Audio Analysis Pipeline

1. **Shazam-Style Audio Fingerprinting** (Python/librosa + scipy):
   - Creates spectrogram using Short-Time Fourier Transform (STFT)
   - Identifies peak frequencies over time (constellation map)
   - Generates unique fingerprint hashes from peak pairs
   - Each hash encodes: (freq1, freq2, time_delta, anchor_time)
   - Produces compact fingerprint signature for matching

2. **Audio Feature Extraction** (Python/librosa):
   - Tempo detection using beat tracking
   - Key identification from chroma features
   - Energy analysis (RMS)
   - Spectral brightness and contrast
   - MFCC for timbre similarity
   - Acousticness and roughness metrics

3. **Song Identification & Matching** (Spotify API):
   - Searches Spotify catalog using extracted audio features
   - Matches songs by tempo, key, energy, and acousticness
   - Returns identified song with confidence score
   - Uses identified song as seed for recommendations

4. **Recommendation Engine**:
   - Generates recommendations based on:
     - Audio feature similarity (tempo, key, energy)
     - Spotify audio features (acousticness, valence, danceability)
     - User mood preferences
     - Acoustic guitar-focused filtering
   - Returns top 10 matches with Spotify previews and links

## Project Structure

```
StrumSense/
├── pages/
│   ├── index.js              # Main UI (realistic amp plugin interface)
│   ├── _app.js               # Next.js app wrapper with analytics
│   └── api/
│       ├── analyze-audio.js  # Audio upload & fingerprint analysis endpoint
│       ├── save-upload.js    # User history tracking
│       ├── demo.js           # Demo mode
│       └── health.js         # Health check
├── lib/
│   ├── audioAnalyzer.js      # Node.js wrapper for Python fingerprinting
│   ├── spotifyService.js     # Spotify API client & authentication
│   └── fingerprintMatcher.js # Audio fingerprint matching & recommendations
├── scripts/
│   └── shazam_fingerprint.py # Shazam-style audio fingerprinting with librosa
├── styles/
│   ├── globals.css
│   └── Home.module.css       # Realistic amp plugin styling
└── assets/
    └── free.mp3              # Test audio file
```

## Deployment

### Vercel Deployment

1. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Deploy to Vercel:
```bash
npm install -g vercel
vercel login
vercel --prod
```

The app is configured for Vercel deployment with:
- `vercel.json` configuration
- Python runtime support via `requirements.txt`
- Automatic environment detection (conda locally, Python 3.11 on Vercel)

## Environment Variables

Required environment variables:

```bash
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

For Vercel deployment, add these as environment variables in your Vercel project settings.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## API Endpoints

- `POST /api/analyze-audio` - Analyze uploaded audio file
- `POST /api/save-upload` - Save user upload history
- `GET /api/demo?style=slow_fingerstyle&mood=chill` - Demo mode
- `GET /api/health` - Health check

## Audio Analysis Features

The Shazam-style fingerprinting extracts:
- **Constellation Map**: Peak frequencies over time
- **Fingerprint Hashes**: Unique (freq1, freq2, time_delta) combinations
- **Tempo**: BPM detection using beat tracking
- **Key**: Musical key identification (C, D, E, etc.)
- **Energy**: RMS energy analysis
- **Brightness**: Spectral centroid for timbre
- **Roughness**: Zero-crossing rate for texture
- **Contrast**: Spectral contrast for dynamics
- **MFCC**: Mel-frequency cepstral coefficients for timbre matching
- **Duration**: Track length in seconds

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
