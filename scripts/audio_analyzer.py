import sys
import json
import librosa
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def analyze_audio(file_path):
    try:
        y, sr = librosa.load(file_path, duration=60, sr=22050)

        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)

        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key_index = np.argmax(chroma_mean)
        detected_key = key_names[key_index]

        major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
        minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

        major_corr = np.corrcoef(chroma_mean, major_profile)[0, 1]
        minor_corr = np.corrcoef(chroma_mean, minor_profile)[0, 1]

        mode = 'major' if major_corr > minor_corr else 'minor'

        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        brightness = float(np.mean(spectral_centroid))

        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)
        rolloff_mean = float(np.mean(spectral_rolloff))

        zcr = librosa.feature.zero_crossing_rate(y)
        zcr_mean = float(np.mean(zcr))

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = [float(x) for x in np.mean(mfcc, axis=1)]

        rms = librosa.feature.rms(y=y)
        energy = float(np.mean(rms))

        chroma_list = chroma_mean.tolist()
        top_3_chroma_indices = np.argsort(chroma_mean)[-3:][::-1]
        likely_chords = [key_names[i] for i in top_3_chroma_indices]

        vibe_tags = []
        if brightness > 2000:
            vibe_tags.append('bright')
        elif brightness < 1500:
            vibe_tags.append('dark')
        else:
            vibe_tags.append('warm')

        if tempo < 80:
            vibe_tags.append('slow')
            vibe_tags.append('mellow')
        elif tempo > 120:
            vibe_tags.append('upbeat')
            vibe_tags.append('energetic')
        else:
            vibe_tags.append('moderate-tempo')

        if energy > 0.15:
            vibe_tags.append('energetic')
        elif energy < 0.05:
            vibe_tags.append('gentle')

        if zcr_mean > 0.1:
            vibe_tags.append('percussive')
        else:
            vibe_tags.append('smooth')

        if mode == 'minor':
            vibe_tags.append('melancholic')
        else:
            vibe_tags.append('happy')

        is_fingerstyle = False
        if zcr_mean < 0.08 and energy < 0.1:
            is_fingerstyle = True
            vibe_tags.append('fingerstyle')

        result = {
            'tempo': float(tempo),
            'key': detected_key,
            'mode': mode,
            'keySignature': f"{detected_key} {mode}",
            'brightness': brightness,
            'energy': energy,
            'likelyChords': likely_chords,
            'chromaFeatures': chroma_list,
            'vibe': vibe_tags,
            'isFingerstyle': is_fingerstyle,
            'spectralFeatures': {
                'centroid': brightness,
                'rolloff': rolloff_mean,
                'zcr': zcr_mean
            },
            'mfcc': mfcc_mean
        }

        return result

    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)

    file_path = sys.argv[1]
    result = analyze_audio(file_path)
    print(json.dumps(result))
