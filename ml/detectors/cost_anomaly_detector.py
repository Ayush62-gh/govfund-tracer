import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.ensemble import IsolationForest

def detect_cost_anomalies(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Identifies cost estimate inflations and cost overrun anomalies using:
    1. Primary Method A: Grouped IQR Outlier Detection (for groups with >= 10 samples).
    2. Primary Method B: Isolation Forest on ['sanction_amount', 'days_to_sanction'] (contamination=0.05).
    3. Primary Combined Signal: High-confidence anomaly when BOTH IQR and Isolation Forest fire.
    4. Supplementary Diagnostic Information: Robust Z-Score & MAD.
    
    Returns dict: work_id -> {
        'cost_anomaly_score': float (0.0 to 1.0),
        'flags': list[str],
        'details': str,
        'group_state': str,
        'group_category': str,
        'group_sample_count': int,
        'q1': float,
        'q3': float,
        'iqr': float,
        'upper_bound': float,
        'iqr_flag': bool,
        'isolation_forest_flag': bool,
        'combined_cost_signal': bool,
        'robust_z_score': float,
        'mad': float
    }
    """
    results = {}
    
    # Pre-calculate days_to_sanction for Isolation Forest feature matrix
    rec_dt = pd.to_datetime(df['recommended_date'], errors='coerce')
    sanc_dt = pd.to_datetime(df['sanction_date'], errors='coerce')
    df_calc = df.copy()
    df_calc['days_to_sanction'] = (sanc_dt - rec_dt).dt.days.fillna(0).clip(lower=0)
    
    # --------------------------------------------------------------------------
    # METHOD A: Grouped IQR Outlier Detection
    # --------------------------------------------------------------------------
    iqr_results = {}
    
    for (st, cat), group in df_calc.groupby(['state', 'category']):
        valid_amounts = group['sanction_amount'].dropna()
        n_samples = len(valid_amounts)
        
        if n_samples < 10:
            # Groups with < 10 samples: mark insufficient_baseline, do NOT calculate IQR bounds
            for idx, row in group.iterrows():
                w_id = row['work_id']
                iqr_results[w_id] = {
                    'group_state': st,
                    'group_category': cat,
                    'group_sample_count': n_samples,
                    'q1': None,
                    'q3': None,
                    'iqr': None,
                    'upper_bound': None,
                    'iqr_flag': False,
                    'insufficient_baseline': True,
                    'robust_z_score': 0.0,
                    'mad': 0.0
                }
            continue
            
        q1 = float(np.percentile(valid_amounts, 25))
        q3 = float(np.percentile(valid_amounts, 75))
        iqr = float(q3 - q1)
        upper_bound = float(q3 + 1.5 * iqr)
        
        # Supplementary Robust Z-Score / MAD
        median = float(valid_amounts.median())
        mad = float((valid_amounts - median).abs().median())
        if mad == 0:
            mad = 1.0  # Fallback for identical value clusters
            
        for idx, row in group.iterrows():
            w_id = row['work_id']
            amt = row['sanction_amount']
            
            iqr_flag = False
            if pd.notna(amt) and amt > upper_bound:
                iqr_flag = True
                
            robust_z = 0.0
            if pd.notna(amt) and amt > 0:
                robust_z = float((amt - median) / (1.4826 * mad))
                
            iqr_results[w_id] = {
                'group_state': st,
                'group_category': cat,
                'group_sample_count': n_samples,
                'q1': round(q1, 2),
                'q3': round(q3, 2),
                'iqr': round(iqr, 2),
                'upper_bound': round(upper_bound, 2),
                'iqr_flag': iqr_flag,
                'insufficient_baseline': False,
                'robust_z_score': round(robust_z, 2),
                'mad': round(mad, 2)
            }
            
    # --------------------------------------------------------------------------
    # METHOD B: Isolation Forest Detection
    # --------------------------------------------------------------------------
    iforest_flags = {}
    
    # Prepare feature matrix: sanction_amount, days_to_sanction
    feature_df = df_calc[['work_id', 'sanction_amount', 'days_to_sanction']].copy()
    feature_df['sanction_amount'] = feature_df['sanction_amount'].fillna(feature_df['sanction_amount'].median())
    
    X = feature_df[['sanction_amount', 'days_to_sanction']].values
    
    if len(X) >= 10:
        clf = IsolationForest(contamination=0.05, random_state=42)
        preds = clf.fit_predict(X)
        for w_id, pred in zip(feature_df['work_id'], preds):
            iforest_flags[w_id] = (pred == -1)
    else:
        for w_id in feature_df['work_id']:
            iforest_flags[w_id] = False

    # --------------------------------------------------------------------------
    # COMBINED COST SIGNAL & SCORE AGGREGATION
    # --------------------------------------------------------------------------
    for idx, row in df_calc.iterrows():
        w_id = row['work_id']
        amt = row['sanction_amount']
        disb = row['amount_disbursed']
        
        iqr_data = iqr_results.get(w_id, {
            'group_state': row.get('state', ''),
            'group_category': row.get('category', ''),
            'group_sample_count': 0,
            'q1': None, 'q3': None, 'iqr': None, 'upper_bound': None,
            'iqr_flag': False, 'insufficient_baseline': True,
            'robust_z_score': 0.0, 'mad': 0.0
        })
        
        iqr_flag = iqr_data['iqr_flag']
        iforest_flag = iforest_flags.get(w_id, False)
        combined_cost_signal = (iqr_flag and iforest_flag)
        
        # Discrepancy ratio check (Sanction vs Disbursed)
        discrepancy_flag = False
        if pd.notna(disb) and pd.notna(amt) and amt > 0 and disb > 0:
            ratio = max(amt, disb) / min(amt, disb)
            diff = abs(amt - disb)
            if ratio > 1.5 and diff > 50000:
                discrepancy_flag = True

        w_flags = []
        details_list = []
        anomaly_score = 0.0

        if combined_cost_signal:
            w_flags.append('FLAG_COST_ANOMALY_COMBINED')
            anomaly_score += 0.85
            details_list.append(
                f"HIGH-CONFIDENCE COST ANOMALY (IQR + Isolation Forest): Sanction ₹{amt:,.0f} exceeds upper bound ₹{iqr_data['upper_bound']:,.0f} "
                f"(Q1: ₹{iqr_data['q1']:,.0f}, Q3: ₹{iqr_data['q3']:,.0f}, IQR: ₹{iqr_data['iqr']:,.0f}, N={iqr_data['group_sample_count']})"
            )
        elif iqr_flag:
            w_flags.append('FLAG_COST_IQR_OUTLIER')
            anomaly_score += 0.50
            details_list.append(
                f"IQR Cost Outlier: Sanction ₹{amt:,.0f} exceeds upper bound ₹{iqr_data['upper_bound']:,.0f} "
                f"for {iqr_data['group_category']} in {iqr_data['group_state']}"
            )
        elif iforest_flag:
            w_flags.append('FLAG_COST_IFOREST_OUTLIER')
            anomaly_score += 0.40
            details_list.append(f"Isolation Forest Financial Outlier (Sanction ₹{amt:,.0f}, Days: {row['days_to_sanction']})")
            
        if discrepancy_flag:
            w_flags.append('FLAG_COST_OVERRUN')
            anomaly_score += 0.40
            ratio_val = max(amt, disb) / min(amt, disb)
            details_list.append(f"Disbursed ₹{disb:,.0f} conflicts with Sanctioned ₹{amt:,.0f} (Ratio: {ratio_val:.1f}x)")

        if w_flags:
            anomaly_score = min(1.0, anomaly_score)
            results[w_id] = {
                'cost_anomaly_score': round(anomaly_score, 3),
                'flags': w_flags,
                'details': " | ".join(details_list),
                'group_state': iqr_data['group_state'],
                'group_category': iqr_data['group_category'],
                'group_sample_count': iqr_data['group_sample_count'],
                'q1': iqr_data['q1'],
                'q3': iqr_data['q3'],
                'iqr': iqr_data['iqr'],
                'upper_bound': iqr_data['upper_bound'],
                'iqr_flag': iqr_flag,
                'isolation_forest_flag': iforest_flag,
                'combined_cost_signal': combined_cost_signal,
                'robust_z_score': iqr_data['robust_z_score'],
                'mad': iqr_data['mad']
            }
            
    return results
