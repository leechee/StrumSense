from flask import Flask, request, jsonify
from flask_cors import CORS
import acoustid
import chromaprint
import subprocess
import os
import tempfile
import json

app = Flask(__name__)
CORS(app)  # Allow requests from Vercel

ACOUSTID_API_KEY = os.environ.get('ACOUSTID_API_KEY', 'bQjVA25JFn')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    try:
        # Get uploaded file
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name

        try:
            # Get duration using ffprobe
            duration_cmd = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                tmp_path
            ]
            duration = float(subprocess.check_output(duration_cmd).decode().strip())

            # Generate fingerprint using fpcalc
            fpcalc_cmd = ['fpcalc', '-json', tmp_path]
            fpcalc_output = subprocess.check_output(fpcalc_cmd).decode()
            fpcalc_data = json.loads(fpcalc_output)

            fingerprint = fpcalc_data.get('fingerprint', '')

            # Analyze audio features (tempo, key, energy)
            # Using librosa for audio analysis - optimized for speed
            import librosa
            import numpy as np

            # Load only first 30 seconds for faster analysis
            y, sr = librosa.load(tmp_path, duration=30.0, sr=22050)

            # Get tempo - use faster onset detection
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=1024)

            # Get key using simple chromagram (faster than CQT)
            chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=1024)
            key_index = int(np.argmax(np.sum(chroma, axis=1)))
            keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            key = keys[key_index]

            # Get energy
            rms = librosa.feature.rms(y=y, hop_length=1024)
            energy = float(np.mean(rms))

            result = {
                'success': True,
                'fingerprint': {
                    'fingerprint': fingerprint,
                    'total_hashes': len(fingerprint) // 4 if fingerprint else 0,
                    'total_peaks': fpcalc_data.get('duration', 0)
                },
                'features': {
                    'duration': duration,
                    'tempo': float(tempo),
                    'key': key,
                    'energy': energy
                }
            }

            return jsonify(result)

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
