# StrumSense �

## � 100% FREE Acoustic Cover Recommendation App

An AI-powered app that analyzes your guitar playing and suggests personalized songs to cover - **completely free with no API costs!**

##  Features

- **Audio Analysis**: Upload your acoustic cover and get instant analysis of tempo, key, chords, and playing style
- **Song Recognition**: AI pattern matching attempts to identify what song you're playing
- **Smart Recommendations**: Get 10 personalized song recommendations based on:
  - Musical similarity (tempo, key, chords)
  - Your selected mood
  - Playing difficulty
  - Your historical preferences
- **User Profile**: Builds a taste profile over time based on your uploads
- **Rich Database**: 30+ popular acoustic songs with detailed metadata
- **100% Free**: No API keys, no costs, no limits!

## � Tech Stack

- **Frontend**: Next.js, React
- **Backend**: Node.js API routes
- **Audio Analysis**: Python with librosa (ML library - runs locally)
- **AI**: Intelligent rule-based pattern matching (no API costs!)
- **Deployment**: Vercel (free tier)

## � Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11 (via Anaconda/Miniconda)
- **No API keys needed!** �

### Installation

1. Clone the repository:
```bash
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

4. Install Python audio analysis dependencies:
```bash
conda run -n strumsense pip install librosa numpy scipy
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

**Note**: The app uses the `strumsense` conda environment automatically for audio analysis.

## � Usage

1. **Upload Audio**: Click or drag and drop your acoustic cover (MP3, WAV, M4A - max 10MB)
2. **Select Mood** (optional): Choose a mood like happy, sad, chill, romantic, etc.
3. **Get Recommendations**: Click "Get Recommendations" to analyze your playing
4. **View Results**: See your playing style analysis and personalized song recommendations

## � How It Works

### Audio Analysis Pipeline (100% Free!)

1. **Feature Extraction** (Python/librosa ML):
   - Tempo detection using beat tracking
   - Key and mode identification (major/minor)
   - Chroma features for chord detection
   - Spectral analysis (brightness, energy)
   - Playing style detection (fingerstyle vs strumming)
   - **Runs locally - no API calls!**

2. **Song Recognition** (Pattern Matching):
   - Analyzes audio features against known song patterns
   - Matches tempo ranges, keys, chords, and vibe
   - Generates confidence scores
   - **No GPT needed - completely free!**

3. **Recommendation Engine**:
   - Scores 30+ acoustic songs based on:
     - Tempo similarity (±10 BPM = highest score)
     - Key similarity (same key or related keys)
     - Chord overlap
     - Vibe/mood matching
     - Difficulty level
     - User preference history
   - Returns top 10 matches with detailed reasons

4. **User Profiling**:
   - Tracks upload history
   - Learns preferred keys, tempos, genres
   - Improves recommendations over time

## � Project Structure

```
StrumSense/
├── pages/
│   ├── index.js                      # Main UI
│   ├── _app.js                       # Next.js app wrapper (with Analytics)
│   └── api/
│       ├── analyze-audio.js          # Audio upload & analysis
│       ├── save-upload.js            # User history tracking
│       ├── demo.js                   # Demo mode (no upload needed)
│       └── health.js                 # Health check endpoint
│
├── lib/
│   ├── acousticSongsDatabase.js      # 30+ songs with metadata
│   ├── audioAnalyzer.js              # Node.js wrapper for Python
│   ├── songRecognitionFree.js        # FREE pattern matching (no API!)
│   ├── recommendationEngine.js       # Scoring algorithm
│   └── testData.js                   # Sample data
│
├── scripts/
│   └── audio_analyzer.py             # Python librosa analysis
│
├── styles/
│   ├── globals.css
│   └── Home.module.css
│
└── Documentation
    ├── README.md                     # This file
    ├── FREE_DEPLOYMENT.md            # Free deployment guide
    ├── QUICKSTART.md                 # Quick setup
    ├── DEV_GUIDE.md                  # Developer reference
    └── PROJECT_SUMMARY.md            # Detailed overview
```

## � Song Database

30+ carefully curated acoustic songs including:

- **Classics**: Wonderwall, Blackbird, Hotel California, Tears in Heaven
- **Modern**: Thinking Out Loud, Riptide, Let Her Go, Say You Won't Let Go
- **Folk**: Fast Car, The Boxer, Landslide, Hallelujah
- **Indie**: Ho Hey, Skinny Love, Budapest, Home
- **And more!**

Each with complete metadata:
- Chords, tempo, key, capo position
- Difficulty ratings (beginner/intermediate/advanced)
- Playing techniques
- Genre and mood tags

## � Deploy for Free

### Quick Deploy to Vercel (Free Tier)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git
git push -u origin main

# 2. Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod
```

**No environment variables needed!** Just deploy and it works.

See [FREE_DEPLOYMENT.md](FREE_DEPLOYMENT.md) for detailed instructions.

## � Built-in Analytics (Free)

-  **Vercel Analytics** - Track page views and visitors
-  **Speed Insights** - Monitor performance metrics
-  **User Profiles** - Track preferences locally

All included and configured!

## � Why This Approach?

**Free vs Paid Comparison:**

| Feature | With OpenAI API | With Pattern Matching (This App) |
|---------|----------------|----------------------------------|
| **Cost per user** | $0.03-0.04 | $0.00 |
| **1000 users** | $30-40 | $0 |
| **API limits** | Yes | No |
| **Response time** | 3-5 seconds | < 1 second |
| **Privacy** | Data sent to OpenAI | 100% local |
| **Offline capable** | No | Yes (after deploy) |

**Benefits:**
- � Completely free for unlimited users
-  Faster responses (no API latency)
- � More private (no data sharing)
- � No rate limits
- � More reliable (no API downtime)

## � Future Enhancements

Potential free additions:
- Browser-based audio recording
- More song patterns (expand the database!)
- Chord progression visualization
- Practice tracking
- Social sharing
- Mobile app version

## � License

MIT License - Free to use, modify, and distribute!

## � Contributing

Want to add more song patterns? PRs welcome!

Each pattern is simple:
```javascript
{
  title: "Song Name",
  artist: "Artist",
  pattern: {
    tempo: [min, max],
    keys: ["G major"],
    chords: ["G", "C", "D"],
    vibe: ["upbeat", "bright"]
  }
}
```

## � Tips for Best Results

- Upload 30-60 seconds of clear audio
- Play cleanly for better chord detection
- Try different moods for varied recommendations
- Upload multiple covers to build your profile

## � Troubleshooting

### Python/Conda Issues
- Make sure conda environment `strumsense` exists
- Run: `conda create -n strumsense python=3.11 -y`
- Install libraries: `conda run -n strumsense pip install librosa numpy scipy`

### Audio Upload Fails
- Check file size (max 10MB)
- Supported formats: MP3, WAV, M4A

### No Recommendations
- Check Python script is working: `conda run -n strumsense python scripts/audio_analyzer.py`
- Try demo mode: `/api/demo?style=slow_fingerstyle&mood=chill`

## � Documentation

- [FREE_DEPLOYMENT.md](FREE_DEPLOYMENT.md) - Deploy for free guide
- [QUICKSTART.md](QUICKSTART.md) - Quick setup
- [DEV_GUIDE.md](DEV_GUIDE.md) - Developer reference
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Detailed overview

## � Live Demo

After deployment, test these endpoints:

- **Main App**: `https://your-app.vercel.app`
- **Demo Mode**: `https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill`
- **Health Check**: `https://your-app.vercel.app/api/health`

---

**Built with AI to help guitarists discover their next acoustic cover - completely free!** �

**No API keys. No costs. No limits. Just music.** �
