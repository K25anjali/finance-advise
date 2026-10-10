FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the app
# Render (and most PaaS) inject $PORT; default to 8000 for local `docker run`
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
