# GovFund Tracer Backend Service

Lightweight FastAPI backend for SIH PS 26102 (MPLADS Anomaly & Fraud Detection).

---

## Quick Start for Frontend

- **Base URL**: `http://localhost:8000`
- **CORS Support**: Cross-Origin Resource Sharing is enabled for all origins (`allow_origins=["*"]`). Your local frontend dev server (e.g. Next.js on `http://localhost:3000`, Vite on `http://localhost:5173`) can call all backend API endpoints directly without any CORS proxying.

### How to Run the Server Locally

```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Run Data Ingestion (creates backend/db/govfund.db)
python backend/ingest.py

# 3. Start API Server
python backend/main.py
# (Or using uvicorn directly: uvicorn backend.main:app --reload --port 8000)
```

- **Interactive API Docs**:
  - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
  - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

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
   ```

---

## Complete API Reference for Frontend Developers

### 1. `GET /works`

- **Description**: Returns a paginated list of work records. Supports filtering by state, work category, status, source dataset, MP name, or free-text search.
- **Query Parameters**:
  | Parameter | Type | Example | Description |
  | :--- | :--- | :--- | :--- |
  | `state` | `string` | `Karnataka` | Filter by State name |
  | `category` | `string` | `Normal/Others` | Filter by Work Category |
  | `status` | `string` | `Work Completed` | Filter by Work Status |
  | `source` | `string` | `matched` | Filter by record origin (`matched`, `sanctioned_only`, `completed_only`) |
  | `mp` | `string` | `Pralhad Venkatesh Joshi` | Filter by MP Name |
  | `search` | `string` | `Bhavan` | Free text search in description or constituency |
  | `limit` | `integer` | `2` | Number of items per page (default: `100`, max: `1000`) |
  | `offset` | `integer` | `0` | Offset index for pagination (default: `0`) |

- **Example Request**:
  ```bash
  curl "http://localhost:8000/works?limit=2&state=Karnataka"
  ```

- **Example Response**:
  ```json
  {
    "total": 87,
    "limit": 2,
    "offset": 0,
    "items": [
      {
        "work_id": "WRK-000001",
        "source": "matched",
        "state": "Karnataka",
        "category": "Normal/Others",
        "ida": "DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)",
        "risk_score": null,
        "flags": [],
        "explanation": null,
        "work_code": "WS/ MP620/2024-2025/133166-Construction of buildings for community cultural activities",
        "mp_name": "Pralhad Venkatesh Joshi",
        "constituency": "DHARWAD",
        "work_description": "Construction of Community Bhavan at Navalgund TQ Belavatagi Village Pry No 1/A Near Shivanand Math Continue Work",
        "recommended_date": "2024-07-08",
        "sanction_date": "2024-07-09",
        "sanction_amount": 497185.0,
        "completion_date": "2024-10-14",
        "amount_disbursed": 497185.0,
        "image": "Images",
        "work_status": "Work Completed"
      },
      {
        "work_id": "WRK-000002",
        "source": "sanctioned_only",
        "state": "Karnataka",
        "category": "Trust and Society",
        "ida": "DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)",
        "risk_score": null,
        "flags": [],
        "explanation": null,
        "work_code": "WS/ MP620/2025-2026/133167-Construction of rooms and halls in school and colleges",
        "mp_name": "Pralhad Venkatesh Joshi",
        "constituency": "DHARWAD",
        "work_description": "Construction of College room of CBS Charitable Foudation at Nulvi Vilage Pry No 817/3 Continued work",
        "recommended_date": "2024-07-08",
        "sanction_date": "2025-09-18",
        "sanction_amount": 500000.0,
        "completion_date": null,
        "amount_disbursed": null,
        "image": null,
        "work_status": "Sanction"
      }
    ]
  }
  ```

---

### 2. `GET /works/{id}`

- **Description**: Retrieves full record details for a single work item by its unique `work_id`.
- **Path Parameters**:
  | Parameter | Type | Example | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `string` | `WRK-000001` | Unique work identifier |

- **Example Request**:
  ```bash
  curl "http://localhost:8000/works/WRK-000001"
  ```

- **Example Response**:
  ```json
  {
    "work_id": "WRK-000001",
    "source": "matched",
    "state": "Karnataka",
    "category": "Normal/Others",
    "ida": "DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)",
    "risk_score": null,
    "flags": [],
    "explanation": null,
    "work_code": "WS/ MP620/2024-2025/133166-Construction of buildings for community cultural activities",
    "mp_name": "Pralhad Venkatesh Joshi",
    "constituency": "DHARWAD",
    "work_description": "Construction of Community Bhavan at Navalgund TQ Belavatagi Village Pry No 1/A Near Shivanand Math Continue Work",
    "recommended_date": "2024-07-08",
    "sanction_date": "2024-07-09",
    "sanction_amount": 497185.0,
    "completion_date": "2024-10-14",
    "amount_disbursed": 497185.0,
    "image": "Images",
    "work_status": "Work Completed"
  }
  ```

---

### 3. `GET /works/{id}/risk`

- **Description**: Returns risk scoring payload for a specific work record.
- **Developer Note**: *Currently returns null risk_score and empty flags — the ML risk engine is not yet wired in. This shape will not change when it is: `{work_id, risk_score, flags[], explanation}`.*
- **Path Parameters**:
  | Parameter | Type | Example | Description |
  | :--- | :--- | :--- | :--- |
  | `id` | `string` | `WRK-000001` | Unique work identifier |

- **Example Request**:
  ```bash
  curl "http://localhost:8000/works/WRK-000001/risk"
  ```

- **Example Response**:
  ```json
  {
    "work_id": "WRK-000001",
    "risk_score": null,
    "flags": [],
    "explanation": null
  }
  ```

---

### 4. `GET /summary`

- **Description**: Returns aggregate statistics across all MPLADS work items, including overall counts, total financial figures, breakdowns by state, category, status, and record origin source.
- **Query Parameters**: None.

- **Example Request**:
  ```bash
  curl "http://localhost:8000/summary"
  ```

- **Example Response**:
  ```json
  {
    "total_works": 9624,
    "total_sanctioned_amount": 2774057198.0,
    "total_disbursed_amount": 3741976266.4,
    "by_source": {
      "completed_only": 4624,
      "sanctioned_only": 2624,
      "matched": 2376
    },
    "by_state": {
      "Uttar Pradesh": {
        "count": 2987,
        "sanctioned_amount": 672794662.56
      },
      "West Bengal": {
        "count": 928,
        "sanctioned_amount": 443347484.0
      },
      "Madhya Pradesh": {
        "count": 867,
        "sanctioned_amount": 118612154.0
      },
      "Jharkhand": {
        "count": 646,
        "sanctioned_amount": 94044462.0
      },
      "Telangana": {
        "count": 536,
        "sanctioned_amount": 26753343.0
      }
    },
    "by_category": {
      "Normal/Others": {
        "count": 9530,
        "sanctioned_amount": 2737759235.0
      },
      "Repair and Renovation": {
        "count": 82,
        "sanctioned_amount": 27847963.0
      },
      "Trust and Society": {
        "count": 12,
        "sanctioned_amount": 8450000.0
      }
    },
    "by_status": {
      "Work Completed": 7108,
      "Physical Inspection": 1259,
      "Sanction": 516,
      "Vendor Identification": 493,
      "Work partially Completed": 240,
      "Time Estimation": 8
    }
  }
  ```

---

### 5. `GET /allocated-limits`

- **Description**: Returns reference allocation entitlement data per Member of Parliament.
- **Query Parameters**:
  | Parameter | Type | Example | Description |
  | :--- | :--- | :--- | :--- |
  | `state` | `string` | `Karnataka` | Filter by State name |
  | `mp` | `string` | `BOMMAI` | Filter by MP Name |

- **Example Request**:
  ```bash
  curl "http://localhost:8000/allocated-limits?state=Karnataka"
  ```

- **Example Response**:
  ```json
  [
    {
      "id": 75,
      "state": "Karnataka",
      "mp_name": "BASAVARAJ BOMMAI",
      "constituency": "HAVERI",
      "allocated_amount": 147000000.0
    },
    {
      "id": 100,
      "state": "Karnataka",
      "mp_name": "CAPTAIN BRIJESH CHOWTA",
      "constituency": "DAKSHINA KANNADA",
      "allocated_amount": 147000000.0
    }
  ]
  ```
