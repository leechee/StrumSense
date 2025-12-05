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

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Start gunicorn with increased timeout and workers
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--timeout", "120", "--workers", "2", "app:app"]
