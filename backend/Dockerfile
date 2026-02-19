
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Install poetry-plugin-export
RUN poetry self add poetry-plugin-export

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Export poetry dependencies to requirements.txt and install with pip
# This avoids any ambiguity with poetry's virtualenv location
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only main \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
