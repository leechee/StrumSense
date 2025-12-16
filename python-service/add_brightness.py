import os
import json
import librosa
import numpy as np
from tqdm import tqdm

AUDIO_DIR = 'song_database/audio'
EMBEDDINGS_FILE = 'song_database/embeddings.json'

print("Loading embeddings database...")
with open(EMBEDDINGS_FILE, 'r') as f:
    embeddings_db = json.load(f)

print(f"Loaded {len(embeddings_db)} songs")

def extract_brightness(audio_path):
    y, sr = librosa.load(audio_path, duration=30.0, sr=22050, mono=True)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)
    brightness = float(np.mean(spectral_centroid))
    return round(brightness, 1)

updated_count = 0
for song_id, song_data in tqdm(embeddings_db.items(), desc="Adding brightness"):
    audio_path = os.path.join(AUDIO_DIR, f"{song_id}.mp3")

    if os.path.exists(audio_path):
        try:
            brightness = extract_brightness(audio_path)
            embeddings_db[song_id]['brightness'] = brightness
            updated_count += 1
        except Exception as e:
            print(f"\nFailed to process {song_id}: {e}")
    else:
        print(f"\nAudio file not found for {song_id}")

print(f"\nUpdated {updated_count} songs with brightness")

with open(EMBEDDINGS_FILE, 'w') as f:
    json.dump(embeddings_db, f, indent=2)

print(f"Saved to {EMBEDDINGS_FILE}")
