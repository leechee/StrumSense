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

            # Return minimal data - just fingerprint and duration
            # Skip librosa analysis to stay under 60s timeout
            result = {
                'success': True,
                'fingerprint': {
                    'chromaprint': fingerprint,
                    'duration': duration
                },
                'features': {
                    'duration': duration,
                    'tempo': 120,  # Default values - will be determined by song ID later
                    'key': 'C',
                    'mode': 'Major',
                    'energy': 0.5,
                    'brightness': 0.5,
                    'roughness': 0.5,
                    'contrast': 0.5,
                    'mfcc': []
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
