import os
import sqlite3
import json
import pandas as pd
from typing import List, Dict, Any

def get_db_path() -> str:
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(ml_dir, '..', '..', 'backend', 'db', 'govfund.db'))

def ensure_confidence_column(conn: sqlite3.Connection):
    """
    Non-destructive additive migration: Adds 'confidence' REAL column to works table if not present.
    """
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(works);")
    cols = [col[1] for col in cur.fetchall()]
    if "confidence" not in cols:
        cur.execute("ALTER TABLE works ADD COLUMN confidence REAL;")
        conn.commit()

def load_works_data() -> pd.DataFrame:
    """
    Loads all work records from govfund.db into a pandas DataFrame.
    """
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}. Please run backend ingestion first.")
    
    conn = sqlite3.connect(db_path)
    ensure_confidence_column(conn)
    df = pd.read_sql_query("SELECT * FROM works", conn)
    conn.close()
    return df

def load_allocated_limits() -> pd.DataFrame:
    """
    Loads MP allocated limits reference table.
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM allocated_limits", conn)
    conn.close()
    return df

def save_risk_results(risk_results: List[Dict[str, Any]]):
    """
    Updates risk_score, flags (as JSON string), explanation, and numeric confidence in govfund.db for all works.
    risk_results item structure:
    {
       'work_id': 'WRK-000001',
       'risk_score': 85.0,
       'confidence_score': 0.95,
       'flags': ['FLAG_POSSIBLE_DUPLICATE', 'FLAG_COST_OVERRUN'],
       'explanation': 'Explanation text...'
    }
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    ensure_confidence_column(conn)
    cur = conn.cursor()
    
    update_tuples = []
    for item in risk_results:
        flags_json = json.dumps(item.get('flags', []))
        update_tuples.append((
            item.get('risk_score'),
            flags_json,
            item.get('explanation'),
            item.get('confidence_score'),
            item.get('work_id')
        ))
        
    cur.executemany("""
        UPDATE works
        SET risk_score = ?,
            flags = ?,
            explanation = ?,
            confidence = ?
        WHERE work_id = ?
    """, update_tuples)
    
    conn.commit()
    conn.close()
    print(f"Successfully updated risk scores, flags, explanations, and numeric confidence values for {len(update_tuples)} works in SQLite database.")

from datetime import datetime

def save_audit_feedback(work_id: str, flag_code: str, verdict: str, note: str = "") -> None:
    """
    Saves human auditor feedback for a flagged work item into ml_audit_feedback table.
    verdict must be one of: 'true_positive', 'false_positive', 'uncertain'.
    """
    valid_verdicts = {'true_positive', 'false_positive', 'uncertain'}
    if verdict not in valid_verdicts:
        raise ValueError(f"Invalid verdict '{verdict}'. Must be one of {valid_verdicts}.")
        
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ml_audit_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            work_id TEXT,
            flag_code TEXT,
            verdict TEXT,
            note TEXT,
            created_at TEXT
        )
    """)
    
    created_at = datetime.now().isoformat()
    cur.execute("""
        INSERT INTO ml_audit_feedback (work_id, flag_code, verdict, note, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (work_id, flag_code, verdict, note, created_at))
    
    conn.commit()
    conn.close()

def get_audit_feedback() -> pd.DataFrame:
    """
    Returns all rows from ml_audit_feedback as a pandas DataFrame.
    Returns empty DataFrame if table doesn't exist or is empty.
    """
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return pd.DataFrame(columns=['id', 'work_id', 'flag_code', 'verdict', 'note', 'created_at'])
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ml_audit_feedback'")
    if not cur.fetchone():
        conn.close()
        return pd.DataFrame(columns=['id', 'work_id', 'flag_code', 'verdict', 'note', 'created_at'])
        
    df = pd.read_sql_query("SELECT * FROM ml_audit_feedback", conn)
    conn.close()
    return df

def count_labeled_feedback() -> int:
    """
    Returns the count of labeled feedback records ('true_positive' or 'false_positive').
    Excludes 'uncertain' records.
    """
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return 0
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ml_audit_feedback'")
    if not cur.fetchone():
        conn.close()
        return 0
        
    cur.execute("SELECT COUNT(*) FROM ml_audit_feedback WHERE verdict IN ('true_positive', 'false_positive')")
    count = cur.fetchone()[0]
    conn.close()
    return count

