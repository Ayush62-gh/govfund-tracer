import os
import sys
import json
import pandas as pd
from typing import Dict, Any

# Ensure project root is in sys.path
ml_dir = os.path.dirname(os.path.abspath(__file__))
proj_root = os.path.abspath(os.path.join(ml_dir, '..'))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

from ml.utils.db_sync import load_works_data, load_allocated_limits, get_audit_feedback, count_labeled_feedback
from ml.detectors.duplicate_detector import detect_duplicates
from ml.detectors.cost_anomaly_detector import detect_cost_anomalies
from ml.detectors.split_sanction_detector import detect_split_and_compliance
from ml.detectors.time_lag_detector import detect_time_lags
from ml.detectors.fund_mismatch_detector import detect_fund_mismatch

# Conservative minimum number of labeled audit feedback samples required to perform
# Logistic Regression weight calibration without overfitting noise or small-sample bias.
MIN_LABELED_SAMPLES_REQUIRED = 30

def calibrate_weights() -> None:
    labeled_count = count_labeled_feedback()
    
    if labeled_count < MIN_LABELED_SAMPLES_REQUIRED:
        print(f"Only {labeled_count} labeled feedback samples found (need >= {MIN_LABELED_SAMPLES_REQUIRED}).")
        print("Refusing to calibrate weights on insufficient data — this would overfit noise, not learn a real pattern.")
        print("Existing heuristic DETECTOR_WEIGHTS in risk_aggregator.py remain unchanged.")
        print("Re-run this script after collecting more labeled feedback via ml/utils/db_sync.py's save_audit_feedback().")
        sys.exit(0)
        
    print(f"Sufficient labeled samples found ({labeled_count} >= {MIN_LABELED_SAMPLES_REQUIRED}). Proceeding with weight calibration...")
    
    # Load dataset and feedback
    df_feedback = get_audit_feedback()
    df_labeled = df_feedback[df_feedback['verdict'].isin(['true_positive', 'false_positive'])].copy()
    
    df_works = load_works_data()
    df_alloc = load_allocated_limits()
    
    # Re-run detectors to get per-work feature signals
    dup_res = detect_duplicates(df_works)
    cost_res = detect_cost_anomalies(df_works)
    split_res = detect_split_and_compliance(df_works, df_alloc)
    time_res = detect_time_lags(df_works)
    fund_res = detect_fund_mismatch(df_works)
    
    # Build feature matrix for labeled work records
    feature_rows = []
    targets = []
    
    for _, f_row in df_labeled.iterrows():
        w_id = f_row['work_id']
        verdict = f_row['verdict']
        
        target = 1 if verdict == 'true_positive' else 0
        
        # Binary or score features per detector
        has_dup = 1.0 if w_id in dup_res else 0.0
        has_cost = 1.0 if w_id in cost_res and cost_res[w_id].get('combined_cost_signal') else 0.0
        has_split = 1.0 if w_id in split_res else 0.0
        has_time = 1.0 if w_id in time_res else 0.0
        has_fund = 1.0 if w_id in fund_res else 0.0
        
        feature_rows.append({
            'duplicate': has_dup,
            'cost': has_cost,
            'split_compliance': has_split,
            'time_lag': has_time,
            'fund_mismatch': has_fund
        })
        targets.append(target)
        
    X = pd.DataFrame(feature_rows)
    y = pd.Series(targets)
    
    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression(random_state=42)
    clf.fit(X, y)
    
    coeffs = clf.coef_[0]
    feature_names = list(X.columns)
    
    print("Calibrated Logistic Regression Coefficients:")
    calibrated_dict = {}
    for name, coef in zip(feature_names, coeffs):
        # Convert log-odds / coefficients into scaled positive weight range
        weight = max(10.0, float(round(coef * 20.0 + 20.0, 2)))
        calibrated_dict[name] = weight
        print(f"  {name}: {coef:.4f} -> weight: {weight:.2f}")
        
    calibrated_path = os.path.join(ml_dir, 'calibrated_weights.json')
    with open(calibrated_path, 'w', encoding='utf-8') as f:
        json.dump(calibrated_dict, f, indent=2)
        
    print(f"\nSuccessfully saved calibrated detector weights to {calibrated_path}")

if __name__ == '__main__':
    calibrate_weights()
