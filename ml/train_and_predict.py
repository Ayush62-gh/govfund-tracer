import os
import sys
import time
import json
import pandas as pd
from typing import List, Dict, Any

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
    print("=" * 75)
    print("🚀 GOVFUND TRACER ML RISK & COMPLIANCE PIPELINE (SIH PS 26102)")
    print("=" * 75)
    
    start_time = time.time()
    
    # 1. Load Data from SQLite DB
    print("\n[1/6] Loading work records and MP allocated limits from SQLite DB...")
    df_works = load_works_data()
    df_alloc = load_allocated_limits()
    print(f"      Loaded {len(df_works)} work records and {len(df_alloc)} MP limit records.")
    
    # 2. Run Duplicate Work Detector (TF-IDF Cosine >0.85 per (state, category) group)
    print("\n[2/6] Running Duplicate Work Detector (TF-IDF Cosine >0.85)...")
    dup_results = detect_duplicates(df_works)
    print(f"      Identified {len(dup_results)} possible duplicate work candidate records.")
    
    # 3. Run Cost Anomaly Detector (IQR + Isolation Forest Combined Method)
    print("\n[3/6] Running Cost Anomaly Detector (IQR + Isolation Forest Combined Method)...")
    cost_results = detect_cost_anomalies(df_works)
    
    iqr_count = sum(1 for v in cost_results.values() if v.get('iqr_flag'))
    iforest_count = sum(1 for v in cost_results.values() if v.get('isolation_forest_flag'))
    combined_cost_count = sum(1 for v in cost_results.values() if v.get('combined_cost_signal'))
    print(f"      Cost IQR Outliers: {iqr_count}")
    print(f"      Cost Isolation Forest Outliers: {iforest_count}")
    print(f"      High-Confidence Combined Cost Anomalies (IQR + IF): {combined_cost_count}")
    
    # 4. Run Split Sanction & MPLADS Guidelines Compliance Detector
    print("\n[4/6] Running Split Sanction & MPLADS Guidelines Compliance Detector...")
    split_results = detect_split_and_compliance(df_works, df_alloc)
    print(f"      Identified {len(split_results)} guideline compliance & pattern review records.")
    
    # 5. Run Time Lag & Stagnation Detector (Deterministic Rule)
    print("\n[5/6] Running Time Lag & Stagnation Detector (Deterministic Rule)...")
    time_results = detect_time_lags(df_works)
    print(f"      Identified {len(time_results)} sanction delay & execution stagnation records.")
    
    # 6. Aggregate Composite Risk Scores & Heuristic Confidence Proxy
    print("\n[6/6] Aggregating composite risk scores (0-100) & heuristic confidence proxy...")
    final_risk_records = aggregate_risk_scores(
        df_works, dup_results, cost_results, split_results, time_results
    )
    
    # Save back to SQLite DB
    save_risk_results(final_risk_records)
    
    # Generate Sample Validation Export Files (JSON & CSV)
    export_validation_sample(df_works, final_risk_records)
    
    elapsed = time.time() - start_time
    
    # Summary Metrics
    scores = [r['risk_score'] for r in final_risk_records]
    conf_scores = [r['confidence_score'] for r in final_risk_records]
    
    high_risk = sum(1 for s in scores if s >= 66.0)
    med_risk = sum(1 for s in scores if 31.0 <= s < 66.0)
    low_risk = sum(1 for s in scores if s < 31.0)
    flagged_total = sum(1 for r in final_risk_records if len(r['flags']) > 0)
    
    print("\n" + "=" * 75)
    print("📊 REAL-DATA PIPELINE EXECUTION SUMMARY")
    print("=" * 75)
    print(f"Total Records Processed:                       {len(final_risk_records)}")
    print(f"Total Flagged Risk Records:                    {flagged_total} ({flagged_total/len(final_risk_records)*100:.1f}%)")
    print(f"  - Duplicate Candidate Records:               {len(dup_results)}")
    print(f"  - Cost IQR Outliers:                          {iqr_count}")
    print(f"  - Cost Isolation Forest Outliers:             {iforest_count}")
    print(f"  - Combined Cost Anomalies (IQR + IF):         {combined_cost_count}")
    print(f"  - Sanction Delay Flags (>365 days):           {len(time_results)}")
    print(f"  - Compliance & Guideline Breach Flags:        {len(split_results)}")
    print("-" * 75)
    print("RISK SCORE DISTRIBUTION (0-100):")
    print(f"  🔴 High Risk (66-100):                       {high_risk} ({high_risk/len(final_risk_records)*100:.1f}%)")
    print(f"  🟡 Medium Risk (31-65):                     {med_risk} ({med_risk/len(final_risk_records)*100:.1f}%)")
    print(f"  🟢 Low Risk (0-30):                         {low_risk} ({low_risk/len(final_risk_records)*100:.1f}%)")
    print("-" * 75)
    print("HEURISTIC CONFIDENCE PROXY DISTRIBUTION (0.0-1.0):")
    print(f"  Very High Confidence (>=0.95, 3+ detectors): {sum(1 for c in conf_scores if c >= 0.95)}")
    print(f"  High Confidence (0.80 - 0.94, 2 detectors):  {sum(1 for c in conf_scores if 0.80 <= c < 0.95)}")
    print(f"  Moderate Confidence (<0.80, 1 detector):     {sum(1 for c in conf_scores if c < 0.80)}")
    print("-" * 75)
    print(f"⏱️ Total Execution Time:                        {elapsed:.2f} seconds")
    print("=" * 75)

