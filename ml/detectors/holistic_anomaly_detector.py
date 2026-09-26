"""
This is an UNSUPERVISED anomaly detector with NO ground-truth validation. 
It surfaces multivariate outliers a human should review — it does not claim these are fraud.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.ensemble import IsolationForest

def detect_holistic_anomalies(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Detects multivariate anomalies across 6 engineered features simultaneously per (state, category) group
    using Isolation Forest (contamination=0.05, random_state=42).
    
    Skips peer groups with < 10 samples.
    """
    if df.empty:
        return {}
        
    df_work = df.copy()
    
    # 1. Feature Engineering
    # Feature 1: sanction_amount
    df_work['sanction_amount_clean'] = pd.to_numeric(df_work['sanction_amount'], errors='coerce')
    
    # Feature 2: days_to_sanction
    rec_date = pd.to_datetime(df_work['recommended_date'], errors='coerce')
    sanc_date = pd.to_datetime(df_work['sanction_date'], errors='coerce')
    df_work['days_to_sanction'] = (sanc_date - rec_date).dt.days
    
    # Feature 3: days_sanction_to_completion
    comp_date = pd.to_datetime(df_work['completion_date'], errors='coerce')
    df_work['days_sanction_to_completion'] = (comp_date - sanc_date).dt.days
    
    # Feature 4: category numeric code
    df_work['category_code'] = pd.factorize(df_work['category'])[0]
    
    # Feature 5: work_status numeric code
    df_work['work_status_code'] = pd.factorize(df_work['work_status'])[0]
    
    # Feature 6: disbursement_ratio
    disb_amt = pd.to_numeric(df_work['amount_disbursed'], errors='coerce')
    sanc_amt = df_work['sanction_amount_clean']
    
    has_both = disb_amt.notna() & sanc_amt.notna() & (sanc_amt > 0)
    df_work['disbursement_ratio'] = 1.0
    df_work.loc[has_both, 'disbursement_ratio'] = (disb_amt[has_both] / sanc_amt[has_both]).astype(float)
    
    # Ensure state and category are present for grouping
    df_work['state'] = df_work['state'].fillna('Unknown')
    df_work['category'] = df_work['category'].fillna('Unknown')
    
    feature_cols = [
        'sanction_amount_clean',
        'days_to_sanction',
        'days_sanction_to_completion',
        'category_code',
        'work_status_code',
        'disbursement_ratio'
    ]
    
    feature_display_names = {
        'sanction_amount_clean': 'sanction_amount',
        'days_to_sanction': 'days_to_sanction',
        'days_sanction_to_completion': 'days_sanction_to_completion',
        'category_code': 'category',
        'work_status_code': 'work_status',
        'disbursement_ratio': 'disbursement_ratio'
    }
    
    holistic_results: Dict[str, Dict[str, Any]] = {}
    
    # 2. Group by (state, category)
    grouped = df_work.groupby(['state', 'category'])
    
    for (state, category), group in grouped:
        group_len = len(group)
        if group_len < 10:
            continue
            
        group_df = group.copy()
        
        # Fill missing values with group median (or 0 if all median is NaN)
        X_group = group_df[feature_cols].copy()
        for col in feature_cols:
            median_val = X_group[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            X_group[col] = X_group[col].fillna(median_val)
            
        # Fit Isolation Forest
        model = IsolationForest(contamination=0.05, random_state=42)
        preds = model.fit_predict(X_group)
        df_scores = model.decision_function(X_group)
        
        # Min-max scale anomaly score (lower decision_function = more anomalous)
        min_df_val = df_scores.min()
        max_df_val = df_scores.max()
        
        if max_df_val == min_df_val:
            scaled_scores = np.full(group_len, 0.5)
        else:
            scaled_scores = (max_df_val - df_scores) / (max_df_val - min_df_val + 1e-9)
            
        # Compute mean & std for top-z feature explanations
        means = X_group.mean()
        stds = X_group.std().replace(0, 1e-9).fillna(1e-9)
        
        # Process flagged anomalies (preds == -1)
        for i in range(group_len):
            if preds[i] == -1:
                w_id = group_df.iloc[i]['work_id']
                raw_row = X_group.iloc[i]
                
                # Z-scores per feature
                z_scores = {}
                for col in feature_cols:
                    val = raw_row[col]
                    z = abs((val - means[col]) / stds[col])
                    z_scores[col] = z
                    
                # Top 2 most unusual features by Z-score
                sorted_feats = sorted(z_scores.items(), key=lambda x: x[1], reverse=True)[:2]
                feat1_name = feature_display_names[sorted_feats[0][0]]
                feat1_z = sorted_feats[0][1]
                feat2_name = feature_display_names[sorted_feats[1][0]]
                feat2_z = sorted_feats[1][1]
                
                anomaly_score = float(np.round(scaled_scores[i], 3))
                
                details_str = (
                    f"Multivariate ML Anomaly (Isolation Forest): Most unusual vs ({state}, {category}) peer group "
                    f"in {feat1_name} (Z={feat1_z:.2f}) and {feat2_name} (Z={feat2_z:.2f})."
                )
                
                holistic_results[w_id] = {
                    'holistic_anomaly_score': anomaly_score,
                    'flags': ['FLAG_HOLISTIC_ML_ANOMALY'],
                    'details': details_str,
                    'group_state': state,
                    'group_category': category,
                    'group_sample_count': group_len
                }
                
    return holistic_results
