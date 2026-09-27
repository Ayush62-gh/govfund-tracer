import pandas as pd
import numpy as np
from typing import Dict, Any

# OUT_OF_SCOPE(backend/ingest.py): backend/ingest.py's validate_match() splits mismatched sanction/completion pairs
# into separate rows (sanctioned_only / completed_only) sharing the same composite_key during initial ingestion.
# Rather than modifying backend/ingest.py, Pass 2 below cross-references composite_key groups directly within ML engine.

def detect_fund_mismatch(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects financial fund mismatches and conflicts between Sanctioned Amount and Disbursed Amount.
    
    1. Pass 1 (Same-row check): Evaluates rows where both sanction_amount and amount_disbursed are populated.
    2. Pass 2 (Cross-referencing split ingestion records): Group by composite_key and cross-reference
       sanctioned_only / sanction amount records against completed_only / disbursed amount records across rows.
    
    Returns dict: work_id -> {
        'fund_mismatch_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str,
        'ratio': float,
        'difference': float
    }
    """
    results = {}
    
    # --------------------------------------------------------------------------
    # PASS 1: Same-Row Sanction vs Disbursed Check
    # --------------------------------------------------------------------------
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

    # --------------------------------------------------------------------------
    # PASS 2: Cross-Reference Split Ingestion Records by Composite Key
    # --------------------------------------------------------------------------
    if 'composite_key' in df.columns:
        best_cross = {}  # work_id -> dict record (keep highest ratio per work_id)
        
        for c_key, group in df.groupby('composite_key'):
            if len(group) < 2:
                continue
                
            sanc_rows = group[(group['source'] == 'sanctioned_only') & group['sanction_amount'].notna() & (group['sanction_amount'] > 0)]
            comp_rows = group[(group['source'] == 'completed_only') & group['amount_disbursed'].notna() & (group['amount_disbursed'] > 0)]
            
            for _, s_row in sanc_rows.iterrows():
                s_id = s_row['work_id']
                s_amt = float(s_row['sanction_amount'])
                
                for _, c_row in comp_rows.iterrows():
                    c_id = c_row['work_id']
                    if s_id == c_id:
                        continue
                    c_disb = float(c_row['amount_disbursed'])
                    
                    ratio = float(max(s_amt, c_disb) / min(s_amt, c_disb))
                    diff = float(abs(s_amt - c_disb))
                    
                    if ratio > 1.5 and diff > 50000:
                        score = min(1.0, round((ratio - 1.5) * 0.2 + 0.4, 3))
                        s_str = f"₹{s_amt/100000:.2f} Lakh" if s_amt >= 100000 else f"₹{s_amt:,.0f}"
                        c_str = f"₹{c_disb/100000:.2f} Lakh" if c_disb >= 100000 else f"₹{c_disb:,.0f}"
                        
                        det = (
                            f"Fund Mismatch Variance: Disbursed amount ({c_str}) differs from sanctioned estimate ({s_str}) "
                            f"by {ratio:.1f}x (Difference: ₹{diff:,.0f}) | Cross-referenced from split ingestion records "
                            f"(same composite_key, mismatch only visible across sanctioned_only + completed_only rows)."
                        )
                        
                        rec = {
                            'fund_mismatch_score': score,
                            'flags': ['FLAG_FUND_MISMATCH'],
                            'details': det,
                            'ratio': round(ratio, 2),
                            'difference': round(diff, 2)
                        }
                        
                        if s_id not in best_cross or ratio > best_cross[s_id]['ratio']:
                            best_cross[s_id] = rec
                        if c_id not in best_cross or ratio > best_cross[c_id]['ratio']:
                            best_cross[c_id] = rec
                            
        for w_id, rec in best_cross.items():
            if w_id not in results:
                results[w_id] = rec
                
    return results
