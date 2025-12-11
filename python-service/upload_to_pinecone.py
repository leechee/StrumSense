"""
Upload OpenL3 embeddings to Pinecone vector database
"""

import os
import json
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY', '')
PINECONE_ENVIRONMENT = os.environ.get('PINECONE_ENVIRONMENT', 'us-east-1')
INDEX_NAME = 'strumsense-songs'

EMBEDDINGS_FILE = 'song_database/embeddings.json'


def upload_embeddings():
    """Upload all embeddings to Pinecone"""

    if not PINECONE_API_KEY:
        print("ERROR: Please set PINECONE_API_KEY environment variable")
        print("Get your free API key at: https://www.pinecone.io/")
        exit(1)

    print("Uploading OpenL3 embeddings to Pinecone...\n")

    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # Check if index exists, create if not
    existing_indexes = [index.name for index in pc.list_indexes()]

    if INDEX_NAME not in existing_indexes:
        print(f"Creating new index: {INDEX_NAME}")
        pc.create_index(
            name=INDEX_NAME,
            dimension=512,  # OpenL3 embedding size
            metric='cosine',  # Cosine similarity for audio embeddings
            spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )
        print("Index created successfully!\n")
    else:
        print(f"Index {INDEX_NAME} already exists\n")

    # Connect to index
    index = pc.Index(INDEX_NAME)

    # Load embeddings
    print(f"Loading embeddings from {EMBEDDINGS_FILE}...")
    with open(EMBEDDINGS_FILE, 'r') as f:
        embeddings_db = json.load(f)

    print(f"Loaded {len(embeddings_db)} song embeddings\n")

    # Prepare vectors for upload
    print("Uploading vectors to Pinecone...")
    vectors_to_upsert = []

    for song_id, song_data in tqdm(embeddings_db.items(), desc="Preparing vectors"):
        vector = {
            'id': song_id,
            'values': song_data['embedding'],
            'metadata': {
                'title': song_data['title'],
                'artist': song_data['artist'],
                'playcount': song_data['playcount'],
                'rank': song_data['rank']
            }
        }
        vectors_to_upsert.append(vector)

    # Upload in batches of 100
    batch_size = 100
    for i in tqdm(range(0, len(vectors_to_upsert), batch_size), desc="Uploading batches"):
        batch = vectors_to_upsert[i:i + batch_size]
        index.upsert(vectors=batch)

    print(f"\nSuccessfully uploaded {len(vectors_to_upsert)} vectors to Pinecone!")

    # Get index stats
    stats = index.describe_index_stats()
    print(f"\nIndex Stats:")
    print(f"   - Total vectors: {stats['total_vector_count']}")
    print(f"   - Index dimension: {stats['dimension']}")
    print(f"   - Ready to use!")


if __name__ == '__main__':
    upload_embeddings()
