import os
import json
from typing import Dict, Any, List

# ==============================================================================
# CONFIGURABLE MANUAL SAMPLE PRECISION CONSTANTS
# ==============================================================================
# Based on a random (seed=7) N=30 sample drawn from FLAG_POSSIBLE_DUPLICATE
# production output and manually read by a human reviewer against the raw
# work_description text. This is a TEXT-PLAUSIBILITY judgment, not a
# ground-truth-verified precision figure (no independent auditor
# confirmation) — treat as a rough estimate, and re-sample with a larger N
# before quoting this number externally.
DUPLICATE_MANUAL_SAMPLE_SIZE_N = 30
DUPLICATE_MANUAL_SAMPLE_PRECISION_PCT = 7.0
# ==============================================================================

# Detector weights (Heuristic baseline defaults)
DETECTOR_WEIGHTS = {
    'duplicate': 40.0,
    'cost': 40.0,
    'split_compliance': 35.0,
    'time_lag': 20.0,
    'fund_mismatch': 35.0,
    'holistic': 25.0  # Modest weight for newer, unvalidated holistic ML signal
}

# Check for calibrated weights file
_ml_dir = os.path.dirname(os.path.abspath(__file__))
_calibrated_file = os.path.join(_ml_dir, 'calibrated_weights.json')

if os.path.exists(_calibrated_file):
    try:
        with open(_calibrated_file, 'r', encoding='utf-8') as _f:
            _loaded_weights = json.load(_f)
        if isinstance(_loaded_weights, dict) and set(_loaded_weights.keys()).issubset(set(DETECTOR_WEIGHTS.keys())):
            DETECTOR_WEIGHTS.update({k: float(v) for k, v in _loaded_weights.items()})
            print("[risk_aggregator] Using calibrated DETECTOR_WEIGHTS from ml/calibrated_weights.json")
        else:
            print("[risk_aggregator] WARNING: ml/calibrated_weights.json keys do not match expected DETECTOR_WEIGHTS. Using heuristic defaults.")
    except Exception as _e:
        print(f"[risk_aggregator] WARNING: Failed to load ml/calibrated_weights.json ({_e}). Using heuristic defaults.")
else:
    print("[risk_aggregator] Using heuristic DETECTOR_WEIGHTS (no calibrated_weights.json found)")

