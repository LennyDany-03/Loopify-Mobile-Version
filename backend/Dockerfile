# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevents Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Prevents Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# ── Install dependencies ───────────────────────────────────────────────────────
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Copy app source ────────────────────────────────────────────────────────────
COPY backend/ .

# ── Expose port ────────────────────────────────────────────────────────────────
EXPOSE 8000

# ── Start FastAPI with uvicorn ─────────────────────────────────────────────────
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]