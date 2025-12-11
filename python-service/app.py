from flask import Flask, request, jsonify
from flask_cors import CORS
import acoustid
import subprocess
import os
import tempfile
import json
import numpy as np
# from pinecone import Pinecone  # COMMENTED OUT: Using JSON file instead of Pinecone for simplicity
import openl3
import soundfile as sf

app = Flask(__name__)
CORS(app)

ACOUSTID_API_KEY = os.environ.get('ACOUSTID_API_KEY', 'bQjVA25JFn')
GENIUS_API_KEY = os.environ.get('GENIUS_API_KEY', '')
# PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY', '')  # COMMENTED OUT: Not using Pinecone

# Load OpenL3 embeddings from JSON file
print("Loading OpenL3 embeddings database...")
EMBEDDINGS_DB = {}
EMBEDDINGS_FILE = 'song_database/embeddings.json'
if os.path.exists(EMBEDDINGS_FILE):
    try:
        with open(EMBEDDINGS_FILE, 'r') as f:
            EMBEDDINGS_DB = json.load(f)
        print(f"Loaded {len(EMBEDDINGS_DB)} song embeddings from JSON file")
    except Exception as e:
        print(f"Warning: Could not load embeddings: {e}")
else:
    print(f"Warning: {EMBEDDINGS_FILE} not found, OpenL3 recommendations disabled")

# COMMENTED OUT: Pinecone initialization (kept for future scaling)
# print("Initializing Pinecone...")
# pinecone_index = None
# if PINECONE_API_KEY:
#     try:
#         pc = Pinecone(api_key=PINECONE_API_KEY)
#         pinecone_index = pc.Index('strumsense-songs')
#         print("Pinecone connected successfully!")
#     except Exception as e:
#         print(f"Warning: Could not connect to Pinecone: {e}")
# else:
#     print("Warning: PINECONE_API_KEY not set, OpenL3 recommendations disabled")

