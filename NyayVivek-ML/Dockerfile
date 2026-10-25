# ============================================================
# NyayVivek-ML — Railway Deployment Dockerfile
# ============================================================
# Base image: slim Python 3.11 on Debian Bookworm
FROM python:3.11-slim-bookworm

# --- System Dependencies ---
# Install Tesseract-OCR + its English language data pack (required by pytesseract)
# Also install libgomp1 (needed by faiss-cpu) and poppler-utils for PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgomp1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# --- Working Directory ---
WORKDIR /app

# --- Python Dependencies ---
# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# --- Application Source ---
# Copy the entire project into the container
COPY . .

# --- Bake the embedding model into the image (avoids HF download at every cold start) ---
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# --- Port ---
# Railway injects the PORT env var dynamically
EXPOSE 8000

# --- Start Command ---
# Uses shell form so $PORT is resolved at runtime from Railway's env
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
