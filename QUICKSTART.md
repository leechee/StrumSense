# Quick Start Guide

## First Time Setup

1. **Install Node dependencies**:
```bash
npm install
```

2. **Create conda environment** (Python 3.11):
```bash
conda create -n strumsense python=3.11 -y
```

3. **Install Python audio analysis libraries**:
```bash
conda run -n strumsense pip install librosa numpy scipy
```

4. **Set up your OpenAI API Key**:
   - Open `.env.local`
   - Replace `your_openai_api_key_here` with your actual OpenAI API key
   - Get one at: https://platform.openai.com/api-keys

5. **Start the development server**:
```bash
npm run dev
```

6. **Open the app**:
   - Navigate to http://localhost:3000
   - Upload an acoustic guitar recording
   - Get personalized song recommendations!

## Testing the App

### Test Audio Files
You can test with:
- Your own acoustic covers (30-60 seconds is ideal)
- MP3, WAV, or M4A format
- Max file size: 10MB

### What to Expect
1. Upload takes ~10-30 seconds to analyze
2. You'll see:
   - Your playing style analysis (tempo, key, difficulty)
   - Possible song recognition (if confident)
   - 10 recommended songs to cover
   - Match reasons for each recommendation

### Mood Options
Try different moods to get varied recommendations:
- **happy**: Uplifting, bright songs
- **sad**: Emotional, melancholic songs
- **chill**: Mellow, relaxed songs
- **romantic**: Love songs, gentle ballads
- **energetic**: Upbeat, driving songs
- **nostalgic**: Classic, timeless songs
- **inspiring**: Hopeful, motivational songs

## Troubleshooting

### Python/Conda not found
- Make sure Anaconda or Miniconda is installed
- The conda environment `strumsense` must be created with Python 3.11
- Run: `conda create -n strumsense python=3.11 -y`
- Install libraries: `conda run -n strumsense pip install librosa numpy scipy`

### OpenAI API errors
- Check your API key is correct in `.env.local`
- Ensure you have credits in your OpenAI account
- The app uses GPT-4 for recognition, GPT-3.5 for descriptions

### File upload fails
- Check file size (max 10MB)
- Ensure it's an audio file (MP3, WAV, M4A)
- Check the `uploads/` folder exists (created automatically)

### Port already in use
- Kill the process using port 3000, or
- Run on a different port: `npm run dev -- -p 3001`

## Project Architecture

- **Frontend** (pages/index.js): React/Next.js UI
- **API** (pages/api/): Node.js endpoints for upload & analysis
- **Python Analysis** (scripts/audio_analyzer.py): Librosa audio processing
- **Recommendation Engine** (lib/recommendationEngine.js): Smart matching algorithm
- **Song Database** (lib/acousticSongsDatabase.js): 30+ curated acoustic songs

## Next Steps

1. Try uploading different styles of playing
2. See how recommendations change with different moods
3. Upload multiple covers to build your user profile
4. Check your profile in `data/user-history.json`

Enjoy discovering your next acoustic cover! ¸
