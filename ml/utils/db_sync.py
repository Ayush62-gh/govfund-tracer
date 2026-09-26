import os
import sqlite3
import json
import pandas as pd
from typing import List, Dict, Any

def get_db_path() -> str:
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(ml_dir, '..', '..', 'backend', 'db', 'govfund.db'))

def load_works_data() -> pd.DataFrame:
    """
    Loads all work records from govfund.db into a pandas DataFrame.
    """
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}. Please run backend ingestion first.")
    
    conn = sqlite3.connect(db_path)
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
    Updates risk_score, flags (as JSON string), and explanation in govfund.db for all processed works.
    risk_results item structure:
    {
       'work_id': 'WRK-000001',
       'risk_score': 85.0,
       'flags': ['FLAG_DUPLICATE_WORK', 'FLAG_COST_OVERRUN'],
       'explanation': 'Explanation text...'
    }
    """
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    update_tuples = []
    for item in risk_results:
        flags_json = json.dumps(item.get('flags', []))
        update_tuples.append((
            item.get('risk_score'),
            flags_json,
            item.get('explanation'),
            item.get('work_id')
        ))
        
    cur.executemany("""
        UPDATE works
        SET risk_score = ?,
            flags = ?,
            explanation = ?
        WHERE work_id = ?
    """, update_tuples)
    
    conn.commit()
    conn.close()
    print(f"Successfully updated risk scores and flags for {len(update_tuples)} works in SQLite database.")
