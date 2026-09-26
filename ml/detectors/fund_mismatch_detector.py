import pandas as pd
import numpy as np
from typing import Dict, Any

def detect_fund_mismatch(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects financial fund mismatches and conflicts between Sanctioned Amount and Disbursed Amount.
    
    Identifies records where ratio > 1.5 and absolute difference > ₹50,000 between sanction_amount and amount_disbursed.
    Note: ingest.py's validate_match() filters out severe conflicts during ingestion, so this detector identifies
    discrepancies in matched rows and conflict records.
    
    Returns dict: work_id -> {
        'fund_mismatch_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str,
        'ratio': float,
        'difference': float
    }
    """
    results = {}
    
    for idx, row in df.iterrows():
        w_id = row['work_id']
        amt = row.get('sanction_amount')
        disb = row.get('amount_disbursed')
        
        if pd.notna(amt) and pd.notna(disb) and amt > 0 and disb > 0:
            ratio = float(max(amt, disb) / min(amt, disb))
            diff = float(abs(amt - disb))
            
            if ratio > 1.5 and diff > 50000:
                amt_str = f"₹{amt/100000:.2f} Lakh" if amt >= 100000 else f"₹{amt:,.0f}"
                disb_str = f"₹{disb/100000:.2f} Lakh" if disb >= 100000 else f"₹{disb:,.0f}"
                
                results[w_id] = {
                    'fund_mismatch_score': min(1.0, round((ratio - 1.5) * 0.2 + 0.4, 3)),
                    'flags': ['FLAG_FUND_MISMATCH'],
                    'details': f"Fund Mismatch Variance: Disbursed amount ({disb_str}) differs from sanctioned estimate ({amt_str}) by {ratio:.1f}x (Difference: ₹{diff:,.0f})",
                    'ratio': round(ratio, 2),
                    'difference': round(diff, 2)
                }
                
    return results
