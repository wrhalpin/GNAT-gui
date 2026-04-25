FROM python:3.11-slim

WORKDIR /app

COPY backend/pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]" || pip install --no-cache-dir -e .

COPY backend/ .

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "gnat_gui.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
