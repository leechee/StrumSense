# StrumSense

AI-powered acoustic guitar song recommendation system using deep learning audio analysis.

## Features

- Deep audio analysis with OpenL3 embeddings (512-dimensional audio fingerprints)
- Hybrid similarity matching (OpenL3 + librosa features)
- Tempo, key, energy, and brightness detection
- Music metadata from Last.fm
- Async processing with job polling

## Tech Stack

- **Frontend**: Next.js 14 + React
- **Backend**: Python 3.11 Flask service (deployed on Render)
- **Audio Analysis**: OpenL3, librosa, TensorFlow
- **Metadata**: Last.fm API
- **Deployment**: Vercel (frontend) + Render (Python service)

## Setup

### 1. Install Dependencies

```bash
# Frontend
npm install

# Python service
cd python-service
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env.local`:
```bash
LASTFM_API_KEY=your_lastfm_api_key
PYTHON_SERVICE_URL=http://localhost:5000  # For local dev
```

### 3. Run Locally

```bash
# Terminal 1: Start Python service
cd python-service
python app.py

# Terminal 2: Start Next.js dev server
npm run dev
```

## Production Deployment

- Frontend deployed on Vercel
- Python service deployed on Render with Docker
- Pre-computed embeddings database included in Docker image

## License

MIT
