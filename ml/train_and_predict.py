import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root is in sys.path
ml_dir = os.path.dirname(os.path.abspath(__file__))
proj_root = os.path.abspath(os.path.join(ml_dir, '..'))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

from ml.utils.db_sync import load_works_data, load_allocated_limits, save_risk_results
from ml.detectors.duplicate_detector import detect_duplicates
from ml.detectors.cost_anomaly_detector import detect_cost_anomalies
from ml.detectors.split_sanction_detector import detect_split_and_compliance
from ml.detectors.time_lag_detector import detect_time_lags
from ml.risk_aggregator import aggregate_risk_scores

def run_pipeline():
    print("=" * 70)
    print("🚀 GOVFUND TRACER ML RISK PIPELINE (SIH PS 26102)")
    print("=" * 70)
    
    start_time = time.time()
    
    # 1. Load Data from SQLite DB
    print("\n[1/6] Loading work records and MP allocated limits from SQLite DB...")
    df_works = load_works_data()
    df_alloc = load_allocated_limits()
    print(f"      Loaded {len(df_works)} work records and {len(df_alloc)} MP limit records.")
    
    # 2. Run Duplicate Work Detector
    print("\n[2/6] Running Duplicate Work Detector (NLP TF-IDF + Fuzzy)...")
    dup_results = detect_duplicates(df_works)
    print(f"      Identified {len(dup_results)} potential duplicate work records.")
    
    # 3. Run Cost Anomaly Detector
    print("\n[3/6] Running Cost Anomaly & Inflated Estimate Detector...")
    cost_results = detect_cost_anomalies(df_works)
    print(f"      Identified {len(cost_results)} cost anomaly & financial conflict records.")
    
    # 4. Run Split Sanction & Compliance Detector
    print("\n[4/6] Running Split Sanction & MPLADS Guidelines Compliance Detector...")
    split_results = detect_split_and_compliance(df_works, df_alloc)
    print(f"      Identified {len(split_results)} guideline compliance & chunking records.")
    
    # 5. Run Time Lag & Stagnation Detector
    print("\n[5/6] Running Time Lag & Stagnation Detector...")
    time_results = detect_time_lags(df_works)
    print(f"      Identified {len(time_results)} sanction delay & execution stagnation records.")
    
    # 6. Aggregate Risk Scores
    print("\n[6/6] Aggregating composite risk scores (0-100) and generating explanations...")
    final_risk_records = aggregate_risk_scores(
        df_works, dup_results, cost_results, split_results, time_results
    )
    
    # Save back to SQLite DB
    save_risk_results(final_risk_records)
    
    elapsed = time.time() - start_time
    
    # Print Summary Distribution
    scores = [r['risk_score'] for r in final_risk_records]
    high_risk = sum(1 for s in scores if s >= 66.0)
    med_risk = sum(1 for s in scores if 31.0 <= s < 66.0)
    low_risk = sum(1 for s in scores if s < 31.0)
    flagged_total = sum(1 for r in final_risk_records if len(r['flags']) > 0)
    
    print("\n" + "=" * 70)
    print("📊 ML RISK SCORING SUMMARY")
    print("=" * 70)
    print(f"Total Works Processed:  {len(final_risk_records)}")
    print(f"Total Flagged Works:    {flagged_total} ({flagged_total/len(final_risk_records)*100:.1f}%)")
    print(f"🔴 High Risk (66-100):   {high_risk} ({high_risk/len(final_risk_records)*100:.1f}%)")
    print(f"🟡 Medium Risk (31-65): {med_risk} ({med_risk/len(final_risk_records)*100:.1f}%)")
    print(f"🟢 Low Risk (0-30):     {low_risk} ({low_risk/len(final_risk_records)*100:.1f}%)")
    print(f"⏱️ Total Execution Time: {elapsed:.2f} seconds")
    print("=" * 70)

if __name__ == "__main__":
    run_pipeline()
