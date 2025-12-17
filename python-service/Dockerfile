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
# Install dependencies with increased timeout
RUN pip install --no-cache-dir --timeout=1000 -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render will set PORT env variable)
EXPOSE 10000

# Start gunicorn with increased timeout for audio processing
# Use PORT environment variable that Render provides, fallback to 10000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1 --threads 2 app:app"]
