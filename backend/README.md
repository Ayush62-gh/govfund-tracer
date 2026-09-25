# GovFund Tracer Backend Service

Lightweight FastAPI backend for SIH PS 26102 (MPLADS Anomaly & Fraud Detection).

## Features
- **CSV Data Ingestion**: Parses raw MPLADS CSV files (`Allocated Limit`, `Works Sanctioned`, `Works Completed`), strips footers ("Grand Total"), cleans numeric amounts, parses dates (`dayfirst=True`), and unifies records into a normalized SQLite database.
- **SQLite Database**: Persistent SQLite DB stored at `backend/db/govfund.db`.
- **REST API Endpoints**:
  - `GET /works?state=&category=&status=&mp=&search=&limit=&offset=` — Filtered and paginated works list.
  - `GET /works/{id}` — Single work details.
  - `GET /works/{id}/risk` — Risk placeholder (returns `risk_score: null`, `flags: []`, `explanation: null`).
  - `GET /summary` — Aggregated counts and amounts by state, category, and status.
  - `GET /allocated-limits` — Entitlement reference data by MP / constituency.

## Installation & Setup

1. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Run Data Ingestion**:
   ```bash
   python backend/ingest.py
   ```

3. **Start API Server**:
   ```bash
   python backend/main.py
   # OR
   uvicorn backend.main:app --reload --port 8000
   ```

4. **API Interactive Documentation**:
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
