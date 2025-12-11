FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libchromaprint-dev \
    libchromaprint-tools \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download transformers model at build time to avoid download during runtime
RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')"

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Set environment variables for AI models
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_HOME=/app/.cache

# Start gunicorn with increased timeout for AI processing
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--timeout", "180", "--workers", "1", "--threads", "2", "app:app"]
