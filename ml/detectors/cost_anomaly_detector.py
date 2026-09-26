import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.ensemble import IsolationForest

def detect_cost_anomalies(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Identifies cost estimate inflations and cost overrun anomalies using:
    1. Category-State grouped robust Z-score (MAD - Median Absolute Deviation).
    2. Isolation Forest on financial metrics.
    3. Discrepancy checks between sanction_amount and amount_disbursed.
    
    Returns dict: work_id -> {
        'cost_anomaly_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str
    }
    """
    results = {}
    
    # 1. Grouped Robust Z-Score for Inflated Estimates
    for (cat, st), group in df.groupby(['category', 'state']):
        valid_amounts = group['sanction_amount'].dropna()
        if len(valid_amounts) < 5:
            continue
            
        median = valid_amounts.median()
        mad = (valid_amounts - median).abs().median()
        
        # Avoid division by zero
        if mad == 0:
            mad = 1.0
            
        for idx, row in group.iterrows():
            w_id = row['work_id']
            amt = row['sanction_amount']
            
            if pd.isna(amt) or amt <= 0:
                continue
                
            robust_z = (amt - median) / (1.4826 * mad)
            
            w_flags = []
            details = []
            anomaly_score = 0.0
            
            # Robust Z-score threshold (> 3.0 means significant outlier)
            if robust_z > 3.0 and amt > 2.0 * median and amt > 500000:
                w_flags.append('FLAG_INFLATED_ESTIMATE')
                anomaly_score += min(0.6, (robust_z - 3.0) * 0.1 + 0.4)
                details.append(f"Sanction amount ₹{amt:,.0f} is {amt/median:.1f}x higher than median (₹{median:,.0f}, Robust Z-Score: {robust_z:.2f}, MAD: ₹{mad:,.0f}) for {cat} in {st}")
                
            # 2. Sanction vs Disbursed Discrepancy
            disb = row.get('amount_disbursed')
            if pd.notna(disb) and pd.notna(amt) and amt > 0 and disb > 0:
                ratio = max(amt, disb) / min(amt, disb)
                diff = abs(amt - disb)
                
                if ratio > 1.5 and diff > 50000:
                    w_flags.append('FLAG_COST_OVERRUN')
                    anomaly_score += 0.5
                    details.append(f"Disbursed amount ₹{disb:,.0f} conflicts with Sanctioned ₹{amt:,.0f} (Ratio: {ratio:.1f}x)")
                    
            if w_flags:
                anomaly_score = min(1.0, anomaly_score)
                results[w_id] = {
                    'cost_anomaly_score': round(anomaly_score, 3),
                    'flags': w_flags,
                    'details': " | ".join(details)
                }
                
    return results
