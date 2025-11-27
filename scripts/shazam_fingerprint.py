"""
Shazam-style audio fingerprinting implementation
Based on the research paper: "An Industrial-Strength Audio Search Algorithm"
"""

import librosa
import numpy as np
import sys
import json
from scipy import signal
from scipy.ndimage import maximum_filter

def create_constellation_map(audio_path, sample_rate=22050):
    """
    Create a constellation map of peak frequencies over time
    This is the core of Shazam's algorithm
    """
    # Load audio file
    y, sr = librosa.load(audio_path, sr=sample_rate, mono=True)

    # Create spectrogram using STFT
    # Using parameters similar to Shazam's algorithm
    n_fft = 2048
    hop_length = 512

    # Compute Short-Time Fourier Transform
    D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(D)

    # Convert to log scale (dB)
    magnitude_db = librosa.amplitude_to_db(magnitude, ref=np.max)

    # Find local peaks in the spectrogram
    # These peaks form the "constellation" that Shazam uses
    peaks = find_peaks(magnitude_db)

    # Create fingerprint hashes from peak pairs
    fingerprint_hashes = create_hashes(peaks)

    return fingerprint_hashes, peaks

def find_peaks(magnitude_db, neighborhood_size=20, threshold=-60):
    """
    Find local maxima (peaks) in the spectrogram
    These peaks are the key features for fingerprinting
    """
    # Apply maximum filter to find local peaks
    local_max = maximum_filter(magnitude_db, size=neighborhood_size)

    # Find where the spectrogram equals the local maximum
    # and is above the threshold
    peaks = (magnitude_db == local_max) & (magnitude_db > threshold)

    # Get the coordinates of peaks
    peak_coords = np.argwhere(peaks)

    return peak_coords

def create_hashes(peaks, fan_value=5, time_diff_range=(0, 200)):
    """
    Create hash values from peak pairs
    This is how Shazam creates unique fingerprints

    Each peak is paired with its "fan_value" nearest neighbors in time
    The hash is: (freq1, freq2, time_delta)
    """
    hashes = []

    # Sort peaks by time
    peaks_sorted = peaks[peaks[:, 1].argsort()]

    for i in range(len(peaks_sorted)):
        freq1, time1 = peaks_sorted[i]

        # Look at the next fan_value peaks
        for j in range(1, min(fan_value + 1, len(peaks_sorted) - i)):
            freq2, time2 = peaks_sorted[i + j]

            time_delta = time2 - time1

            # Only create hash if time difference is within range
            if time_diff_range[0] <= time_delta <= time_diff_range[1]:
                # Create hash: (freq1, freq2, time_delta, anchor_time)
                hash_value = {
                    'freq1': int(freq1),
                    'freq2': int(freq2),
                    'time_delta': int(time_delta),
                    'anchor_time': int(time1)
                }
                hashes.append(hash_value)

    return hashes

def extract_audio_features(audio_path):
    """
    Extract comprehensive audio features including Shazam-style fingerprint
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        # Create Shazam-style fingerprint
        fingerprint_hashes, peaks = create_constellation_map(audio_path)

        # Extract additional features for Spotify matching

        # Tempo (BPM)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

        # Key and mode using chroma features
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_index = np.argmax(np.sum(chroma, axis=1))
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key = keys[key_index]

        # Energy and dynamics
        rms = librosa.feature.rms(y=y)[0]
        energy = float(np.mean(rms))

        # Spectral features for mood/timbre
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        brightness = float(np.mean(spectral_centroid))

        # Zero crossing rate (roughness/distortion)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        roughness = float(np.mean(zcr))

        # MFCC for timbre similarity
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = mfcc.mean(axis=1).tolist()

        # Spectral contrast (texture)
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        contrast = float(np.mean(spectral_contrast))

        # Duration
        duration = float(librosa.get_duration(y=y, sr=sr))

        # Create a compact fingerprint signature (first 100 hashes for matching)
        fingerprint_signature = fingerprint_hashes[:100] if len(fingerprint_hashes) > 100 else fingerprint_hashes

        return {
            'success': True,
            'fingerprint': {
                'hashes': fingerprint_signature,
                'total_hashes': len(fingerprint_hashes),
                'total_peaks': len(peaks)
            },
            'features': {
                'tempo': float(tempo),
                'key': key,
                'energy': energy,
                'brightness': brightness,
                'roughness': roughness,
                'contrast': contrast,
                'duration': duration,
                'mfcc': mfcc_mean
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'Usage: python shazam_fingerprint.py <audio_file>'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    result = extract_audio_features(audio_path)
    print(json.dumps(result))
