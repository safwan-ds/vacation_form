# Python backend (FastAPI)

## Run locally

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

This serves:
- Static frontend at `http://127.0.0.1:8000/`
- API endpoints:
  - `GET /health`
  - `GET /config`
  - `POST /validate`
  - `POST /generate-pdf`

### Optional env vars
- `ALLOWED_ORIGINS` (comma-separated)
- `RATE_LIMIT_REQUESTS` (default `60`)
- `RATE_LIMIT_WINDOW_SECONDS` (default `60`)
- `MAX_CONTENT_LENGTH` (default `65536`)
- `MAX_FIELD_LENGTH` (default `200`)
