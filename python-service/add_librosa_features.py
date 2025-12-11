"""
Add Librosa features (tempo, key, energy) to existing embeddings.json
This is a one-time script to enrich the database
"""

import os
import json
import librosa
import numpy as np
from tqdm import tqdm

EMBEDDINGS_FILE = 'song_database/embeddings.json'
AUDIO_DIR = 'song_database/audio'


def extract_librosa_features(audio_path):
    """Extract tempo, key, and energy from audio file"""
    try:
        # Load audio (first 30 seconds)
        y, sr = librosa.load(audio_path, duration=30.0, sr=22050, mono=True)

        # Tempo detection
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=512)
        tempo = float(tempo) if isinstance(tempo, (int, float, np.number)) else float(tempo[0])

        # Key detection using chroma
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=512)
        chroma_vals = np.sum(chroma, axis=1)
        chroma_vals = chroma_vals / np.sum(chroma_vals)

        # Krumhansl-Schmuckler key profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
        major_profile = major_profile / np.sum(major_profile)
        minor_profile = minor_profile / np.sum(minor_profile)

        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        max_corr = -1
        detected_key = 'C'
        detected_mode = 'Major'

        for i in range(12):
            # Rotate profiles to test all keys
            major_rotated = np.roll(major_profile, i)
            minor_rotated = np.roll(minor_profile, i)

            major_corr = np.correlate(chroma_vals, major_rotated)[0]
            minor_corr = np.correlate(chroma_vals, minor_rotated)[0]

            if major_corr > max_corr:
                max_corr = major_corr
                detected_key = keys[i]
                detected_mode = 'Major'

            if minor_corr > max_corr:
                max_corr = minor_corr
                detected_key = keys[i]
                detected_mode = 'Minor'

        # Energy (RMS)
        rms = librosa.feature.rms(y=y, hop_length=512)
        energy = float(np.mean(rms))

        return {
            'tempo': round(tempo, 1),
            'key': detected_key,
            'mode': detected_mode,
            'energy': round(energy, 4)
        }
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None


def main():
    print("Adding Librosa features to embeddings.json...")
    print(f"Loading embeddings from {EMBEDDINGS_FILE}...")

    # Load existing embeddings
    with open(EMBEDDINGS_FILE, 'r') as f:
        embeddings_db = json.load(f)

    print(f"Loaded {len(embeddings_db)} song embeddings")
    print("\nExtracting Librosa features for each song...")

    updated_count = 0
    failed_count = 0

    for song_id, song_data in tqdm(embeddings_db.items(), desc="Processing songs"):
        # Find corresponding audio file
        audio_file = os.path.join(AUDIO_DIR, f"{song_id}.mp3")

        if not os.path.exists(audio_file):
            print(f"\nWarning: Audio file not found for {song_id}")
            failed_count += 1
            continue

        # Extract features if not already present
        if 'tempo' not in song_data or song_data['tempo'] is None:
            features = extract_librosa_features(audio_file)

            if features:
                song_data['tempo'] = features['tempo']
                song_data['key'] = features['key']
                song_data['mode'] = features['mode']
                song_data['energy'] = features['energy']
                updated_count += 1
            else:
                failed_count += 1

    print(f"\n\nSuccessfully added features to {updated_count} songs")
    print(f"Failed to process {failed_count} songs")

    # Save updated embeddings
    print(f"\nSaving updated embeddings to {EMBEDDINGS_FILE}...")
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(embeddings_db, f, indent=2)

    print("Done! Librosa features have been added to the database.")


if __name__ == '__main__':
    main()