# Preload BERT model at startup
print("Loading BERT sentiment model...")
try:
    from transformers import pipeline
    sentiment_analyzer = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=-1
    )
    print("BERT model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load BERT model: {e}")
    sentiment_analyzer = None

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
            # Get duration and fingerprint
            import librosa

            # Use librosa to get duration (works on all platforms)
            y, sr = librosa.load(tmp_path, sr=None, mono=True)
            duration = float(librosa.get_duration(y=y, sr=sr))

            # Generate fingerprint using fpcalc
            try:
                fpcalc_cmd = ['fpcalc', '-json', tmp_path]
                fpcalc_output = subprocess.check_output(fpcalc_cmd).decode()
                fpcalc_data = json.loads(fpcalc_output)
                fingerprint = fpcalc_data.get('fingerprint', '')
            except FileNotFoundError:
                print("Warning: fpcalc not found, using empty fingerprint")
                fingerprint = ''

            # Extract audio features using OpenL3
            print("Extracting audio features with OpenL3...")
            audio_features = extract_openl3_features(tmp_path)

            # Try to identify song with AcoustID
            song_info = None
            lyrics = None
            lyric_sentiment = None

            try:
                print("Attempting AcoustID identification...")
                song_info = identify_with_acoustid(fingerprint, duration)

                if song_info and GENIUS_API_KEY:
                    print(f"Song identified: {song_info['artist']} - {song_info['title']}")
                    # Fetch lyrics from Genius
                    lyrics = fetch_lyrics_from_genius(song_info['artist'], song_info['title'])

                    if lyrics:
                        print("Analyzing lyric sentiment with BERT...")
                        lyric_sentiment = analyze_sentiment_bert(lyrics)
            except Exception as e:
                print(f"Identification/lyrics failed: {e}")

            # Extract OpenL3 embedding for similarity search
            print("Extracting OpenL3 embedding for similarity search...")
            openl3_embedding = extract_openl3_embedding(tmp_path)

            # Get similar songs from JSON database (top 20 for Librosa filtering)
            similar_songs = []
            if openl3_embedding:
                similar_songs = get_similar_songs_from_json(openl3_embedding, top_k=20)

            result = {
                'success': True,
                'fingerprint': {
                    'chromaprint': fingerprint,
                    'duration': duration
                },
                'features': {
                    'duration': duration,
                    'tempo': audio_features['tempo'],
                    'key': audio_features['key'],
                    'mode': audio_features['mode'],
                    'energy': audio_features['energy'],
                    'valence': audio_features['valence'],
                    'danceability': audio_features['danceability'],
                    'acousticness': audio_features['acousticness'],
                    'instrumentalness': audio_features['instrumentalness'],
                    'audioMood': audio_features['mood']
                },
                'identification': song_info,
                'lyrics': lyrics,
                'lyricSentiment': lyric_sentiment,
                'similarSongs': similar_songs  # OpenL3-based recommendations
            }

            return jsonify(result)

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        import traceback
        print(f"Error in analyze_audio: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def extract_openl3_features(audio_path):
    """
    Extract audio features using OpenL3 embeddings and librosa
    Returns tempo, key, mode, energy, valence, danceability, etc.
    """
    import librosa
    import numpy as np

    # Load audio (first 30 seconds for speed)
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
        rotated_chroma = np.roll(chroma_vals, -i)
        corr_major = np.corrcoef(rotated_chroma, major_profile)[0, 1]
        corr_minor = np.corrcoef(rotated_chroma, minor_profile)[0, 1]

        if corr_major > max_corr:
            max_corr = corr_major
            detected_key = keys[i]
            detected_mode = 'Major'
        if corr_minor > max_corr:
            max_corr = corr_minor
            detected_key = keys[i]
            detected_mode = 'Minor'

    # Energy (RMS)
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    energy = float(np.mean(rms))

    # Spectral features
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]
    brightness = float(np.mean(spectral_centroid))

    zcr = librosa.feature.zero_crossing_rate(y, hop_length=512)[0]
    zcr_mean = float(np.mean(zcr))

    # Derive Spotify-like features
    # Valence (musical positiveness): based on mode, brightness, tempo
    valence = 0.5
    if detected_mode == 'Major':
        valence += 0.2
    if tempo > 120:
        valence += 0.15
    if brightness > 2000:
        valence += 0.15
    valence = min(1.0, valence)

    # Danceability: based on tempo and beat strength
    beat_strength = float(np.std(librosa.onset.onset_strength(y=y, sr=sr)))
    danceability = min(1.0, (tempo / 180.0) * 0.6 + (beat_strength / 50.0) * 0.4)

    # Acousticness: inverse of spectral complexity
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, hop_length=512)[0]
    acousticness = max(0.0, 1.0 - (float(np.mean(spectral_rolloff)) / 8000.0))

    # Instrumentalness: based on spectral flatness
    spectral_flatness = librosa.feature.spectral_flatness(y=y, hop_length=512)[0]
    instrumentalness = float(np.mean(spectral_flatness))

    # Determine mood from features
    mood = determine_mood(valence, energy, tempo, detected_mode)

    return {
        'tempo': round(tempo, 2),
        'key': detected_key,
        'mode': detected_mode,
        'energy': round(energy, 3),
        'valence': round(valence, 3),
        'danceability': round(danceability, 3),
        'acousticness': round(acousticness, 3),
        'instrumentalness': round(instrumentalness, 3),
        'mood': mood
    }


def determine_mood(valence, energy, tempo, mode):
    """Determine mood from audio features"""
    if valence > 0.6 and energy > 0.6:
        return 'happy'
    elif valence < 0.4 and energy < 0.4:
        return 'sad'
    elif energy > 0.7 and tempo > 120:
        return 'energetic'
    elif energy < 0.4 and tempo < 100:
        return 'chill'
    elif mode == 'Minor' and valence < 0.5:
        return 'melancholic'
    elif valence > 0.5 and energy < 0.5:
        return 'calm'
    else:
        return 'neutral'


def identify_with_acoustid(fingerprint, duration):
    """Identify song using AcoustID"""
    if not fingerprint:
        return None

    try:
        results = acoustid.lookup(ACOUSTID_API_KEY, fingerprint, duration, meta='recordings')

        if results and 'results' in results and len(results['results']) > 0:
            result = results['results'][0]
            if 'recordings' in result and len(result['recordings']) > 0:
                recording = result['recordings'][0]
                return {
                    'title': recording.get('title', 'Unknown'),
                    'artist': recording['artists'][0]['name'] if 'artists' in recording and recording['artists'] else 'Unknown',
                    'id': recording.get('id', ''),
                    'confidence': result.get('score', 0.0)
                }
    except Exception as e:
        print(f"AcoustID lookup failed: {e}")

    return None


