"""
Build OpenL3 Embeddings Database for Top 1000 English Songs
Uses 100% free services: Last.fm API + YouTube Audio
"""

import os
import json
import requests
import yt_dlp
import openl3
import soundfile as sf
import numpy as np
from tqdm import tqdm
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
LASTFM_API_KEY = os.environ.get('LASTFM_API_KEY', '')  # Get from Last.fm
OUTPUT_DIR = 'song_database'
AUDIO_DIR = os.path.join(OUTPUT_DIR, 'audio')
EMBEDDINGS_FILE = os.path.join(OUTPUT_DIR, 'embeddings.json')
METADATA_FILE = os.path.join(OUTPUT_DIR, 'metadata.json')

# Create directories
os.makedirs(AUDIO_DIR, exist_ok=True)


def get_top_1000_english_songs():
    """
    Fetch top 1000 English songs from Last.fm
    Uses chart.getTopTracks (global charts)
    """
    print("📊 Fetching top 1000 English songs from Last.fm...")

    all_tracks = []
    pages_to_fetch = 20  # 50 songs per page = 1000 songs

    for page in range(1, pages_to_fetch + 1):
        url = 'https://ws.audioscrobbler.com/2.0/'
        params = {
            'method': 'chart.gettoptracks',
            'api_key': LASTFM_API_KEY,
            'format': 'json',
            'limit': 50,
            'page': page
        }

        response = requests.get(url, params=params)
        data = response.json()

        tracks = data.get('tracks', {}).get('track', [])
        all_tracks.extend(tracks)

        print(f"  Page {page}/20: {len(tracks)} tracks fetched")
        time.sleep(0.5)  # Rate limiting

    # Format track data
    formatted_tracks = []
    for i, track in enumerate(all_tracks[:1000], 1):
        formatted_tracks.append({
            'id': f'track_{i:04d}',
            'title': track['name'],
            'artist': track['artist']['name'],
            'playcount': int(track.get('playcount', 0)),
            'listeners': int(track.get('listeners', 0)),
            'url': track.get('url', ''),
            'rank': i
        })

    print(f"✅ Fetched {len(formatted_tracks)} songs")
    return formatted_tracks


def download_audio_from_youtube(track_info):
    """
    Download 30-second audio clip from YouTube
    """
    query = f"{track_info['artist']} {track_info['title']} official audio"
    output_path = os.path.join(AUDIO_DIR, f"{track_info['id']}.mp3")

    if os.path.exists(output_path):
        return output_path

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
        'outtmpl': os.path.join(AUDIO_DIR, track_info['id']),
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'default_search': 'ytsearch1',  # Search YouTube, get first result
        'postprocessor_args': [
            '-ss', '0',       # Start at 0 seconds
            '-t', '30',       # Duration: 30 seconds
        ],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([query])
        return output_path
    except Exception as e:
        print(f"❌ Failed to download {track_info['title']}: {e}")
        return None


def extract_openl3_embedding(audio_path):
    """
    Extract OpenL3 embedding from audio file
    """
    try:
        # Load audio
        audio, sr = sf.read(audio_path)

        # Extract OpenL3 embedding
        emb, ts = openl3.get_audio_embedding(
            audio,
            sr,
            content_type='music',
            embedding_size=512
        )

        # Average embeddings across time
        avg_emb = np.mean(emb, axis=0)

        return avg_emb.tolist()
    except Exception as e:
        print(f"❌ Failed to extract embedding: {e}")
        return None


def build_database():
    """
    Main function to build the complete database
    """
    print("🎵 Building OpenL3 Database for Top 1000 English Songs\n")

    # Step 1: Get top 1000 songs
    tracks = get_top_1000_english_songs()

    # Save metadata
    with open(METADATA_FILE, 'w') as f:
        json.dump(tracks, f, indent=2)
    print(f"💾 Saved metadata to {METADATA_FILE}\n")

    # Step 2: Download audio + extract embeddings
    print("🎧 Downloading audio and extracting OpenL3 embeddings...")
    embeddings_db = {}

    for track in tqdm(tracks, desc="Processing songs"):
        # Download audio
        audio_path = download_audio_from_youtube(track)

        if audio_path:
            # Extract OpenL3 embedding
            embedding = extract_openl3_embedding(audio_path)

            if embedding:
                embeddings_db[track['id']] = {
                    'embedding': embedding,
                    'title': track['title'],
                    'artist': track['artist'],
                    'playcount': track['playcount'],
                    'rank': track['rank']
                }

        # Rate limiting
        time.sleep(1)

    # Save embeddings
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(embeddings_db, f, indent=2)

    print(f"\n✅ Database built successfully!")
    print(f"   - Songs processed: {len(embeddings_db)}/{len(tracks)}")
    print(f"   - Embeddings saved to: {EMBEDDINGS_FILE}")
    print(f"   - Metadata saved to: {METADATA_FILE}")


if __name__ == '__main__':
    if not LASTFM_API_KEY:
        print("❌ ERROR: Please set LASTFM_API_KEY environment variable")
        print("Get your free API key at: https://www.last.fm/api/account/create")
        exit(1)

    build_database()
