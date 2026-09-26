from typing import Dict, Any, List

def aggregate_risk_scores(
    df_works,
    dup_results: Dict[str, Dict[str, Any]],
    cost_results: Dict[str, Dict[str, Any]],
    split_results: Dict[str, Dict[str, Any]],
    time_results: Dict[str, Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Aggregates individual detector results into a unified Composite Risk Score (0-100)
    and natural language explanations.
    """
    final_records = []
    
    for idx, row in df_works.iterrows():
        w_id = row['work_id']
        
        dup_data = dup_results.get(w_id, {})
        cost_data = cost_results.get(w_id, {})
        split_data = split_results.get(w_id, {})
        time_data = time_results.get(w_id, {})
        
        combined_flags = []
        explanation_parts = []
        
        # Points allocation
        dup_points = 0.0
        if dup_data.get('flag'):
            combined_flags.append('FLAG_DUPLICATE_WORK')
            dup_score = dup_data.get('duplicate_score', 0.8)
            dup_points = dup_score * 45.0  # Up to 45 pts
            matched_id = dup_data.get('matched_work_id', 'UNKNOWN')
            sim_pct = dup_data.get('similarity_pct', 80.0)
            explanation_parts.append(f"Potential duplicate of work '{matched_id}' ({sim_pct}% textual & financial match)")
            
        cost_points = 0.0
        if cost_data.get('flags'):
            for f in cost_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            c_score = cost_data.get('cost_anomaly_score', 0.5)
            cost_points = c_score * 30.0  # Up to 30 pts
            explanation_parts.append(cost_data.get('details', 'Cost anomaly detected'))
            
        split_points = 0.0
        if split_data.get('flags'):
            for f in split_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            s_score = split_data.get('split_compliance_score', 0.5)
            split_points = s_score * 35.0  # Up to 35 pts
            explanation_parts.append(split_data.get('details', 'Compliance/split sanction rule triggered'))
            
        time_points = 0.0
        if time_data.get('flags'):
            for f in time_data['flags']:
                if f not in combined_flags:
                    combined_flags.append(f)
            t_score = time_data.get('time_lag_score', 0.4)
            time_points = t_score * 20.0  # Up to 20 pts
            explanation_parts.append(time_data.get('details', 'Execution or sanction lag detected'))
            
        # Count independent detectors that triggered
        detectors_flagged = 0
        if dup_data.get('flag'):
            detectors_flagged += 1
        if cost_data.get('flags'):
            detectors_flagged += 1
        if split_data.get('flags'):
            detectors_flagged += 1
        if time_data.get('flags'):
            detectors_flagged += 1
            
        # Calculate Confidence Score (0.0 to 1.0)
        if detectors_flagged >= 3:
            confidence_score = 0.95
            confidence_level = "High Confidence"
        elif detectors_flagged == 2:
            confidence_score = 0.80
            confidence_level = "High Confidence"
        elif detectors_flagged == 1:
            if dup_data.get('duplicate_score', 0) > 0.90 or cost_data.get('cost_anomaly_score', 0) > 0.80:
                confidence_score = 0.75
                confidence_level = "Moderate Confidence"
            else:
                confidence_score = 0.55
                confidence_level = "Moderate Confidence"
        else:
            confidence_score = 0.90  # Regular record with high confidence
            confidence_level = "High Confidence"

        # Composite score calculation (Max 100)
        total_raw_points = dup_points + cost_points + split_points + time_points
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
            'explanation': explanation
        })
        
    return final_records

