# GovFund Tracer

> AI-powered anomaly/fraud detection platform for MPLADS fund utilization, SIH PS26102

## Repository Structure

```text
GovFund Tracer/
├── backend/          # ingestion, cleaning, SQLite schema, REST API
├── ml/               # risk-scoring engine, spike notebooks/scripts
├── frontend/         # role-based dashboards (MP / District / State Nodal / Ministry)
├── data/             # local CSVs only — must be gitignored, keep only .gitkeep
├── docs/             # spike findings, architecture notes, slide assets
├── .gitignore
└── README.md
```

## Getting Started

*(Getting started instructions will be updated as modules are implemented.)*

1. **Backend Setup**: See `backend/` for server and database setup.
2. **Frontend Setup**: See `frontend/` for client dashboard setup.
3. **ML Pipeline**: See `ml/` for risk-scoring and anomaly detection models.

## Data Privacy & Security Note

> **IMPORTANT**: Do not commit real MPLADS data or planted anomaly data referencing real MP names, districts, or agencies into this repository. Keep all dataset CSVs locally in the `data/` directory, which is gitignored.

## Backend Status

- **API Status**: Live and functional (FastAPI service backed by SQLite database at `backend/db/govfund.db`).
- **ML Risk Placeholder**: `GET /works/{id}/risk` currently returns `risk_score: null`, `flags: []`, and `explanation: null` pending the ML risk-scoring engine.
- **Endpoints**:
  - `GET /works` — Filtered & paginated work records list (`?state=`, `?category=`, `?status=`, `?source=`, `?mp=`, `?search=`, `?limit=`, `?offset=`).
  - `GET /works/{id}` — Single work record lookup.
  - `GET /works/{id}/risk` — Risk placeholder for ML integration.
  - `GET /summary` — Aggregate metrics and distributions by state, category, status, and source.
  - `GET /allocated-limits` — MP entitlement reference data.
- **Documentation & Setup**: See [`backend/README.md`](file:///D:/Projects/SIH/GovFund%20Tracer/backend/README.md) for detailed setup and API execution instructions.

