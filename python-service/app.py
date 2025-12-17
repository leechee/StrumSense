from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
import numpy as np
import openl3
import librosa
import uuid
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)

EMBEDDINGS_DB = {}
EMBEDDINGS_FILE = 'song_database/embeddings.json'

# Job storage for async processing
JOBS = {}  # {job_id: {status, result, error, created_at}}

print("=" * 50)
print("Starting StrumSense Audio Analysis Service")
print(f"Working directory: {os.getcwd()}")
print(f"Files in current directory: {os.listdir('.')}")
if os.path.exists('song_database'):
    print(f"Files in song_database: {os.listdir('song_database')}")
print("=" * 50)

print("Loading song embeddings database...")
if os.path.exists(EMBEDDINGS_FILE):
    with open(EMBEDDINGS_FILE, 'r') as f:
        EMBEDDINGS_DB = json.load(f)
    print(f"✓ Loaded {len(EMBEDDINGS_DB)} song embeddings")
else:
    print(f"✗ Warning: {EMBEDDINGS_FILE} not found")
    print(f"Current directory contents: {os.listdir('.')}")

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'StrumSense Audio Analysis',
        'status': 'running',
        'embeddings_loaded': len(EMBEDDINGS_DB) > 0,
        'total_songs': len(EMBEDDINGS_DB)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'embeddings_loaded': len(EMBEDDINGS_DB) > 0,
        'total_songs': len(EMBEDDINGS_DB)
    })

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name

        try:
            y, sr = librosa.load(tmp_path, sr=None, mono=True)
            duration = float(librosa.get_duration(y=y, sr=sr))

            print("Extracting Librosa features...")
            audio_features = extract_librosa_features(tmp_path)

            print("Extracting OpenL3 embedding...")
            openl3_embedding = extract_openl3_embedding(tmp_path)

            similar_songs = []
            if openl3_embedding:
                similar_songs = get_similar_songs(openl3_embedding, audio_features, top_k=10)

            result = {
                'success': True,
                'duration': duration,
                'features': audio_features,
                'similarSongs': similar_songs
            }

            return jsonify(result)

        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        print(f"Error analyzing audio: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/analyze-async', methods=['POST'])
def analyze_audio_async():
    """Start audio analysis in background and return job ID"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']

        # Generate unique job ID
        job_id = str(uuid.uuid4())

        # Save audio file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_path = tmp_file.name

        # Initialize job status
        JOBS[job_id] = {
            'status': 'processing',
            'result': None,
            'error': None,
            'created_at': datetime.now().isoformat()
        }

        # Start background processing
        thread = threading.Thread(target=process_audio_job, args=(job_id, tmp_path))
        thread.daemon = True
        thread.start()

        print(f"Started async job {job_id}")

        return jsonify({
            'job_id': job_id,
            'status': 'processing'
        }), 202  # 202 Accepted

    except Exception as e:
        print(f"Error starting async job: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/job-status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get the status of an async job"""
    if job_id not in JOBS:
        return jsonify({'error': 'Job not found'}), 404

    job = JOBS[job_id]

    response = {
        'job_id': job_id,
        'status': job['status'],
        'created_at': job['created_at']
    }

    if job['status'] == 'completed':
        response['result'] = job['result']
    elif job['status'] == 'failed':
        response['error'] = job['error']

    return jsonify(response)


def process_audio_job(job_id, audio_path):
    """Background worker function to process audio"""
    try:
        print(f"Processing job {job_id}...")

        # Load audio and get duration
        y, sr = librosa.load(audio_path, sr=None, mono=True)
        duration = float(librosa.get_duration(y=y, sr=sr))

        # Extract features
        print(f"Job {job_id}: Extracting Librosa features...")
        audio_features = extract_librosa_features(audio_path)

        print(f"Job {job_id}: Extracting OpenL3 embedding...")
        openl3_embedding = extract_openl3_embedding(audio_path)

        # Find similar songs
        similar_songs = []
        if openl3_embedding:
            similar_songs = get_similar_songs(openl3_embedding, audio_features, top_k=10)

        # Update job with results
        JOBS[job_id]['status'] = 'completed'
        JOBS[job_id]['result'] = {
            'success': True,
            'duration': duration,
            'features': audio_features,
            'similarSongs': similar_songs
        }

        print(f"Job {job_id} completed successfully")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        JOBS[job_id]['status'] = 'failed'
        JOBS[job_id]['error'] = str(e)

    finally:
        # Clean up temp file
        if os.path.exists(audio_path):
            os.unlink(audio_path)


def extract_librosa_features(audio_path):
    # Analyze only first 15 seconds instead of 30 for faster processing
    y, sr = librosa.load(audio_path, duration=15.0, sr=22050, mono=True)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=512)
    tempo = float(tempo) if isinstance(tempo, (int, float, np.number)) else float(tempo[0])

    chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=512)
    chroma_vals = np.sum(chroma, axis=1)
    chroma_vals = chroma_vals / np.sum(chroma_vals)

    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
    major_profile = major_profile / np.sum(major_profile)
    minor_profile = minor_profile / np.sum(minor_profile)

    keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    max_corr = -1
    detected_key = 'C'
    detected_mode = 'Major'

    for i in range(12):
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

    rms = librosa.feature.rms(y=y, hop_length=512)
    energy = float(np.mean(rms))

    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)
    brightness = float(np.mean(spectral_centroid))

    return {
        'tempo': round(tempo, 1),
        'key': detected_key,
        'mode': detected_mode,
        'energy': round(energy, 4),
        'brightness': round(brightness, 1)
    }


