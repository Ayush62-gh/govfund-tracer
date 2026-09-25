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
