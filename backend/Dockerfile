# Simple, no-SCIP setup using PuLP + CBC
FROM python:3.11-slim

# NOTE: This image expects SCIP to be present at runtime (not installed here).

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

# Default: serve API on port 8000. Ensure the container has SCIP installed and on PATH.
EXPOSE 8000
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
