FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY req.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r req.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