def extract_openl3_embedding(audio_path):
    # Use librosa instead of soundfile for better compatibility
    audio, sr = librosa.load(audio_path, sr=None, mono=True)

    emb, ts = openl3.get_audio_embedding(
        audio,
        sr,
        content_type='music',
        embedding_size=512
    )

    avg_emb = np.mean(emb, axis=0)
    return avg_emb.tolist()


def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


def calculate_librosa_similarity(features1, features2):
    score = 0
    total_weight = 0

    if features1.get('tempo') and features2.get('tempo'):
        tempo_diff = abs(features1['tempo'] - features2['tempo'])
        tempo_similarity = max(0, 1 - (tempo_diff / 100))
        score += 0.3 * tempo_similarity
        total_weight += 0.3

    if features1.get('key') and features2.get('key'):
        key_match = 1.0 if (features1['key'] == features2['key'] and
                           features1['mode'] == features2['mode']) else 0.0
        score += 0.3 * key_match
        total_weight += 0.3

    if features1.get('energy') and features2.get('energy'):
        energy_diff = abs(features1['energy'] - features2['energy'])
        energy_similarity = max(0, 1 - energy_diff)
        score += 0.2 * energy_similarity
        total_weight += 0.2

    if features1.get('brightness') and features2.get('brightness'):
        brightness_diff = abs(features1['brightness'] - features2['brightness'])
        brightness_similarity = max(0, 1 - (brightness_diff / 2000))
        score += 0.2 * brightness_similarity
        total_weight += 0.2

    return score / total_weight if total_weight > 0 else 0


def get_similar_songs(embedding, uploaded_features, top_k=10):
    if not EMBEDDINGS_DB or not embedding:
        return []

    similarities = []
    for song_id, song_data in EMBEDDINGS_DB.items():
        openl3_similarity = cosine_similarity(embedding, song_data['embedding'])

        librosa_similarity = calculate_librosa_similarity(uploaded_features, song_data)

        final_similarity = (0.70 * openl3_similarity) + (0.30 * librosa_similarity)

        similarities.append({
            'id': song_id,
            'title': song_data['title'],
            'artist': song_data['artist'],
            'similarity_score': float(final_similarity),
            'openl3_score': float(openl3_similarity),
            'librosa_score': float(librosa_similarity),
            'tempo': song_data.get('tempo'),
            'key': song_data.get('key'),
            'mode': song_data.get('mode'),
            'energy': song_data.get('energy'),
            'brightness': song_data.get('brightness')
        })

    similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
    return similarities[:top_k]


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
