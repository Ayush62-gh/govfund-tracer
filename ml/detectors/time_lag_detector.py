import pandas as pd
import numpy as np
from typing import Dict, Any

def detect_time_lags(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects severe administrative sanction delays, execution stagnation, and time lag anomalies.
    
    Returns dict: work_id -> {
        'time_lag_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str
    }
    """
    results = {}
    
    rec_dt = pd.to_datetime(df['recommended_date'], errors='coerce')
    sanc_dt = pd.to_datetime(df['sanction_date'], errors='coerce')
    comp_dt = pd.to_datetime(df['completion_date'], errors='coerce')
    
    # Current benchmark date for open works
    ref_date = pd.to_datetime('2026-09-01')
    
    for idx, row in df.iterrows():
        w_id = row['work_id']
        r_d = rec_dt.iloc[idx]
        s_d = sanc_dt.iloc[idx]
        c_d = comp_dt.iloc[idx]
        status = str(row.get('work_status', '')).lower()
        
        flags = []
        details = []
        score = 0.0
        
        # 1. Sanction Lag: recommended_date to sanction_date > 365 days
        if pd.notna(r_d) and pd.notna(s_d):
            sanc_lag_days = (s_d - r_d).days
            if sanc_lag_days > 365:
                flags.append('FLAG_SANCTION_DELAY')
                score += min(0.5, 0.2 + (sanc_lag_days - 365) / 1000.0)
                details.append(f"Administrative sanction lag of {sanc_lag_days} days ({sanc_lag_days/30.0:.1f} months) between recommendation and approval")
                
        # 2. Stagnant / Uncompleted Sanctioned Work (> 2 years without completion)
        if pd.notna(s_d) and pd.isna(c_d) and 'complete' not in status:
            days_pending = (ref_date - s_d).days
            if days_pending > 730:  # > 2 years
                flags.append('FLAG_STAGNANT_WORK')
                score += 0.5
                details.append(f"Work has been sanctioned for {days_pending} days ({days_pending/365.0:.1f} years) without completion")
                
        # 3. Completion predates sanction date (Data integrity conflict)
        if pd.notna(c_d) and pd.notna(s_d):
            if c_d < s_d:
                flags.append('FLAG_DATE_INTEGRITY_CONFLICT')
                score += 0.4
                details.append(f"Data Conflict: Completion date ({c_d.strftime('%Y-%m-%d')}) predates Sanction date ({s_d.strftime('%Y-%m-%d')})")
                
        if flags:
            results[w_id] = {
                'time_lag_score': round(min(1.0, score), 3),
                'flags': flags,
                'details': " | ".join(details)
            }
            
    return results
