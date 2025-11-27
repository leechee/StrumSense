# StrumSense

AI-powered music recommendation app using audio fingerprinting.

## Features

- Audio fingerprinting (Chromaprint)
- Song identification (AcoustID)
- Music metadata (MusicBrainz)
- Album artwork (Cover Art Archive)

## Tech Stack

- Next.js 14 + React
- Python 3.11 + librosa
- AcoustID + MusicBrainz

## Setup

```bash
npm install
pip install librosa numpy scipy pyacoustid
echo "ACOUSTID_API_KEY=your_key" > .env.local
npm run dev
```

## License

MIT
