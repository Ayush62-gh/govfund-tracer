import os
import sqlite3
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GovFund Tracer Backend API",
    description="REST API for MPLADS Fund Utilization & Anomaly Detection (SIH PS 26102)",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_path() -> str:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(backend_dir, "db", "govfund.db")

def get_db_connection():
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=500, detail="Database file not found. Run ingestion script first.")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def format_work_row(row: sqlite3.Row) -> Dict[str, Any]:
    flags_raw = row["flags"]
    flags_parsed = []
    if flags_raw:
        try:
            flags_parsed = json.loads(flags_raw)
        except Exception:
            flags_parsed = []

    return {
        "work_id": row["work_id"],
        "source": row["source"],
        "state": row["state"],
        "category": row["category"],
        "ida": row["ida"],
        "risk_score": row["risk_score"],
        "flags": flags_parsed,
        "explanation": row["explanation"],
        "work_code": row["work_code"],
        "mp_name": row["mp_name"],
        "constituency": row["constituency"],
        "work_description": row["work_description"],
        "recommended_date": row["recommended_date"],
        "sanction_date": row["sanction_date"],
        "sanction_amount": row["sanction_amount"],
        "completion_date": row["completion_date"],
        "amount_disbursed": row["amount_disbursed"],
        "image": row["image"],
        "work_status": row["work_status"]
    }

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "GovFund Tracer Backend API",
        "version": "1.0.0",
        "endpoints": ["/works", "/works/{id}", "/works/{id}/risk", "/summary", "/allocated-limits"]
    }

@app.get("/works")
def get_works(
    state: Optional[str] = Query(None, description="Filter by State"),
    category: Optional[str] = Query(None, description="Filter by Work Category"),
    status: Optional[str] = Query(None, description="Filter by Work Status"),
    source: Optional[str] = Query(None, description="Filter by Source (sanctioned_only, completed_only, matched)"),
    mp: Optional[str] = Query(None, description="Filter by MP Name"),
    search: Optional[str] = Query(None, description="Search in description or constituency"),
    limit: int = Query(100, ge=1, le=1000, description="Page limit"),
    offset: int = Query(0, ge=0, description="Offset index")
):
    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM works WHERE 1=1"
    params = []

    if state:
        query += " AND LOWER(state) = LOWER(?)"
        params.append(state.strip())
    if category:
        query += " AND LOWER(category) LIKE LOWER(?)"
        params.append(f"%{category.strip()}%")
    if status:
        query += " AND LOWER(work_status) = LOWER(?)"
        params.append(status.strip())
    if source:
        query += " AND LOWER(source) = LOWER(?)"
        params.append(source.strip())
    if mp:
        query += " AND LOWER(mp_name) LIKE LOWER(?)"
        params.append(f"%{mp.strip()}%")
    if search:
        query += " AND (LOWER(work_description) LIKE LOWER(?) OR LOWER(constituency) LIKE LOWER(?))"
        params.extend([f"%{search.strip()}%", f"%{search.strip()}%"])

    # Count query
    count_query = "SELECT COUNT(*) FROM (" + query + ")"
    cur.execute(count_query, params)
    total_count = cur.fetchone()[0]

    # Data query
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    items = [format_work_row(r) for r in rows]

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": items
    }

@app.get("/works/{work_id}")
def get_work_by_id(work_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM works WHERE work_id = ?", (work_id.strip(),))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Work record with ID '{work_id}' not found.")

    return format_work_row(row)

@app.get("/works/{work_id}/risk")
def get_work_risk(work_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT work_id, risk_score, flags, explanation FROM works WHERE work_id = ?", (work_id.strip(),))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Work record with ID '{work_id}' not found.")

    flags_raw = row["flags"]
    flags_parsed = []
    if flags_raw:
        try:
            flags_parsed = json.loads(flags_raw)
        except Exception:
            flags_parsed = []

    return {
        "work_id": row["work_id"],
        "risk_score": row["risk_score"],
        "flags": flags_parsed,
        "explanation": row["explanation"]
    }

@app.get("/summary")
def get_summary():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*), COALESCE(SUM(sanction_amount), 0), COALESCE(SUM(amount_disbursed), 0) FROM works")
    tot_works, tot_sanctioned, tot_disbursed = cur.fetchone()

    cur.execute("SELECT state, COUNT(*), COALESCE(SUM(sanction_amount), 0) FROM works GROUP BY state ORDER BY COUNT(*) DESC")
    state_rows = cur.fetchall()

    cur.execute("SELECT category, COUNT(*), COALESCE(SUM(sanction_amount), 0) FROM works GROUP BY category ORDER BY COUNT(*) DESC")
    cat_rows = cur.fetchall()

    cur.execute("SELECT work_status, COUNT(*) FROM works GROUP BY work_status ORDER BY COUNT(*) DESC")
    status_rows = cur.fetchall()

    cur.execute("SELECT source, COUNT(*) FROM works GROUP BY source ORDER BY COUNT(*) DESC")
    source_rows = cur.fetchall()

    conn.close()

    return {
        "total_works": tot_works,
        "total_sanctioned_amount": tot_sanctioned,
        "total_disbursed_amount": tot_disbursed,
        "by_source": {r["source"]: r[1] for r in source_rows},
        "by_state": {r["state"]: {"count": r[1], "sanctioned_amount": r[2]} for r in state_rows},
        "by_category": {r["category"]: {"count": r[1], "sanctioned_amount": r[2]} for r in cat_rows},
        "by_status": {r["work_status"]: r[1] for r in status_rows}
    }

@app.get("/allocated-limits")
def get_allocated_limits(
    state: Optional[str] = Query(None),
    mp: Optional[str] = Query(None)
):
    conn = get_db_connection()
    cur = conn.cursor()
    query = "SELECT * FROM allocated_limits WHERE 1=1"
    params = []
    if state:
        query += " AND LOWER(state) = LOWER(?)"
        params.append(state.strip())
    if mp:
        query += " AND LOWER(mp_name) LIKE LOWER(?)"
        params.append(f"%{mp.strip()}%")

    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "state": r["state"],
            "mp_name": r["mp_name"],
            "constituency": r["constituency"],
            "allocated_amount": r["allocated_amount"]
        }
        for r in rows
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
