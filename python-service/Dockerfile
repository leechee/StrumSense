FROM python:3.11-slim

# Install system dependencies including build tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    build-essential \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
# Upgrade pip first
RUN pip install --no-cache-dir --upgrade pip
# Install all dependencies except openl3 first
RUN pip install --no-cache-dir --timeout=1000 \
    Flask==3.0.0 \
    flask-cors==4.0.0 \
    gunicorn==21.2.0 \
    numpy==1.26.4 \
    soundfile==0.12.1 \
    requests==2.31.0 \
    tensorflow==2.15.0 \
    keras==2.15.0 \
    scikit-image==0.22.0 \
    scipy==1.11.4 \
    librosa==0.10.1 \
    yt-dlp==2023.12.30 \
    tqdm==4.66.1 \
    python-dotenv==1.0.0
# Install openl3 separately with retries
RUN pip install --no-cache-dir --timeout=2000 --retries 5 openl3==0.4.2 || \
    pip install --no-cache-dir --timeout=2000 --retries 5 openl3==0.4.2 || \
    pip install --no-cache-dir --timeout=2000 --retries 5 openl3==0.4.2

# Copy application code
COPY . .

# Expose port (Render will set PORT env variable)
EXPOSE 10000

# Start gunicorn with increased timeout for audio processing
# Use PORT environment variable that Render provides, fallback to 10000
# PYTHONUNBUFFERED=1 ensures logs appear immediately
CMD ["sh", "-c", "PYTHONUNBUFFERED=1 gunicorn --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1 --threads 2 --log-level info app:app"]