def fetch_lyrics_from_genius(artist, title):
    """Fetch lyrics from Genius API"""
    if not GENIUS_API_KEY:
        return None

    try:
        import requests
        from bs4 import BeautifulSoup

        # Search for song on Genius
        search_url = "https://api.genius.com/search"
        headers = {'Authorization': f'Bearer {GENIUS_API_KEY}'}
        params = {'q': f'{artist} {title}'}

        response = requests.get(search_url, headers=headers, params=params, timeout=5)
        if response.status_code != 200:
            return None

        data = response.json()
        if not data['response']['hits']:
            return None

        # Get the song URL
        song_url = data['response']['hits'][0]['result']['url']

        # Scrape lyrics from the song page
        page = requests.get(song_url, timeout=5)
        html = BeautifulSoup(page.text, 'html.parser')

        # Find lyrics container (Genius uses specific div classes)
        lyrics_divs = html.find_all('div', {'data-lyrics-container': 'true'})
        if not lyrics_divs:
            return None

        lyrics = '\n'.join([div.get_text(separator='\n') for div in lyrics_divs])
        return lyrics.strip()

    except Exception as e:
        print(f"Genius lyrics fetch failed: {e}")
        return None


def analyze_sentiment_bert(lyrics):
    """Analyze lyric sentiment using a lightweight sentiment model"""
    if not lyrics or sentiment_analyzer is None:
        return None

    try:
        # Analyze first 512 characters to stay fast
        truncated_lyrics = lyrics[:512]
        result = sentiment_analyzer(truncated_lyrics)[0]

        # Map to our sentiment labels
        label = result['label'].lower()
        confidence = result['score']

        # Determine detailed sentiment
        if label == 'positive':
            if confidence > 0.8:
                sentiment = 'very_positive'
            else:
                sentiment = 'positive'
        else:
            if confidence > 0.8:
                sentiment = 'very_negative'
            else:
                sentiment = 'negative'

        # Map to mood
        mood_map = {
            'very_positive': 'joyful',
            'positive': 'uplifting',
            'negative': 'melancholic',
            'very_negative': 'sad'
        }

        return {
            'sentiment': sentiment,
            'confidence': round(confidence, 3),
            'mood': mood_map.get(sentiment, 'neutral')
        }

    except Exception as e:
        print(f"BERT sentiment analysis failed: {e}")
        return None


def extract_openl3_embedding(audio_path):
    """Extract OpenL3 embedding from audio file"""
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
        print(f"OpenL3 embedding extraction failed: {e}")
        return None


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


def get_similar_songs_from_json(embedding, top_k=50):
    """Find similar songs using cosine similarity from JSON embeddings"""
    if not EMBEDDINGS_DB or not embedding:
        print("No embeddings database loaded or no embedding provided")
        return []

    try:
        # Calculate similarity scores for all songs
        similarities = []
        for song_id, song_data in EMBEDDINGS_DB.items():
            similarity = cosine_similarity(embedding, song_data['embedding'])
            similarities.append({
                'id': song_id,
                'title': song_data['title'],
                'artist': song_data['artist'],
                'playcount': song_data['playcount'],
                'rank': song_data['rank'],
                'similarity_score': float(similarity),
                'tempo': song_data.get('tempo'),
                'key': song_data.get('key'),
                'mode': song_data.get('mode')
            })

        # Sort by similarity score (descending)
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)

        # Return top_k results
        top_songs = similarities[:top_k]
        print(f"Found {len(top_songs)} similar songs from JSON database")
        return top_songs

    except Exception as e:
        print(f"JSON similarity search failed: {e}")
        return []


# COMMENTED OUT: Pinecone version (kept for future scaling)
# def get_similar_songs_from_pinecone(embedding, top_k=50):
#     """Query Pinecone for similar songs based on OpenL3 embedding"""
#     if not pinecone_index or not embedding:
#         return []
#
#     try:
#         # Query Pinecone
#         results = pinecone_index.query(
#             vector=embedding,
#             top_k=top_k,
#             include_metadata=True
#         )
#
#         # Format results
#         similar_songs = []
#         for match in results['matches']:
#             similar_songs.append({
#                 'id': match['id'],
#                 'title': match['metadata']['title'],
#                 'artist': match['metadata']['artist'],
#                 'playcount': match['metadata']['playcount'],
#                 'rank': match['metadata']['rank'],
#                 'similarity_score': match['score']
#             })
#
#         print(f"Found {len(similar_songs)} similar songs from Pinecone")
#         return similar_songs
#     except Exception as e:
#         print(f"Pinecone query failed: {e}")
#         return []


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