def aggregate_risk_scores(
    df_works,
    dup_results: Dict[str, Dict[str, Any]],
    cost_results: Dict[str, Dict[str, Any]],
    split_results: Dict[str, Dict[str, Any]],
    time_results: Dict[str, Dict[str, Any]],
    mismatch_results: Dict[str, Dict[str, Any]] = None,
    holistic_results: Dict[str, Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Aggregates individual detector results into a unified Composite Risk Score (0-100),
    Heuristic Confidence Proxy (0.0 to 1.0), and natural language explanations.
    
    IMPORTANT: confidence_score is a HEURISTIC CONFIDENCE PROXY (reflecting indicator agreement/signal strength),
    NOT a mathematical probability of fraud.
    """
    if mismatch_results is None:
        mismatch_results = {}
    if holistic_results is None:
        holistic_results = {}
        
    final_records = []
    
    for idx, row in df_works.iterrows():
        w_id = row['work_id']
        
        dup_data = dup_results.get(w_id, {})
        cost_data = cost_results.get(w_id, {})
        split_data = split_results.get(w_id, {})
        time_data = time_results.get(w_id, {})
        mismatch_data = mismatch_results.get(w_id, {})
        holistic_data = holistic_results.get(w_id, {})
        
        combined_flags = []
        explanation_parts = []
        
        # 1. Duplicate Signal (Up to 40 pts)
        dup_points = 0.0
        if dup_data.get('flag'):
            combined_flags.append('FLAG_POSSIBLE_DUPLICATE')
            dup_score = dup_data.get('duplicate_score', 0.85)
            dup_points = dup_score * DETECTOR_WEIGHTS['duplicate']
            matched_id = dup_data.get('matched_work_id', 'UNKNOWN')
            sim_pct = round(dup_data.get('cosine_similarity', 0.85) * 100, 1)
            loc_status = dup_data.get('same_village_gp_indicated', 'Uncertain')
            loc_note = "Confirmed Same Village" if loc_status == "True" else "Different Villages in Same Constituency" if loc_status == "False" else "Location Unspecified"
            explanation_parts.append(
                f"Candidate Duplicate Work: {sim_pct}% description similarity with Work ID #{matched_id} in same constituency "
                f"(~{DUPLICATE_MANUAL_SAMPLE_PRECISION_PCT:.0f}% precision on N={DUPLICATE_MANUAL_SAMPLE_SIZE_N} manual sample due to standard scheme templates across villages; Location Match: {loc_note})"
            )
            
        # 2. Cost Anomaly Signal (Up to 40 pts)
        cost_points = 0.0
        if cost_data.get('flags'):
            for f in cost_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            c_score = cost_data.get('cost_anomaly_score', 0.5)
            cost_points = c_score * DETECTOR_WEIGHTS['cost']
            explanation_parts.append(cost_data.get('details', 'Cost anomaly detected'))
            
        # 3. Compliance / Split Signal (Up to 35 pts)
        split_points = 0.0
        if split_data.get('flags'):
            for f in split_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            s_score = split_data.get('split_compliance_score', 0.5)
            split_points = s_score * DETECTOR_WEIGHTS['split_compliance']
            explanation_parts.append(split_data.get('details', 'Compliance/split sanction rule triggered'))
            
        # 4. Time Lag Signal (Up to 20 pts)
        time_points = 0.0
        if time_data.get('flags'):
            for f in time_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            t_score = time_data.get('time_lag_score', 0.4)
            time_points = t_score * DETECTOR_WEIGHTS['time_lag']
            explanation_parts.append(time_data.get('details', 'Execution or sanction lag detected'))

        # 5. Fund Mismatch Signal (Up to 35 pts)
        mismatch_points = 0.0
        if mismatch_data.get('flags'):
            for f in mismatch_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            m_score = mismatch_data.get('fund_mismatch_score', 0.5)
            mismatch_points = m_score * DETECTOR_WEIGHTS['fund_mismatch']
            explanation_parts.append(mismatch_data.get('details', 'Fund mismatch conflict detected'))
            
        # 6. Holistic ML Anomaly Signal (Up to 25 pts)
        holistic_points = 0.0
        if holistic_data.get('flags'):
            for f in holistic_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            h_score = holistic_data.get('holistic_anomaly_score', 0.5)
            holistic_points = h_score * DETECTOR_WEIGHTS['holistic']
            explanation_parts.append(holistic_data.get('details', 'Holistic ML anomaly detected'))
            
        # Count independent detectors that triggered
        detectors_flagged = 0
        other_detectors_flagged = False
        if dup_data.get('flag'):
            detectors_flagged += 1
            other_detectors_flagged = True
        if cost_data.get('flags'):
            detectors_flagged += 1
            other_detectors_flagged = True
        if split_data.get('flags'):
            detectors_flagged += 1
            other_detectors_flagged = True
        if time_data.get('flags'):
            detectors_flagged += 1
            other_detectors_flagged = True
        if mismatch_data.get('flags'):
            detectors_flagged += 1
            other_detectors_flagged = True
            
        # holistic detector overlaps ~72% with other detectors on this dataset (see VALIDATION_REPORT.md Phase 3)
        # and is not treated as independent corroboration for confidence purposes unless it fires alone.
        if holistic_data.get('flags') and not other_detectors_flagged:
            detectors_flagged += 1
            
        # Calculate Heuristic Confidence Proxy (0.0 to 1.0)
        # Note: Higher agreement across independent detectors yields higher confidence in the risk indicator.
        if detectors_flagged >= 3:
            confidence_score = 0.95
            confidence_level = "Very High Confidence"
        elif detectors_flagged == 2:
            confidence_score = 0.80
            confidence_level = "High Confidence"
        elif detectors_flagged == 1:
            if cost_data.get('combined_cost_signal'):
                confidence_score = 0.85
                confidence_level = "High Confidence"
            elif dup_data.get('cosine_similarity', 0) > 0.95:
                confidence_score = 0.75
                confidence_level = "Moderate Confidence"
            else:
                confidence_score = 0.55
                confidence_level = "Moderate Confidence"
        else:
            confidence_score = 0.90  # High confidence in low-risk regular classification
            confidence_level = "High Confidence (Low Risk)"

        # Composite score calculation (Max 100)
        total_raw_points = dup_points + cost_points + split_points + time_points + mismatch_points + holistic_points
        composite_score = round(min(100.0, total_raw_points), 1)
        
        # Risk level classification
        if composite_score >= 66.0:
            risk_level = "High Risk"
        elif composite_score >= 31.0:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"
            
        if not explanation_parts:
            explanation = "No major anomalies or guideline compliance flags detected. Work record appears regular."
        else:
            explanation = f"{risk_level} ({composite_score}/100, {confidence_level} [{detectors_flagged} detector(s) triggered]): " + " | ".join(explanation_parts) + "."
            
        final_records.append({
            'work_id': w_id,
            'risk_score': composite_score,
            'confidence_score': round(confidence_score, 2),
            'detectors_flagged_count': detectors_flagged,
            'flags': combined_flags,
            'explanation': explanation,
            'cost_metadata': cost_data,
            'dup_metadata': dup_data,
            'mismatch_metadata': mismatch_data,
            'holistic_metadata': holistic_data
        })
        
    return final_records

