FROM python:3.11-slim

# psycopg2-binary needs no build deps, but curl is handy for the healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole backend first: the package must exist before `pip install -e`
# (hatchling reads gnat_gui/ to build the editable wheel). Production install omits
# the dev extras. `gnat` is an editable/optional install and is NOT bundled here;
# mount or layer it in if job execution is required.
COPY backend/ .
RUN pip install --no-cache-dir -e .

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -sf http://localhost:8000/openapi.json || exit 1

CMD ["uvicorn", "gnat_gui.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