def export_validation_sample(df_works: pd.DataFrame, final_records: List[Dict[str, Any]]):
    """
    Exports sample validation JSON and CSV files containing detailed statistical metadata for sanity checking.
    """
    works_map = {r['work_id']: r for idx, r in df_works.iterrows()}
    
    rec_dt = pd.to_datetime(df_works['recommended_date'], errors='coerce')
    sanc_dt = pd.to_datetime(df_works['sanction_date'], errors='coerce')
    days_to_sanc_map = (sanc_dt - rec_dt).dt.days.fillna(0).clip(lower=0).to_dict()
    
    sample_list = []
    
    for item in final_records:
        w_id = item['work_id']
        w_raw = works_map.get(w_id, {})
        c_meta = item.get('cost_metadata', {})
        d_meta = item.get('dup_metadata', {})
        
        # Select representative records (all flagged records + sample regular records)
        if item['flags'] or len(sample_list) < 25:
            rec = {
                'work_id': w_id,
                'state': w_raw.get('state'),
                'category': w_raw.get('category'),
                'constituency': w_raw.get('constituency'),
                'sanction_amount': w_raw.get('sanction_amount'),
                'days_to_sanction': int(days_to_sanc_map.get(w_raw.name if hasattr(w_raw, 'name') else 0, 0)),
                'risk_score': item['risk_score'],
                'confidence_score': item['confidence_score'],
                'detectors_flagged_count': item['detectors_flagged_count'],
                'flags': item['flags'],
                'explanation': item['explanation'],
                # Cost Statistics Metadata
                'q1': c_meta.get('q1'),
                'q3': c_meta.get('q3'),
                'iqr': c_meta.get('iqr'),
                'upper_bound': c_meta.get('upper_bound'),
                'isolation_forest_flag': bool(c_meta.get('isolation_forest_flag', False)),
                'iqr_flag': bool(c_meta.get('iqr_flag', False)),
                'combined_cost_signal': bool(c_meta.get('combined_cost_signal', False)),
                'robust_z_score': c_meta.get('robust_z_score'),
                'mad': c_meta.get('mad'),
                # Duplicate Statistics Metadata
                'matched_work_id': d_meta.get('matched_work_id'),
                'cosine_similarity': d_meta.get('cosine_similarity'),
                'location_1': d_meta.get('location_1'),
                'location_2': d_meta.get('location_2'),
                'village_gp_1': d_meta.get('village_gp_1'),
                'village_gp_2': d_meta.get('village_gp_2'),
                'same_village_gp_indicated': d_meta.get('same_village_gp_indicated', 'N/A')
            }
            sample_list.append(rec)
            
    json_path = os.path.join(ml_dir, 'sample_output_validation.json')
    csv_path = os.path.join(ml_dir, 'sample_output_validation.csv')
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(sample_list[:100], f, indent=2)
        
    df_sample = pd.DataFrame(sample_list[:200])
    df_sample.to_csv(csv_path, index=False)
    
    print(f"\n[Validation Export] Generated sample validation JSON at: {json_path}")
    print(f"[Validation Export] Generated sample validation CSV at: {csv_path}")

if __name__ == "__main__":
    run_pipeline()
