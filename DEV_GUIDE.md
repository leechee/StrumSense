# Development Guide

## Running the App in Development

### Start the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Requirements
- Conda environment `strumsense` must be created
- OpenAI API key in `.env.local`
- Node.js 18+

## Testing Without Audio Upload

### Demo Mode API
Test the recommendation engine without uploading audio:

```bash
# Slow fingerstyle, chill mood
curl "http://localhost:3000/api/demo?style=slow_fingerstyle&mood=chill"

# Upbeat strumming, happy mood
curl "http://localhost:3000/api/demo?style=upbeat_strumming&mood=happy"

# Melancholic minor, sad mood
curl "http://localhost:3000/api/demo?style=melancholic_minor&mood=sad"
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Project Architecture

### Frontend Flow
1. User uploads audio in `pages/index.js`
2. FormData sent to `/api/analyze-audio`
3. Results displayed with recommendations

### Backend Flow
1. `/api/analyze-audio` receives file
2. Saves to `uploads/` temporarily
3. Calls `lib/audioAnalyzer.js`
4. Spawns Python process via conda
5. `scripts/audio_analyzer.py` runs librosa analysis
6. Returns JSON with audio features
7. `lib/songRecognition.js` calls OpenAI
8. `lib/recommendationEngine.js` scores songs
9. Returns top 10 recommendations
10. `/api/save-upload` stores user history

## Key Files to Modify

### Add more songs:
Edit `lib/acousticSongsDatabase.js`

```javascript
{
 title: "Song Name",
 artist: "Artist Name",
 difficulty: "beginner", // or intermediate, advanced
 chords: ["G", "C", "D"],
 keySignature: "G major",
 tempo: 120,
 vibe: ["upbeat", "bright"],
 genre: ["pop"],
 mood: ["happy", "energetic"],
 strummingPattern: "down-down-up-up-down-up",
 capo: 0,
 techniques: ["strumming"]
}
```

### Adjust recommendation scoring:
Edit `lib/recommendationEngine.js`

Functions to modify:
- `calculateTempoSimilarity()` - Adjust tempo weights
- `calculateMoodMatch()` - Adjust mood scoring
- `calculateDifficultyBonus()` - Adjust difficulty matching

### Change audio analysis:
Edit `scripts/audio_analyzer.py`

Key sections:
- Tempo detection: `librosa.beat.beat_track()`
- Key detection: Chroma feature analysis
- Vibe tags: Based on brightness, energy, tempo

### Modify UI styling:
Edit `styles/Home.module.css`

Key classes:
- `.container` - Main layout
- `.uploadBox` - File upload area
- `.songRecommendation` - Song cards
- `.moodButton` - Mood selector buttons

## Environment Variables

### Required:
```
OPENAI_API_KEY=sk-...
```

### Optional:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

## Conda Environment Management

### Activate environment:
```bash
conda activate strumsense
```

### Install new Python package:
```bash
conda run -n strumsense pip install package-name
```

### List installed packages:
```bash
conda run -n strumsense pip list
```

### Update package:
```bash
conda run -n strumsense pip install --upgrade package-name
```

## Debugging

### Check Python script directly:
```bash
conda run -n strumsense python scripts/audio_analyzer.py path/to/audio.mp3
```

### View Node.js logs:
```bash
npm run dev
# Logs appear in terminal
```

### Check user history:
```bash
cat data/user-history.json
```

### Clear user history:
```bash
rm data/user-history.json
```

### Clear uploads:
```bash
rm uploads/*
```

## Common Issues

### Python script fails
- Check conda environment exists: `conda env list`
- Verify librosa installed: `conda run -n strumsense pip show librosa`
- Test script manually (see debugging section)

### OpenAI API errors
- Verify API key in `.env.local`
- Check API credits at platform.openai.com
- Look for rate limit errors in logs

### File upload fails
- Check file size < 10MB
- Verify `uploads/` directory exists
- Check file format (MP3, WAV, M4A)

### Recommendations seem off
- Adjust scoring weights in `recommendationEngine.js`
- Add more songs to database
- Check audio analysis output

## Adding New Features

### Add new mood:
1. Add to `moods` array in `pages/index.js`
2. Add to `moodCategories` in `lib/acousticSongsDatabase.js`
3. Update songs' `mood` arrays

### Add new difficulty level:
1. Add to `difficultyLevels` in `lib/acousticSongsDatabase.js`
2. Update `calculateDifficultyBonus()` logic
3. Update difficulty detection in `lib/audioAnalyzer.js`

### Add new audio feature:
1. Extract in `scripts/audio_analyzer.py` with librosa
2. Add to returned JSON
3. Use in `lib/recommendationEngine.js` for scoring

### Add user authentication:
1. Install auth library (NextAuth.js)
2. Replace localStorage userId with session
3. Store user data per authenticated user
4. Add user dashboard page

## Performance Optimization

### Speed up audio analysis:
- Reduce duration: Change `librosa.load(duration=30)`
- Lower sample rate: Change `sr=22050` to `sr=16000`
- Skip features: Remove unused librosa computations

### Speed up recommendations:
- Cache song database
- Limit database size
- Optimize scoring calculations

### Reduce API costs:
- Use GPT-3.5 instead of GPT-4
- Cache common queries
- Skip recognition for known songs

## Deployment Checklist

- [ ] Set environment variables in Vercel
- [ ] Test health endpoint
- [ ] Test demo endpoint
- [ ] Upload sample audio file
- [ ] Verify recommendations quality
- [ ] Check mobile responsiveness
- [ ] Test file upload limits
- [ ] Monitor API usage

## File Size Reference

- **Frontend**: ~150 lines (index.js)
- **Styles**: ~600 lines (Home.module.css)
- **Song Database**: 30+ songs, ~400 lines
- **Recommendation Engine**: ~300 lines
- **Audio Analyzer**: ~150 lines (Python)
- **Total**: ~2000 lines of code

## Development Workflow

1. Make code changes
2. Save files (auto-reload in dev mode)
3. Test in browser at localhost:3000
4. Check console for errors
5. Test audio upload flow
6. Verify recommendations
7. Commit to git
8. Deploy to Vercel

## Git Workflow

```bash
# Stage changes
git add .

# Commit
git commit -m "Add feature X"

# Push
git push origin main

# Deploy automatically via Vercel
```

## Database Schema (User History)

```json
{
 "user_id": {
 "uploads": [
 {
 "timestamp": "2024-01-01T00:00:00Z",
 "audioFeatures": { ... },
 "recognizedSong": { ... }
 }
 ],
 "preferences": {
 "averageTempo": 85,
 "favoriteKeys": { "G": 3, "C": 2 },
 "commonChords": { "G": 5, "C": 4 },
 "difficultyRange": { "min": 0, "max": 10 },
 "genres": { "folk": 3 },
 "moods": { "chill": 5 }
 }
 }
}
```

---

Happy coding! 
