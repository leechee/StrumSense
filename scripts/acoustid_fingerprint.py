"""
AcoustID audio fingerprinting implementation
Uses Chromaprint for fingerprinting compatible with AcoustID database
"""

import acoustid
import librosa
import numpy as np
import sys
import json

def extract_audio_features(audio_path):
    """
    Extract comprehensive audio features including AcoustID fingerprint
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        # Get duration
        duration = float(librosa.get_duration(y=y, sr=sr))

        # Generate Chromaprint fingerprint compatible with AcoustID
        try:
            # pyacoustid.fingerprint returns (duration, fingerprint_string)
            fp_duration, fingerprint = acoustid.fingerprint_file(audio_path)
            # Ensure fingerprint is a string, not bytes
            if isinstance(fingerprint, bytes):
                fingerprint = fingerprint.decode('utf-8')
        except Exception as e:
            # Fallback if fingerprinting fails
            fingerprint = None
            print(f"Warning: Fingerprinting failed: {e}", file=sys.stderr)

        # Extract audio features for matching

        # Tempo (BPM)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(tempo) if isinstance(tempo, (int, float, np.number)) else float(tempo[0]) if hasattr(tempo, '__len__') else float(tempo)

        # Key and mode detection using harmonic analysis
        # Use harmonic-percussive separation for cleaner pitch detection
        y_harmonic = librosa.effects.harmonic(y)
        chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=512)

        # Weight later frames more (chorus/hook usually has clearer tonality)
        weights = np.linspace(0.5, 1.5, chroma.shape[1])
        chroma_weighted = chroma * weights

        # Sum weighted chroma
        chroma_vals = np.sum(chroma_weighted, axis=1)
        chroma_vals = chroma_vals / np.sum(chroma_vals)

        # Krumhansl-Schmuckler key profiles
        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

        major_profile = major_profile / np.sum(major_profile)
        minor_profile = minor_profile / np.sum(minor_profile)

        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        max_corr = -1
        key = 'A'  # Default to A
        mode = 'Minor'  # Default to Minor for this song

        correlations = []
        for i in range(12):
            rotated_chroma = np.roll(chroma_vals, -i)

            corr_major = np.corrcoef(rotated_chroma, major_profile)[0, 1]
            corr_minor = np.corrcoef(rotated_chroma, minor_profile)[0, 1]

            correlations.append((keys[i], 'Major', corr_major))
            correlations.append((keys[i], 'Minor', corr_minor))

            if corr_major > max_corr:
                max_corr = corr_major
                key = keys[i]
                mode = 'Major'

            if corr_minor > max_corr:
                max_corr = corr_minor
                key = keys[i]
                mode = 'Minor'

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

        return {
            'success': True,
            'fingerprint': {
                'chromaprint': fingerprint,
                'duration': duration
            },
            'features': {
                'tempo': tempo,
                'key': key,
                'mode': mode,
                'energy': energy,
                'brightness': brightness,
                'roughness': roughness,
                'contrast': contrast,
                'duration': duration,
                'mfcc': mfcc_mean
            }
        }

    except Exception as e:
        import traceback
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error in extract_audio_features: {error_details}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'error': 'Usage: python acoustid_fingerprint.py <audio_file>'}))
        sys.exit(1)

    audio_path = sys.argv[1]
    result = extract_audio_features(audio_path)
    print(json.dumps(result))
