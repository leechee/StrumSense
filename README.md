# StrumSense

AI-powered acoustic guitar cover recommendation app that analyzes your playing and suggests personalized songs to learn.

## Features

- **Audio Analysis**: Upload your acoustic guitar cover and get instant analysis of tempo, key, chords, and playing style
- **Song Recognition**: Pattern matching to identify what song you're playing
- **Smart Recommendations**: Get personalized song suggestions based on your playing style, musical characteristics, and mood preferences
- **iTunes Integration**: Search millions of songs with album artwork and preview links
- **Audio Fingerprinting**: Chromagram-based fingerprinting for enhanced audio analysis

## Tech Stack

- **Frontend**: Next.js 14, React
- **Backend**: Node.js API routes
- **Audio Analysis**: Python 3.11 with librosa (ML-based audio feature extraction)
- **Music Database**: iTunes Search API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+
- Python 3.11 (via Anaconda/Miniconda)
- Conda package manager

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

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload your acoustic guitar cover (MP3, WAV, M4A - max 12MB)
2. Optionally select a mood (happy, sad, chill, romantic, etc.)
3. Click "Get Recommendations" to analyze your playing
4. View your playing style analysis and personalized song recommendations with album artwork

## How It Works

### Audio Analysis Pipeline

1. **Feature Extraction** (Python/librosa):
   - Tempo detection using beat tracking
   - Key and mode identification (major/minor)
   - Chroma features for chord detection
   - Spectral analysis (brightness, energy, zero-crossing rate)
   - Playing style detection (fingerstyle vs strumming)
   - Chromagram-based audio fingerprinting

2. **Dynamic Music Search** (iTunes API):
   - Builds intelligent search queries based on detected audio features
   - Searches iTunes catalog for matching songs
   - Returns songs with metadata, album artwork, and preview URLs

3. **Recommendation Engine**:
   - Scores songs based on:
     - Tempo similarity
     - Key and mode matching
     - Vibe/mood alignment
     - Genre compatibility
     - User preference history
   - Returns top 10 matches with detailed reasoning

## Project Structure

```
StrumSense/
├── pages/
│   ├── index.js              # Main UI
│   ├── _app.js               # Next.js app wrapper with analytics
│   └── api/
│       ├── analyze-audio.js  # Audio upload & analysis endpoint
│       ├── save-upload.js    # User history tracking
│       ├── demo.js           # Demo mode
│       └── health.js         # Health check
├── lib/
│   ├── audioAnalyzer.js      # Node.js wrapper for Python analysis
│   ├── songRecognitionFree.js # Pattern-based song recognition
│   ├── recommendationEngine.js # Recommendation scoring
│   ├── dynamicMusicSearch.js # iTunes search integration
│   ├── musicApiService.js    # iTunes API client
│   ├── acousticSongsDatabase.js # Static song database & mood categories
│   └── testData.js           # Sample data for testing
├── scripts/
│   └── audio_analyzer.py     # Python audio analysis with librosa
├── styles/
│   ├── globals.css
│   └── Home.module.css
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

No API keys or environment variables required for basic functionality. The app uses the free iTunes Search API.

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

The Python audio analyzer extracts:
- **Tempo**: BPM detection
- **Key**: Musical key (C, D, E, etc.)
- **Mode**: Major or minor
- **Chords**: Likely chord progression
- **Brightness**: Spectral centroid
- **Energy**: RMS energy level
- **Vibe Tags**: Descriptive characteristics (e.g., dark, bright, mellow, energetic)
- **Playing Style**: Fingerstyle detection
- **Fingerprint**: Chromagram-based audio fingerprint

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
